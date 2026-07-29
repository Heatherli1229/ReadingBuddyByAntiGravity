import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../context/ArticleContext';
import { useVocab } from '../context/VocabContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { speakWord } from '../utils/tts';
import { getWordHskLevel } from '../utils/vocabDetector';
import AudioPlayer from '../components/AudioPlayer';
import ParagraphAudioButton from '../components/ParagraphAudioButton';
import VocabPopup from '../components/VocabPopup';
import { normalizeDifficulty } from '../constants/difficulty';
import './ReadingPage.css';

function ReadingPage() {
    const { id } = useParams();
    const { getArticleById, updateArticle } = useArticles();
    const { currentUser } = useAuth();
    const article = getArticleById(id);

    // 若文章不存在，稍后返回加载状态
    const [viewsIncremented, setViewsIncremented] = useState(false);

    useEffect(() => {
        if (article && !viewsIncremented) {
            setViewsIncremented(true);
            // 延迟增加浏览量避免开发模式下 React 18 双重渲染副作用
            const currentViews = article.views || 0;
            updateArticle(article.id, { views: currentViews + 1 }).catch(e => {
                console.error("更新浏览量失败:", e);
            });

            // 记录用户已读文章历史
            if (currentUser?.id) {
                setDoc(doc(db, 'users', currentUser.id, 'readArticles', article.id), {
                    readAt: Date.now(),
                    title: article.title_cn || ''
                }, { merge: true }).catch(err => console.warn('记录阅读历史失败:', err));
            }
        }
    }, [article, viewsIncremented, updateArticle, currentUser]);

    const { addWord, isWordSaved } = useVocab();
    const [selectedWord, setSelectedWord] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1);

    // 如果文章不存在
    if (!article) {
        return (
            <div className="reading-page container">
                <div className="not-found">
                    <span className="not-found-icon">📭</span>
                    <h2>文章未找到</h2>
                    <p>抱歉，这篇文章不存在</p>
                    <Link to="/" className="btn btn-primary">返回首页</Link>
                </div>
            </div>
        );
    }

    const normalizedLevel = normalizeDifficulty(article.level);
    // 按照生词在文章中首次出现的绝对位置重新排序
    const orderedVocabulary = useMemo(() => {
        if (!article.vocabulary || !article.content) return article.vocabulary || [];
        
        // 纯文本形式的文章内容（去除 HTML 标签以精准计算位置）
        const textOnly = article.content.replace(/<[^>]+>/g, '');
        
        return [...article.vocabulary].sort((a, b) => {
            const posA = textOnly.indexOf(a.word);
            const posB = textOnly.indexOf(b.word);
            // 如果都找到，按出现先后；找不到的靠后
            if (posA !== -1 && posB !== -1) return posA - posB;
            if (posA !== -1) return -1;
            if (posB !== -1) return 1;
            return 0;
        });
    }, [article.vocabulary, article.content]);

    // 创建生词表（用于快速查找）
    const vocabMap = useMemo(() => {
        const map = new Map();
        orderedVocabulary.forEach(word => {
            map.set(word.word, word);
        });
        return map;
    }, [orderedVocabulary]);

    // 将普通文本片段进行生词分词高亮，并渲染为 React Spans
    const segmentAndHighlightText = (rawText, keyPrefix) => {
        if (!rawText) return null;

        const parts = [];
        let i = 0;
        while (i < rawText.length) {
            let matchedWord = null;
            const maxLen = Math.min(10, rawText.length - i);
            
            for (let len = maxLen; len > 0; len--) {
                const str = rawText.substring(i, i + len);
                if (vocabMap.has(str)) {
                    matchedWord = str;
                    break;
                }
            }

            if (matchedWord) {
                parts.push({ word: matchedWord, isVocab: true });
                i += matchedWord.length;
            } else {
                if (parts.length > 0 && !parts[parts.length - 1].isVocab) {
                    parts[parts.length - 1].word += rawText[i];
                } else {
                    parts.push({ word: rawText[i], isVocab: false });
                }
                i++;
            }
        }

        return parts.map((part, partIdx) => {
            if (part.isVocab) {
                const wordObj = vocabMap.get(part.word);
                const isSaved = isWordSaved(part.word);
                const hskLevel = getWordHskLevel(part.word) || wordObj.hskLevel || '1';
                return (
                    <span
                        key={`${keyPrefix}-vocab-${partIdx}`}
                        className={`vocab-word ${isSaved ? 'saved' : ''}`}
                        style={{ 
                            '--hsk-color': `var(--color-hsk-${hskLevel})`
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWord(wordObj);
                        }}
                    >
                        {part.word}
                    </span>
                );
            }
            
            return (
                <span key={`${keyPrefix}-text-${partIdx}`}>
                    {part.word}
                </span>
            );
        });
    };

    // 递归解析 HTML DOM 并渲染为交互式 React Elements
    const renderDomNode = (node, index) => {
        if (node.nodeType === 3) { // TEXT_NODE
            return segmentAndHighlightText(node.nodeValue, `node-${index}`);
        }

        if (node.nodeType === 1) { // ELEMENT_NODE
            const tagName = node.tagName.toLowerCase();
            const childElements = Array.from(node.childNodes).map((child, childIdx) => renderDomNode(child, childIdx));

            // 对特定的 HTML 元素套用精致排版样式
            switch (tagName) {
                case 'p':
                    // 如果是空段落
                    if (!node.textContent.trim() && !node.querySelector('img')) {
                        return <br key={index} />;
                    }
                    return (
                        <p key={index} className="reading-paragraph" style={{ marginBottom: '1rem', lineHeight: '1.8' }}>
                            {childElements}
                            {node.textContent.trim() && <ParagraphAudioButton text={node.textContent} rate={playbackRate} />}
                        </p>
                    );
                case 'h3':
                    return (
                        <div key={index} className="reading-heading-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.8rem', marginBottom: '0.8rem' }}>
                            <h3 className="reading-heading-h3" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-gray-900)', margin: 0 }}>
                                {childElements}
                            </h3>
                            {node.textContent.trim() && <ParagraphAudioButton text={node.textContent} rate={playbackRate} />}
                        </div>
                    );
                case 'ul':
                    return <ul key={index} className="reading-list" style={{ marginLeft: '1.5rem', marginBottom: '0.8rem' }}>{childElements}</ul>;
                case 'ol':
                    return <ol key={index} className="reading-list" style={{ marginLeft: '1.5rem', marginBottom: '0.8rem' }}>{childElements}</ol>;
                case 'li':
                    return (
                        <li key={index} className="reading-list-item" style={{ lineHeight: '1.8', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                <span style={{ flex: 1 }}>{childElements}</span>
                                {node.textContent.trim() && <ParagraphAudioButton text={node.textContent} rate={playbackRate} />}
                            </span>
                        </li>
                    );
                case 'strong':
                case 'b':
                    return <strong key={index}>{childElements}</strong>;
                case 'em':
                case 'i':
                    return <em key={index}>{childElements}</em>;
                case 'img':
                    const src = node.getAttribute('src');
                    const alt = node.getAttribute('alt') || '图片';
                    return (
                        <div key={index} className="rich-media-container">
                            <img src={src} alt={alt} className="rich-media-img" />
                            {alt && alt !== '图片' && alt !== '粘贴图片' && (
                                <span className="rich-media-caption">{alt}</span>
                            )}
                        </div>
                    );
                case 'br':
                    return <br key={index} />;
                default:
                    // 其他标签原样渲染
                    const CustomTag = tagName;
                    return <CustomTag key={index}>{childElements}</CustomTag>;
            }
        }

        return null;
    };

    // 将富文本 HTML 转换为带有生词标记和段落发音的元素
    const renderContent = () => {
        const content = article.content;
        if (!content) return null;

        // 如果是老数据（纯文本），包裹在段落中进行普通分词
        if (!content.trim().startsWith('<')) {
            return content.split('\n').map((paragraph, pIndex) => {
                if (!paragraph.trim()) return <br key={`br-${pIndex}`} />;
                return (
                    <p key={`p-${pIndex}`} className="reading-paragraph" style={{ marginBottom: '1rem', lineHeight: '1.8' }}>
                        {segmentAndHighlightText(paragraph, `old-${pIndex}`)}
                        <ParagraphAudioButton text={paragraph} rate={playbackRate} />
                    </p>
                );
            });
        }

        // 使用 DOMParser 解析富文本 HTML
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            return Array.from(doc.body.childNodes).map((node, index) => renderDomNode(node, index));
        } catch (e) {
            console.error('HTML解析失败，采用退回模式渲染：', e);
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }
    };

    // 获取等级颜色
    const getLevelClass = () => {
        switch (normalizedLevel) {
            case '入门级': return 'badge-entry';
            case '初级': return 'badge-beginner';
            case '中级': return 'badge-intermediate';
            case '高级': return 'badge-advanced';
            default: return 'badge-entry';
        }
    };
    const handleSpeakWord = (word) => {
        speakWord(word.word);
    };

    const handleAddWord = (word) => {
        addWord(word);
    };

    return (
        <div className="reading-page">
            {/* 返回按钮和标题 */}
            <header className="reading-header">
                <Link to="/" className="back-link">
                    ← 返回列表
                </Link>
                <div className="article-info">
                    <span className={`badge ${getLevelClass()}`}>{normalizedLevel}</span>
                    <span className="article-meta">{article.characters} 字 · {article.estimated_time}</span>
                </div>
            </header>

            <div className="reading-titles">
                <h1 className="reading-title-cn">{article.title_cn}</h1>
                <h2 className="reading-title-en">{article.title_en}</h2>
            </div>

            {/* 音频播放器 */}
            <AudioPlayer 
                text={article.content} 
                rate={playbackRate} 
                onRateChange={setPlaybackRate} 
            />

            {/* 文章内容区 */}
            <article className="reading-content card">
                <div className="content-text">
                    {renderContent()}
                </div>
                <div className="content-tip">
                    💡 点击<span className="vocab-demo">高亮词汇</span>查看释义
                </div>
            </article>

            {/* 本篇生词列表 */}
            <section className="vocab-section">
                <h3 className="vocab-section-title">
                    📚 本篇生词 ({orderedVocabulary.length})
                </h3>
                <div className="vocab-grid">
                    {orderedVocabulary.map((word, index) => {
                        const isSaved = isWordSaved(word.word);
                        const hskLevel = getWordHskLevel(word.word) || word.hskLevel || '1';
                        return (
                            <div key={index} className="vocab-card" style={{ '--hsk-color': `var(--color-hsk-${hskLevel})` }}>
                                <div className="vocab-card-header">
                                    <div className="vocab-word-group">
                                        <span className="vocab-card-word" style={{ color: `var(--color-hsk-${hskLevel})` }}>{word.word}</span>
                                        <span className="vocab-card-pinyin">{word.pinyin}</span>
                                    </div>
                                    <span className="vocab-card-hsk-badge" style={{ 
                                        backgroundColor: `color-mix(in srgb, var(--color-hsk-${hskLevel}) 12%, transparent)`,
                                        color: `var(--color-hsk-${hskLevel})`,
                                        borderColor: `color-mix(in srgb, var(--color-hsk-${hskLevel}) 30%, transparent)`
                                    }}>
                                        {hskLevel === 'Non-HSK' ? 'Non-HSK' : `HSK ${hskLevel}级`}
                                    </span>
                                </div>
                                <div className="vocab-card-body">
                                    {word.en && <p className="vocab-card-en">{word.en}</p>}
                                    {word.cn && <p className="vocab-card-cn">{word.cn}</p>}
                                </div>
                                <div className="vocab-card-actions">
                                    <button
                                        className="vocab-action-btn speak-btn"
                                        onClick={() => handleSpeakWord(word)}
                                        title="发音"
                                    >
                                        <span className="icon">🔊</span>
                                        <span>发音</span>
                                    </button>
                                    <button
                                        className={`vocab-action-btn save-btn ${isSaved ? 'saved' : ''}`}
                                        onClick={() => handleAddWord(word)}
                                        disabled={isSaved}
                                    >
                                        <span className="icon">{isSaved ? '✓' : '⭐'}</span>
                                        <span>{isSaved ? '已收藏' : '收藏'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 生词弹窗 */}
            {selectedWord && (
                <VocabPopup
                    word={selectedWord}
                    onClose={() => setSelectedWord(null)}
                />
            )}
        </div>
    );
}

export default ReadingPage;

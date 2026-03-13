import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../context/ArticleContext';
import { useVocab } from '../context/VocabContext';
import { speakWord } from '../utils/tts';
import { getWordHskLevel } from '../utils/vocabDetector';
import AudioPlayer from '../components/AudioPlayer';
import ParagraphAudioButton from '../components/ParagraphAudioButton';
import VocabPopup from '../components/VocabPopup';
import './ReadingPage.css';

function ReadingPage() {
    const { id } = useParams();
    const { getArticleById } = useArticles();
    const article = getArticleById(id);
    const { addWord, isWordSaved } = useVocab();
    const [selectedWord, setSelectedWord] = useState(null);

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

    // 创建生词表（用于快速查找）
    const vocabMap = useMemo(() => {
        const map = new Map();
        article.vocabulary.forEach(word => {
            map.set(word.word, word);
        });
        return map;
    }, [article.vocabulary]);

    // 将文章内容转换为带有生词标记和段落发音的元素
    const renderContent = () => {
        const content = article.content;
        const words = Array.from(vocabMap.keys()).sort((a, b) => b.length - a.length);
        const pattern = words.length > 0
            ? new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
            : null;

        return content.split('\n').map((paragraph, pIndex) => {
            if (!paragraph.trim()) {
                // 空行保留
                return <br key={`br-${pIndex}`} />;
            }

            // 对段落内容进行生词替换 - 使用正向最大匹配算法，防止子词覆盖（如“复杂”中的“杂”）
            const parts = [];
            let i = 0;
            while (i < paragraph.length) {
                let matchedWord = null;
                // 从当前位置向后匹配，优先匹配最长的词汇
                // 假设最长词汇长度不超过10个字符
                const maxLen = Math.min(10, paragraph.length - i);
                
                for (let len = maxLen; len > 0; len--) {
                    const str = paragraph.substring(i, i + len);
                    if (vocabMap.has(str)) {
                        matchedWord = str;
                        break;
                    }
                }

                if (matchedWord) {
                    // 如果之前累积了普通文本，先将其作为独立part推入，这样就只有遇到生词时才切割
                    parts.push(matchedWord);
                    i += matchedWord.length;
                } else {
                    // 如果当前字符不是生词的开头，则将其作为普通文本累积
                    // 为了优化 React 渲染，我们把连续的普通字符合并
                    if (parts.length > 0 && !vocabMap.has(parts[parts.length - 1])) {
                        parts[parts.length - 1] += paragraph[i];
                    } else {
                        parts.push(paragraph[i]);
                    }
                    i++;
                }
            }

            return (
                <p key={`p-${pIndex}`} className="reading-paragraph" style={{ marginBottom: '1rem', lineHeight: '1.8' }}>
                    {parts.map((part, index) => {
                        if (vocabMap.has(part)) {
                            const word = vocabMap.get(part);
                            const isSaved = isWordSaved(part);
                            const hskLevel = word.hskLevel || getWordHskLevel(part) || '1';
                            return (
                                <span
                                    key={index}
                                    className={`vocab-word ${isSaved ? 'saved' : ''}`}
                                    style={{ 
                                        color: `var(--color-hsk-${hskLevel})`, 
                                        borderBottomColor: `var(--color-hsk-${hskLevel})`, 
                                        backgroundColor: `color-mix(in srgb, var(--color-hsk-${hskLevel}) 15%, transparent)` 
                                    }}
                                    onClick={() => setSelectedWord(word)}
                                >
                                    {part}
                                </span>
                            );
                        }
                        return <span key={index}>{part}</span>;
                    })}
                    <ParagraphAudioButton text={paragraph} />
                </p>
            );
        });
    };

    // 获取等级颜色
    const getLevelClass = () => {
        switch (article.level) {
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
                    <span className={`badge ${getLevelClass()}`}>{article.level}</span>
                    <span className="article-meta">{article.characters} 字 · {article.estimated_time}</span>
                </div>
            </header>

            <div className="reading-titles">
                <h1 className="reading-title-cn">{article.title_cn}</h1>
                <h2 className="reading-title-en">{article.title_en}</h2>
            </div>

            {/* 音频播放器 */}
            <AudioPlayer text={article.content} />

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
                    📚 本篇生词 ({article.vocabulary.length})
                </h3>
                <div className="vocab-grid">
                    {article.vocabulary.map((word, index) => {
                        const isSaved = isWordSaved(word.word);
                        const hskLevel = word.hskLevel || getWordHskLevel(word.word) || '1';
                        return (
                            <div key={index} className="vocab-card card-flat" style={{ borderLeft: `4px solid var(--color-hsk-${hskLevel})` }}>
                                <div className="vocab-card-header">
                                    <span className="vocab-card-word" style={{ color: `var(--color-hsk-${hskLevel})` }}>{word.word}</span>
                                    <span className="vocab-card-pinyin">{word.pinyin}</span>
                                </div>
                                <div className="vocab-card-body">
                                    <p className="vocab-card-en">{word.en}</p>
                                    <p className="vocab-card-cn">{word.cn}</p>
                                    <p className="vocab-card-hsk" style={{ 
                                        backgroundColor: `color-mix(in srgb, var(--color-hsk-${hskLevel}) 15%, transparent)`,
                                        color: `var(--color-hsk-${hskLevel})`
                                    }}>
                                        HSK {hskLevel} 级
                                    </p>
                                </div>
                                <div className="vocab-card-actions">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => handleSpeakWord(word)}
                                    >
                                        🔊 发音
                                    </button>
                                    <button
                                        className={`btn btn-sm ${isSaved ? 'btn-ghost saved' : 'btn-primary'}`}
                                        onClick={() => handleAddWord(word)}
                                        disabled={isSaved}
                                    >
                                        {isSaved ? '✓ 已收藏' : '⭐ 收藏'}
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

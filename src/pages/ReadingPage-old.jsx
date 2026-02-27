import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArticles } from '../context/ArticleContext';
import { useVocab } from '../context/VocabContext';
import { speakWord } from '../utils/tts';
import AudioPlayer from '../components/AudioPlayer';
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

    // 将文章内容转换为带有生词标记的元素
    const renderContent = () => {
        const content = article.content;
        const words = Array.from(vocabMap.keys());

        // 按长度排序，优先匹配长词
        words.sort((a, b) => b.length - a.length);

        // 创建正则表达式匹配所有生词
        if (words.length === 0) return content;

        const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
        const parts = content.split(pattern);

        return parts.map((part, index) => {
            if (vocabMap.has(part)) {
                const word = vocabMap.get(part);
                const isSaved = isWordSaved(part);
                return (
                    <span
                        key={index}
                        className={`vocab-word ${isSaved ? 'saved' : ''}`}
                        onClick={() => setSelectedWord(word)}
                    >
                        {part}
                    </span>
                );
            }
            // 处理换行
            return part.split('\n').map((line, lineIndex) => (
                <span key={`${index}-${lineIndex}`}>
                    {lineIndex > 0 && <br />}
                    {line}
                </span>
            ));
        });
    };

    // 获取等级颜色
    const getLevelClass = () => {
        switch (article.level) {
            case '初级': return 'badge-beginner';
            case '中级': return 'badge-intermediate';
            case '高级': return 'badge-advanced';
            default: return 'badge-beginner';
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
                        return (
                            <div key={index} className="vocab-card card-flat">
                                <div className="vocab-card-header">
                                    <span className="vocab-card-word">{word.word}</span>
                                    <span className="vocab-card-pinyin">{word.pinyin}</span>
                                </div>
                                <div className="vocab-card-body">
                                    <p className="vocab-card-en">{word.en}</p>
                                    <p className="vocab-card-cn">{word.cn}</p>
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

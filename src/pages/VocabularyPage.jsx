import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVocab } from '../context/VocabContext';
import Flashcard from '../components/Flashcard';
import ExportModal from '../components/ExportModal';
import { speakWord } from '../utils/tts';
import './VocabularyPage.css';

function VocabularyPage() {
    const { 
        savedWords, 
        unmasteredWords, 
        masteredWords, 
        getRandomWords, 
        wordCount, 
        masteredCount,
        unmasteredCount,
        clearAllWords 
    } = useVocab();

    const [activeTab, setActiveTab] = useState('unmastered'); // 'unmastered' | 'mastered' | 'all'
    const [isPracticing, setIsPracticing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [practiceWords, setPracticeWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 开始练习（优先复习未学会的生词）
    const startPractice = () => {
        if (wordCount === 0) return;
        const words = getRandomWords(wordCount, false);
        setPracticeWords(words);
        setCurrentIndex(0);
        setIsPracticing(true);
    };

    // 下一个词
    const nextWord = () => {
        if (currentIndex < practiceWords.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsPracticing(false);
        }
    };

    // 退出练习
    const exitPractice = () => {
        setIsPracticing(false);
        setPracticeWords([]);
        setCurrentIndex(0);
    };

    // 当前切页的词汇数组
    const displayWords = savedWords.filter(w => {
        if (activeTab === 'unmastered') return !w.mastered;
        if (activeTab === 'mastered') return !!w.mastered;
        return true;
    });

    const masteredPct = wordCount > 0 ? Math.round((masteredCount / wordCount) * 100) : 0;

    // 练习模式视图
    if (isPracticing && practiceWords.length > 0) {
        const currentWord = practiceWords[currentIndex];
        const isLast = currentIndex === practiceWords.length - 1;

        return (
            <div className="vocab-page practice-mode">
                <div className="practice-header">
                    <button className="btn btn-ghost" onClick={exitPractice}>
                        ← 退出练习
                    </button>
                    <span className="practice-progress">
                        {currentIndex + 1} / {practiceWords.length}
                    </span>
                </div>

                <div className="practice-card-container">
                    <Flashcard word={currentWord} showRemove={false} />
                </div>

                <div className="practice-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => speakWord(currentWord.word)}
                    >
                        🔊 发音
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={nextWord}
                    >
                        {isLast ? '完成练习 🎉' : '下一个 →'}
                    </button>
                </div>

                <div className="practice-tip">
                    💡 点击卡片翻转查看释义，点击「学会了」标记掌握
                </div>
            </div>
        );
    }

    // 空状态
    if (wordCount === 0) {
        return (
            <div className="vocab-page">
                <header className="vocab-header">
                    <h1 className="vocab-title">我的生词库 📝</h1>
                </header>

                <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <h2>还没有收藏任何生词</h2>
                    <p>阅读文章时，点击生词并收藏，就会出现在这里啦！</p>
                    <Link to="/" className="btn btn-primary">
                        去阅读文章
                    </Link>
                </div>
            </div>
        );
    }

    // 生词库列表视图
    return (
        <div className="vocab-page">
            <header className="vocab-header">
                <div className="vocab-header-left">
                    <h1 className="vocab-title">我的生词库 📝</h1>
                    <span className="vocab-count-badge">{wordCount} 个生词</span>
                </div>
                <div className="vocab-header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsExporting(true)}
                    >
                        📥 导出生词本
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={startPractice}
                    >
                        🎲 复习未学会词汇 ({unmasteredCount})
                    </button>
                </div>
            </header>

            {/* 掌握进度条 */}
            <div className="vocab-progress-card">
                <div className="vocab-progress-header">
                    <span className="progress-title">🎯 掌握进度榜</span>
                    <span className="progress-info">
                        已学会 <strong>{masteredCount}</strong> / {wordCount} 词 ({masteredPct}%)
                    </span>
                </div>
                <div className="vocab-progress-bg">
                    <div className="vocab-progress-fill" style={{ width: `${masteredPct}%` }} />
                </div>
            </div>

            {/* 过滤切页 Tabs */}
            <div className="vocab-tabs">
                <button
                    className={`vocab-tab ${activeTab === 'unmastered' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unmastered')}
                >
                    📖 学习中 ({unmasteredCount})
                </button>
                <button
                    className={`vocab-tab ${activeTab === 'mastered' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mastered')}
                >
                    ✅ 已学会 ({masteredCount})
                </button>
                <button
                    className={`vocab-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    📚 全部 ({wordCount})
                </button>
            </div>

            {/* 卡片列表 */}
            {displayWords.length === 0 ? (
                <div className="empty-sub-state">
                    {activeTab === 'mastered' ? '还没有标记已学会的词汇，加油练习吧！💪' : '所有生词都已学会，真棒！🎉'}
                </div>
            ) : (
                <div className="flashcard-grid">
                    {displayWords.map((word, index) => (
                        <Flashcard key={`${word.word}-${index}`} word={word} />
                    ))}
                </div>
            )}

            <div className="vocab-footer">
                <button
                    className="btn btn-ghost clear-btn"
                    onClick={() => {
                        if (confirm('确定要清空所有生词吗？')) {
                            clearAllWords();
                        }
                    }}
                >
                    🗑️ 清空生词库
                </button>
            </div>

            {/* 导出弹窗 */}
            {isExporting && (
                <ExportModal
                    words={savedWords}
                    onClose={() => setIsExporting(false)}
                />
            )}
        </div>
    );
}

export default VocabularyPage;

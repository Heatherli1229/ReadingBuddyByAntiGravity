import { useVocab } from '../context/VocabContext';
import { speakWord } from '../utils/tts';
import { getWordHskLevel } from '../utils/vocabDetector';
import './VocabPopup.css';

function VocabPopup({ word, onClose }) {
    const { addWord, removeWord, isWordSaved } = useVocab();
    const isSaved = isWordSaved(word.word);
    const hskLevel = word.hskLevel || getWordHskLevel(word.word) || '1';

    const handleSpeak = () => {
        speakWord(word.word);
    };

    const handleToggleSave = () => {
        if (isSaved) {
            removeWord(word.word);
        } else {
            addWord(word);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="vocab-popup-backdrop" onClick={handleBackdropClick}>
            <div className="vocab-popup animate-slideUp">
                <button className="popup-close" onClick={onClose} aria-label="关闭">
                    ✕
                </button>

                <div className="popup-header">
                    <h3 className="popup-word">{word.word}</h3>
                    <span className="popup-pinyin">{word.pinyin}</span>
                </div>

                <div className="popup-content">
                    <div className="popup-definition">
                        <span className="definition-label">英文</span>
                        <span className="definition-text">{word.en}</span>
                    </div>
                    <div className="popup-definition">
                        <span className="definition-label">中文</span>
                        <span className="definition-text">{word.cn}</span>
                    </div>
                    <div className="popup-definition">
                        <span className="definition-label">HSK等级</span>
                        <span className="definition-text popup-hsk-badge" style={{ 
                            backgroundColor: `color-mix(in srgb, var(--color-hsk-${hskLevel}) 15%, transparent)`,
                            color: `var(--color-hsk-${hskLevel})`
                        }}>HSK {hskLevel} 级</span>
                    </div>
                </div>

                <div className="popup-actions">
                    <button
                        className="btn btn-secondary popup-btn"
                        onClick={handleSpeak}
                    >
                        🔊 发音
                    </button>
                    <button
                        className={`btn popup-btn ${isSaved ? 'btn-ghost saved' : 'btn-primary'}`}
                        onClick={handleToggleSave}
                    >
                        {isSaved ? '✓ 已收藏' : '⭐ 加入生词库'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VocabPopup;

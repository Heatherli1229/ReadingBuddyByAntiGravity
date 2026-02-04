import { useState } from 'react';
import { useVocab } from '../context/VocabContext';
import { speakWord } from '../utils/tts';
import './Flashcard.css';

function Flashcard({ word, showRemove = true }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const { removeWord } = useVocab();

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleSpeak = (e) => {
        e.stopPropagation();
        speakWord(word.word);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        removeWord(word.word);
    };

    return (
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="flashcard-inner">
                {/* 正面 */}
                <div className="flashcard-front">
                    <div className="flashcard-content">
                        <h3 className="flashcard-word">{word.word}</h3>
                        <p className="flashcard-pinyin">{word.pinyin}</p>
                    </div>
                    <div className="flashcard-hint">点击翻转 👆</div>
                </div>

                {/* 背面 */}
                <div className="flashcard-back">
                    <div className="flashcard-content">
                        <div className="flashcard-definition">
                            <span className="def-label">English</span>
                            <span className="def-text">{word.en}</span>
                        </div>
                        <div className="flashcard-definition">
                            <span className="def-label">中文</span>
                            <span className="def-text">{word.cn}</span>
                        </div>
                    </div>
                    <div className="flashcard-hint">点击翻转 👆</div>
                </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flashcard-actions">
                <button
                    className="flashcard-action-btn speak"
                    onClick={handleSpeak}
                    aria-label="发音"
                >
                    🔊
                </button>
                {showRemove && (
                    <button
                        className="flashcard-action-btn remove"
                        onClick={handleRemove}
                        aria-label="移除"
                    >
                        ❌
                    </button>
                )}
            </div>
        </div>
    );
}

export default Flashcard;

import { useState, useEffect } from 'react';
import { speakArticle, stopSpeaking, pauseSpeaking, resumeSpeaking, isSpeaking, initVoices } from '../utils/tts';
import './AudioPlayer.css';

function AudioPlayer({ text }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [isReady, setIsReady] = useState(false);

    const rates = [0.75, 1, 1.25, 1.5];

    // 初始化语音
    useEffect(() => {
        initVoices().then(() => setIsReady(true));
    }, []);

    // 组件卸载时停止播放
    useEffect(() => {
        return () => stopSpeaking();
    }, []);

    const handlePlay = async () => {
        if (isPaused) {
            resumeSpeaking();
            setIsPaused(false);
            setIsPlaying(true);
        } else if (isPlaying) {
            pauseSpeaking();
            setIsPaused(true);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            try {
                await speakArticle(text, rate);
            } catch (e) {
                console.error('TTS error:', e);
            }
            setIsPlaying(false);
            setIsPaused(false);
        }
    };

    const handleStop = () => {
        stopSpeaking();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const handleRateChange = (newRate) => {
        setRate(newRate);
        // 如果正在播放，重新开始
        if (isPlaying || isPaused) {
            handleStop();
        }
    };

    if (!isReady) {
        return (
            <div className="audio-player loading">
                <span className="loading-text">正在加载语音引擎...</span>
            </div>
        );
    }

    return (
        <div className="audio-player">
            <div className="player-controls">
                <button
                    className="btn btn-icon play-btn"
                    onClick={handlePlay}
                    aria-label={isPlaying ? '暂停' : '播放'}
                >
                    {isPlaying ? '⏸️' : isPaused ? '▶️' : '▶️'}
                </button>

                <button
                    className="btn btn-icon btn-ghost stop-btn"
                    onClick={handleStop}
                    disabled={!isPlaying && !isPaused}
                    aria-label="停止"
                >
                    ⏹️
                </button>

                <div className="player-status">
                    {isPlaying && <span className="status-playing">正在朗读...</span>}
                    {isPaused && <span className="status-paused">已暂停</span>}
                    {!isPlaying && !isPaused && <span className="status-ready">点击播放收听全文</span>}
                </div>
            </div>

            <div className="rate-controls">
                <span className="rate-label">语速：</span>
                <div className="rate-buttons">
                    {rates.map(r => (
                        <button
                            key={r}
                            className={`rate-btn ${rate === r ? 'active' : ''}`}
                            onClick={() => handleRateChange(r)}
                        >
                            {r}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;

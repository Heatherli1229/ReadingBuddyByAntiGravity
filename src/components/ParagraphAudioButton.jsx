import { useState, useEffect } from 'react';
import { speakArticle, stopSpeaking, pauseSpeaking, resumeSpeaking, isSpeaking } from '../utils/tts';

function ParagraphAudioButton({ text, rate = 1 }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // 组件卸载时不要全局停止，因为可能是别的段落在播，
    // 这里只管自己的状态复位
    useEffect(() => {
        return () => {
            if (isPlaying || isPaused) {
                // stopSpeaking();
            }
        };
    }, [isPlaying, isPaused]);

    const handlePlay = async (e) => {
        e.stopPropagation(); // 防止点击事件冒泡到阅读区域外层

        if (isPaused) {
            resumeSpeaking();
            setIsPaused(false);
            setIsPlaying(true);
        } else if (isPlaying) {
            pauseSpeaking();
            setIsPaused(true);
            setIsPlaying(false);
        } else {
            // 开始播放新段落前，先停止正在播放的内容
            stopSpeaking();
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

    return (
        <button
            className={`btn btn-icon btn-sm paragraph-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlay}
            title={isPlaying ? '暂停本段' : '播放本段'}
            style={{
                marginLeft: '8px',
                verticalAlign: 'middle',
                width: '28px',
                height: '28px',
                fontSize: '14px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPlaying ? 'var(--color-primary)' : 'var(--color-gray-500)',
                background: isPlaying ? 'var(--color-primary-50)' : 'transparent',
                border: '1px solid',
                borderColor: isPlaying ? 'var(--color-primary-200)' : 'var(--color-gray-200)',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {isPlaying ? '⏸️' : '▶️'}
        </button>
    );
}

export default ParagraphAudioButton;

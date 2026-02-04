// TTS 工具函数 - 使用 Web Speech API

// 检查浏览器是否支持 TTS
export const isTTSSupported = () => {
    return 'speechSynthesis' in window;
};

// 获取中文语音
const getChineseVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // 优先选择中文普通话
    const chineseVoice = voices.find(voice =>
        voice.lang.includes('zh-CN') ||
        voice.lang.includes('zh_CN') ||
        voice.lang.includes('cmn')
    );
    // 备选任何中文声音
    const anyChineseVoice = voices.find(voice =>
        voice.lang.includes('zh')
    );
    return chineseVoice || anyChineseVoice || null;
};

// 朗读文本
export const speak = (text, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!isTTSSupported()) {
            reject(new Error('当前浏览器不支持语音合成'));
            return;
        }

        // 停止之前的朗读
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // 设置语言为中文
        utterance.lang = 'zh-CN';

        // 获取中文语音
        const chineseVoice = getChineseVoice();
        if (chineseVoice) {
            utterance.voice = chineseVoice;
        }

        // 设置语速 (0.1 - 10)
        utterance.rate = options.rate || 1;

        // 设置音调 (0 - 2)
        utterance.pitch = options.pitch || 1;

        // 设置音量 (0 - 1)
        utterance.volume = options.volume || 1;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);

        window.speechSynthesis.speak(utterance);
    });
};

// 朗读单词
export const speakWord = (word, rate = 0.8) => {
    return speak(word, { rate });
};

// 朗读文章
export const speakArticle = (text, rate = 1) => {
    return speak(text, { rate });
};

// 停止朗读
export const stopSpeaking = () => {
    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
    }
};

// 暂停朗读
export const pauseSpeaking = () => {
    if (isTTSSupported()) {
        window.speechSynthesis.pause();
    }
};

// 恢复朗读
export const resumeSpeaking = () => {
    if (isTTSSupported()) {
        window.speechSynthesis.resume();
    }
};

// 检查是否正在朗读
export const isSpeaking = () => {
    return isTTSSupported() && window.speechSynthesis.speaking;
};

// 初始化语音（某些浏览器需要先加载语音列表）
export const initVoices = () => {
    return new Promise((resolve) => {
        if (!isTTSSupported()) {
            resolve([]);
            return;
        }

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // 等待语音列表加载
        window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
        };
    });
};

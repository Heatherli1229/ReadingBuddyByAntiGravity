// TTS 工具函数 - 使用 Web Speech API

// 检查浏览器是否支持 TTS
export const isTTSSupported = () => {
    return 'speechSynthesis' in window;
};

// 获取中文语音（优先筛选神经网络与自然语音）
const getChineseVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 过滤中文语音
    const chineseVoices = voices.filter(voice =>
        voice.lang.includes('zh-CN') ||
        voice.lang.includes('zh_CN') ||
        voice.lang.includes('cmn') ||
        voice.lang.includes('zh')
    );

    if (chineseVoices.length === 0) return null;

    // 针对不同声音的品质进行打分排名
    const scoreVoice = (voice) => {
        const name = voice.name.toLowerCase();
        let score = 0;

        // 微软晓晓、云希等优质自然音
        if (name.includes('xiaoxiao')) score += 100;
        if (name.includes('yunxi')) score += 95;
        if (name.includes('yunjian')) score += 90;
        if (name.includes('xiaoyi')) score += 85;

        // 神经网络 / 自然声关键字
        if (name.includes('natural')) score += 50;
        if (name.includes('neural')) score += 50;
        if (name.includes('online')) score += 30;
        if (name.includes('google')) score += 40;
        if (name.includes('premium')) score += 30;

        // 优先 zh-CN 普通话
        if (voice.lang.includes('zh-CN') || voice.lang.includes('zh_CN')) score += 20;

        return score;
    };

    // 按分数倒序排列
    chineseVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));

    return chineseVoices[0];
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

        if (!text) {
            resolve();
            return;
        }

        // 1. 自动剥离 HTML 标签（如 <p>, <h3>, <strong> 等），替换换行为自然停顿逗号
        let plainText = text
            .replace(/<br\s*\/?>/gi, '，')
            .replace(/<\/p>/gi, '。')
            .replace(/<\/h[1-6]>/gi, '。')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!plainText) {
            resolve();
            return;
        }

        // 2. 切分长长文本（浏览器 TTS 对超过 200 字的长文本容易遭遇静音中断 BUG）
        // 按句号、问号、感叹号、换行拆分为短句
        const sentences = plainText.match(/[^。！？!?;\n]+[。！？!?;\n]?/g) || [plainText];

        let index = 0;

        const speakNextSentence = () => {
            if (index >= sentences.length) {
                resolve();
                return;
            }

            const sentence = sentences[index].trim();
            if (!sentence) {
                index++;
                speakNextSentence();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = 'zh-CN';

            const chineseVoice = getChineseVoice();
            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }

            utterance.rate = options.rate || 1;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            utterance.onend = () => {
                index++;
                speakNextSentence();
            };

            utterance.onerror = (e) => {
                // 如果是手动 cancel 导致，不再继续后续句子
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    resolve();
                } else {
                    index++;
                    speakNextSentence();
                }
            };

            window.speechSynthesis.speak(utterance);
        };

        speakNextSentence();
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

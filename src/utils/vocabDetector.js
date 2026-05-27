// 智能生词识别系统 v4 (基于 jieba-wasm + HSK 2025大纲)
// 使用 jieba 中文分词引擎替代正向最大匹配算法

import { 
    HSK_LEVEL_1, HSK_LEVEL_2, HSK_LEVEL_3, HSK_LEVEL_4, 
    HSK_LEVEL_5, HSK_LEVEL_6, HSK_LEVEL_7_9 
} from '../data/hskVocab';
import { VOCABULARY_DATABASE } from '../data/vocabDefinitions';
import { initJieba, segmentText, isJiebaReady } from './jiebaService';

// ===== HSK 词汇映射表 =====
export const HSK_VOCAB_MAP = new Map();

// 构建 HSK 词汇 → 等级 映射
const hskSets = [
    { set: HSK_LEVEL_1, level: '1' },
    { set: HSK_LEVEL_2, level: '2' },
    { set: HSK_LEVEL_3, level: '3' },
    { set: HSK_LEVEL_4, level: '4' },
    { set: HSK_LEVEL_5, level: '5' },
    { set: HSK_LEVEL_6, level: '6' },
    { set: HSK_LEVEL_7_9, level: '7-9' },
];

for (const { set, level } of hskSets) {
    for (const w of set) {
        // 清理数字后缀标注（如 "两1" → "两"，"会1" → "会"）
        const cleanWord = w.replace(/\d+$/, '');
        if (cleanWord.length > 0) {
            HSK_VOCAB_MAP.set(cleanWord, level);
        }
    }
}

/**
 * 判断是否为汉字
 */
function isChinese(char) {
    return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * 判断一个词语是否包含至少一个汉字
 */
function containsChinese(word) {
    return /[\u4e00-\u9fa5]/.test(word);
}

/**
 * 根据等级设置判断哪些词应该被识别为生词
 * 入门级: 包含大纲里能找到的所有（1,2,3,4,5,6,7-9）
 * 初级: 包含大纲里2,3,4,5,6,7-9能找到的
 * 中级: 包含大纲里4,5,6,7-9能找到的
 * 高级: 包含大纲里6,7-9能找到的
 */
function shouldBeVocab(hskLevel, articleLevel) {
    if (!hskLevel) return false;
    
    if (hskLevel === 'Non-HSK') return true;

    if (articleLevel === '入门级') {
        return true;
    }
    
    if (articleLevel === '初级') {
        return hskLevel !== '1';
    }
    
    if (articleLevel === '中级') {
        return !['1', '2', '3'].includes(hskLevel);
    }
    
    if (articleLevel === '高级') {
        return ['6', '7-9'].includes(hskLevel);
    }
    
    return true; // 默认
}

/**
 * 智能识别文章中的生词 - 使用 jieba 分词引擎
 * @param {string} content 文章内容
 * @param {string} level 文章等级：入门级/初级/中级/高级
 * @returns {Promise<Array>} 生词列表
 */
export async function autoDetectVocabulary(content, level) {
    // 确保 jieba 已初始化
    await initJieba();

    const vocabularyMap = new Map();
    
    // 使用 jieba 分词
    const segments = segmentText(content);
    
    for (const word of segments) {
        // 跳过非中文词（标点、空格、数字等）
        if (!containsChinese(word)) continue;
        
        // 查找 HSK 等级
        let hskLevel = HSK_VOCAB_MAP.get(word);
        
        // 如果在 HSK 词库中找不到，且是多字词，标记为 Non-HSK
        if (!hskLevel && word.length >= 2) {
            hskLevel = 'Non-HSK';
        }
        
        // 单字且不在 HSK 词库中 → 跳过（减少噪音）
        if (!hskLevel) continue;

        if (shouldBeVocab(hskLevel, level)) {
            if (!vocabularyMap.has(word)) {
                const def = getWordDefinition(word) || {};
                vocabularyMap.set(word, {
                    word,
                    hskLevel,
                    pinyin: def.pinyin || '',
                    en: def.en || '',
                    cn: def.cn || ''
                });
            }
        }
    }

    const vocabulary = Array.from(vocabularyMap.values());

    // 按 HSK 等级排序
    vocabulary.sort((a, b) => {
        const levelA = a.hskLevel === 'Non-HSK' ? 8 : (a.hskLevel === '7-9' ? 7 : parseInt(a.hskLevel));
        const levelB = b.hskLevel === 'Non-HSK' ? 8 : (b.hskLevel === '7-9' ? 7 : parseInt(b.hskLevel));
        return levelA - levelB;
    });

    return vocabulary;
}

/**
 * 使用 jieba 对段落文本进行分词（用于阅读页面渲染）
 * 返回分词结果数组
 * @param {string} text 段落文本
 * @returns {string[]} 分词结果
 */
export function segmentParagraph(text) {
    if (!isJiebaReady()) {
        // jieba 未就绪时，回退到逐字符切分
        return [...text];
    }
    return segmentText(text);
}

/**
 * 获取词汇释义（如果已知）
 */
export function getWordDefinition(word) {
    if (!VOCABULARY_DATABASE) return null;
    return VOCABULARY_DATABASE[word] || null;
}

/**
 * 获取词汇的HSK等级
 */
export function getWordHskLevel(word) {
    return HSK_VOCAB_MAP.get(word) || null;
}

/**
 * 分析文章难度（基于HSK词汇等级分布）
 */
export async function analyzeArticleDifficulty(content) {
    const chars = [...content].filter(isChinese);
    if (chars.length === 0) return { level: '入门级', stats: {} };

    const wordsFound = await autoDetectVocabulary(content, '入门级');
    
    let highestLevel = 1;
    for (const w of wordsFound) {
        let lv = w.hskLevel === 'Non-HSK' ? 8 : (w.hskLevel === '7-9' ? 7 : parseInt(w.hskLevel));
        if (lv > highestLevel) highestLevel = lv;
    }
    
    let suggestedLevel = '入门级';
    if (highestLevel <= 2) {
        suggestedLevel = '入门级';
    } else if (highestLevel <= 4) {
        suggestedLevel = '初级';
    } else if (highestLevel <= 5) {
        suggestedLevel = '中级';
    } else {
        suggestedLevel = '高级';
    }

    let displayHighestLevel = highestLevel.toString();
    if (highestLevel === 7) displayHighestLevel = '7-9';
    if (highestLevel === 8) displayHighestLevel = 'Non-HSK';

    return {
        level: suggestedLevel,
        stats: {
            totalChars: chars.length,
            vocabCount: wordsFound.length,
            highestLevel: displayHighestLevel
        }
    };
}

export { VOCABULARY_DATABASE };

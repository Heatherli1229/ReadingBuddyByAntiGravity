// 智能生词识别系统 v3 (基于HSK 2025大纲)
// 根据文章等级动态决定哪些词被标记为生词

import { 
    HSK_LEVEL_1, HSK_LEVEL_2, HSK_LEVEL_3, HSK_LEVEL_4, 
    HSK_LEVEL_5, HSK_LEVEL_6, HSK_LEVEL_7_9 
} from '../data/hskVocab';
import { VOCABULARY_DATABASE } from '../data/vocabDefinitions';

export const HSK_VOCAB_MAP = new Map();

for (const w of HSK_LEVEL_1) HSK_VOCAB_MAP.set(w, '1');
for (const w of HSK_LEVEL_2) HSK_VOCAB_MAP.set(w, '2');
for (const w of HSK_LEVEL_3) HSK_VOCAB_MAP.set(w, '3');
for (const w of HSK_LEVEL_4) HSK_VOCAB_MAP.set(w, '4');
for (const w of HSK_LEVEL_5) HSK_VOCAB_MAP.set(w, '5');
for (const w of HSK_LEVEL_6) HSK_VOCAB_MAP.set(w, '6');
for (const w of HSK_LEVEL_7_9) HSK_VOCAB_MAP.set(w, '7-9');

/**
 * 判断是否为汉字
 */
function isChinese(char) {
    return /[\u4e00-\u9fa5]/.test(char);
}

const allKnownWordsSet = new Set(HSK_VOCAB_MAP.keys());
for (const w in VOCABULARY_DATABASE) {
    if (!allKnownWordsSet.has(w) && isChinese(w)) {
        HSK_VOCAB_MAP.set(w, 'Non-HSK');
    }
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
 * 智能识别文章中的生词 - 使用正向最大匹配算法 (Forward Maximum Matching)
 * 首先用完整的HSK词库对文本进行分词，避免“复杂”中的“杂”被单独识别。
 * @param {string} content 文章内容
 * @param {string} level 文章等级：入门级/初级/中级/高级
 * @returns {Array} 生词列表
 */
export function autoDetectVocabulary(content, level) {
    const vocabularyMap = new Map();
    
    const allKnownWords = Array.from(HSK_VOCAB_MAP.keys());
    let maxLength = 0;
    for (const word of allKnownWords) {
        if (word.length > maxLength) maxLength = word.length;
    }

    let i = 0;
    while (i < content.length) {
        let matched = false;
        for (let len = Math.min(maxLength, content.length - i); len > 0; len--) {
            const str = content.substring(i, i + len);
            if (HSK_VOCAB_MAP.has(str)) {
                const hskLevel = HSK_VOCAB_MAP.get(str);
                
                if (shouldBeVocab(hskLevel, level)) {
                    if (!vocabularyMap.has(str)) {
                        const def = getWordDefinition(str) || {};
                        vocabularyMap.set(str, {
                            word: str,
                            hskLevel,
                            pinyin: def.pinyin || '',
                            en: def.en || '',
                            cn: def.cn || ''
                        });
                    }
                }
                
                i += len;
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            i += 1;
        }
    }

    const vocabulary = Array.from(vocabularyMap.values());

    vocabulary.sort((a, b) => {
        const levelA = a.hskLevel === 'Non-HSK' ? 8 : (a.hskLevel === '7-9' ? 7 : parseInt(a.hskLevel));
        const levelB = b.hskLevel === 'Non-HSK' ? 8 : (b.hskLevel === '7-9' ? 7 : parseInt(b.hskLevel));
        return levelA - levelB;
    });

    return vocabulary;
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
export function analyzeArticleDifficulty(content) {
    const chars = [...content].filter(isChinese);
    if (chars.length === 0) return { level: '入门级', stats: {} };

    const wordsFound = autoDetectVocabulary(content, '入门级');
    
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

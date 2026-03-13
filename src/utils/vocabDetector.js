// 智能生词识别系统 v3 (基于HSK 2025大纲)
// 根据文章等级动态决定哪些词被标记为生词

import { HSK_VOCAB_MAP } from '../data/hskVocab';
import { VOCABULARY_DATABASE } from '../data/vocabDefinitions';

/**
 * 判断是否为汉字
 */
function isChinese(char) {
    return /[\u4e00-\u9fa5]/.test(char);
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
    
    // 入门级：所有都标
    if (articleLevel === '入门级') {
        return true;
    }
    
    // 初级：2及以上都标
    if (articleLevel === '初级') {
        return hskLevel !== '1';
    }
    
    // 中级：4及以上都标
    if (articleLevel === '中级') {
        return !['1', '2', '3'].includes(hskLevel);
    }
    
    // 高级：6及以上都标
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
    const vocabularyMap = new Map(); // 使用Map避免重复，并方便提取
    
    // 取出所有已知词汇
    const allKnownWords = Array.from(HSK_VOCAB_MAP.keys());
    // 找出最长词的长度，用于优化的最大匹配
    let maxLength = 0;
    for (const word of allKnownWords) {
        if (word.length > maxLength) maxLength = word.length;
    }

    // 正向最大匹配分词
    let i = 0;
    while (i < content.length) {
        let matched = false;
        // 从最大长度开始向后截取尝试匹配
        for (let len = Math.min(maxLength, content.length - i); len > 0; len--) {
            const str = content.substring(i, i + len);
            if (HSK_VOCAB_MAP.has(str)) {
                // 找到完整的HSK词汇
                const hskLevel = HSK_VOCAB_MAP.get(str);
                
                // 判断这个词是否应该在该文章难度中被标记为生词
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
                
                // 无论是否符合当前等级的生词标准，既然匹配到了这是一个HSK词汇（比如“复杂”），
                // 就应该跳过整个词的长度，这样里面的子字（比如“杂”）就不会被单独识别了。
                i += len;
                matched = true;
                break;
            }
        }
        
        // 如果没有匹配到任何HSK词汇，则单字跳过
        if (!matched) {
            i += 1;
        }
    }

    const vocabulary = Array.from(vocabularyMap.values());

    // 按照HSK难度等级排序
    vocabulary.sort((a, b) => {
        const levelA = a.hskLevel === '7-9' ? 7 : parseInt(a.hskLevel);
        const levelB = b.hskLevel === '7-9' ? 7 : parseInt(b.hskLevel);
        return levelA - levelB;
    });

    return vocabulary;
}

/**
 * 获取词汇释义（如果已知）
 */
export function getWordDefinition(word) {
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

    // 获取所有生词
    const wordsFound = autoDetectVocabulary(content, '入门级');
    
    // 找出最高频或最高等级决定文章难度
    let highestLevel = 1;
    for (const w of wordsFound) {
        let lv = w.hskLevel === '7-9' ? 7 : parseInt(w.hskLevel);
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

    return {
        level: suggestedLevel,
        stats: {
            totalChars: chars.length,
            vocabCount: wordsFound.length,
            highestLevel: highestLevel === 7 ? '7-9' : highestLevel.toString()
        }
    };
}

// 导出释义库供其他模块使用
export { VOCABULARY_DATABASE };

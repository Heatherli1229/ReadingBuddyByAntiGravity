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
 * 智能识别文章中的生词
 * @param {string} content 文章内容
 * @param {string} level 文章等级：入门级/初级/中级/高级
 * @returns {Array} 生词列表
 */
export function autoDetectVocabulary(content, level) {
    const vocabulary = [];
    const addedWords = new Set();
    
    // 取出所有已知词汇，按长度降序排序（长词优先匹配避免子词覆盖）
    const allKnownWords = Array.from(HSK_VOCAB_MAP.keys());
    const sortedWords = allKnownWords.sort((a, b) => b.length - a.length);

    // 遍历所有词汇，检查是否在文章中出现
    for (const word of sortedWords) {
        if (addedWords.has(word)) continue;
        
        // 简单匹配算法，更好的方式是用分词工具，但这里为了保持无依赖直接用包含
        if (content.includes(word)) {
            const hskLevel = HSK_VOCAB_MAP.get(word);
            
            if (shouldBeVocab(hskLevel, level)) {
                const def = getWordDefinition(word) || {};
                vocabulary.push({
                    word,
                    hskLevel, // 保存HSK等级
                    pinyin: def.pinyin || '',
                    en: def.en || '',
                    cn: def.cn || ''
                });
                addedWords.add(word);
            }
        }
    }

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

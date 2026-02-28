// 智能生词识别系统 v3
// 基于HSK 2025官方词汇大纲（10,888词）

import { HSK_VOCAB_MAP, ARTICLE_LEVEL_CONFIG } from '../data/hskVocab';
import { VOCABULARY_DATABASE } from '../data/vocabDefinitions';

/**
 * 判断一个字符是否为汉字
 */
function isChinese(char) {
    return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * 智能识别文章中的生词（基于HSK 2025大纲）
 * @param {string} content 文章内容
 * @param {string} level 文章等级：入门级/初级/中级/高级
 * @returns {Array} 生词列表，每个词包含 { word, pinyin, en, cn, hskLevel }
 */
export function autoDetectVocabulary(content, level) {
    if (!content || !content.trim()) return [];

    // 获取当前等级对应的HSK等级过滤条件
    const allowedLevels = ARTICLE_LEVEL_CONFIG[level] || ARTICLE_LEVEL_CONFIG['入门级'];

    const vocabulary = [];
    const addedWords = new Set();

    // 用于记录文章中哪些字符已被匹配，防止交叉重叠（如 "早上下雪" 误认出 "上下"）
    const usedChars = new Array(content.length).fill(false);

    // 单字常见虚词和代词过滤表，避免满屏皆是类似 "的、了、是" 这种不必要的生词卡片
    // 依然允许像 "雪" 这样有实质意义的单字被识别
    const STOP_WORDS = new Set(['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '不', '没', '这', '那', '就', '也', '都', '要', '去', '来', '到', '说', '很', '好', '但', '出', '个', '得', '地', '与', '又', '着']);

    // 将HSK词汇按长度排序（长词优先匹配，避免短词误匹配）
    const sortedVocab = [...HSK_VOCAB_MAP.entries()].sort((a, b) => b[0].length - a[0].length);

    for (const [word, hskLevel] of sortedVocab) {
        // 过滤常见的单字虚词及标点，保留实词单字（如"雪"）
        if (word.length === 1 && STOP_WORDS.has(word)) continue;

        // 检查该词的HSK等级是否在当前文章难度的允许范围内
        if (!allowedLevels.has(hskLevel)) continue;

        // 跳过已加入的词
        if (addedWords.has(word)) continue;

        // 在文章中查找词汇的所有出现位置
        let pos = content.indexOf(word);
        let foundMatch = false;

        while (pos !== -1) {
            // 检查这个词的每个字符是否已经被其他长词占用了
            let isOverlap = false;
            for (let i = 0; i < word.length; i++) {
                if (usedChars[pos + i]) {
                    isOverlap = true;
                    break;
                }
            }

            // 如果没有重叠，则认为这是一个有效的生词匹配
            if (!isOverlap) {
                // 标记这些字符为已使用
                for (let i = 0; i < word.length; i++) {
                    usedChars[pos + i] = true;
                }
                foundMatch = true;
            }
            // 继续找下一个位置，即使当前位置重叠，也可能在后文存在非重叠的出现
            pos = content.indexOf(word, pos + 1);
        }

        if (foundMatch) {
            // 获取词典释义（如有）
            const data = VOCABULARY_DATABASE[word];
            vocabulary.push({
                word,
                pinyin: data?.pinyin || '',
                en: data?.en || '',
                cn: data?.cn || '',
                hskLevel,
            });
            addedWords.add(word);
        }
    }

    // 优先显示有释义的词，其次按HSK等级从低到高排序（低等级词更基础）
    const levelOrder = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7-9': 7 };
    vocabulary.sort((a, b) => {
        const aHasDef = a.pinyin && a.en ? 1 : 0;
        const bHasDef = b.pinyin && b.en ? 1 : 0;
        if (bHasDef !== aHasDef) return bHasDef - aHasDef;
        return (levelOrder[a.hskLevel] || 7) - (levelOrder[b.hskLevel] || 7);
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
    const chineseChars = [...content].filter(isChinese);
    if (chineseChars.length === 0) return { level: '初级', stats: {} };

    // 检测文章中包含的所有HSK词汇及其等级
    const levelCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7-9': 0 };
    let totalHskWords = 0;

    const usedChars = new Array(content.length).fill(false);
    const STOP_WORDS = new Set(['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '不', '没', '这', '那', '就', '也', '都', '要', '去', '来', '到', '说', '很', '好', '但', '出', '个', '得', '地', '与', '又', '着']);
    const sortedVocab = [...HSK_VOCAB_MAP.entries()].sort((a, b) => b[0].length - a[0].length);
    const matched = new Set();

    for (const [word, level] of sortedVocab) {
        if (word.length === 1 && STOP_WORDS.has(word)) continue;

        let pos = content.indexOf(word);
        let foundMatch = false;

        while (pos !== -1) {
            let isOverlap = false;
            for (let i = 0; i < word.length; i++) {
                if (usedChars[pos + i]) {
                    isOverlap = true;
                    break;
                }
            }
            if (!isOverlap) {
                for (let i = 0; i < word.length; i++) {
                    usedChars[pos + i] = true;
                }
                foundMatch = true;
            }
            pos = content.indexOf(word, pos + 1);
        }

        if (foundMatch && !matched.has(word)) {
            levelCounts[level] = (levelCounts[level] || 0) + 1;
            totalHskWords++;
            matched.add(word);
        }
    }

    // 判断难度：基于高等级词汇比例
    let suggestedLevel = '入门级';
    if (totalHskWords > 0) {
        const highLevelRatio = ((levelCounts['6'] || 0) + (levelCounts['7-9'] || 0)) / totalHskWords;
        const midHighRatio = ((levelCounts['4'] || 0) + (levelCounts['5'] || 0) + (levelCounts['6'] || 0) + (levelCounts['7-9'] || 0)) / totalHskWords;
        const midRatio = ((levelCounts['2'] || 0) + (levelCounts['3'] || 0) + (levelCounts['4'] || 0) + (levelCounts['5'] || 0) + (levelCounts['6'] || 0) + (levelCounts['7-9'] || 0)) / totalHskWords;

        if (highLevelRatio > 0.3) {
            suggestedLevel = '高级';
        } else if (midHighRatio > 0.4) {
            suggestedLevel = '中级';
        } else if (midRatio > 0.5) {
            suggestedLevel = '初级';
        } else {
            suggestedLevel = '入门级';
        }
    }

    return {
        level: suggestedLevel,
        stats: {
            totalChars: chineseChars.length,
            totalHskWords,
            levelDistribution: levelCounts,
        }
    };
}

// 导出释义库供其他模块使用
export { VOCABULARY_DATABASE };

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

    const STOP_WORDS = new Set(['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '不', '没', '这', '那', '就', '也', '都', '要', '去', '来', '到', '说', '很', '好', '但', '出', '个', '得', '地', '与', '又', '着']);

    // 使用原生的 Intl.Segmenter 进行上下文感知的自然语言分词（防 "不下雪" 误判为 "不下" + "雪"）
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    const segments = segmenter.segment(content);

    for (const s of segments) {
        if (!s.isWordLike) continue;
        const segmentText = s.segment;
        const segmentLevel = HSK_VOCAB_MAP.get(segmentText);

        // 1. 如果整个NLP分词结果直接是一个HSK词汇
        if (segmentLevel) {
            // 过滤常见的单字虚词及标点，保留实词单字（如"雪"）
            if (!(segmentText.length === 1 && STOP_WORDS.has(segmentText))) {
                if (allowedLevels.has(segmentLevel)) {
                    if (!addedWords.has(segmentText)) {
                        const data = VOCABULARY_DATABASE[segmentText];
                        vocabulary.push({
                            word: segmentText,
                            pinyin: data?.pinyin || '',
                            en: data?.en || '',
                            cn: data?.cn || '',
                            hskLevel: segmentLevel,
                        });
                        addedWords.add(segmentText);
                    }
                }
            }
        }
        // 2. 如果NLP分出的词（如"下雪"）不在HSK中，则对其内部使用 FMM (正向最大匹配) 降级拆分
        else {
            let i = 0;
            while (i < segmentText.length) {
                let matched = false;
                let maxLen = Math.min(10, segmentText.length - i);

                for (let len = maxLen; len >= 1; len--) {
                    const substr = segmentText.substring(i, i + len);
                    const hskLevel = HSK_VOCAB_MAP.get(substr);

                    if (hskLevel) {
                        if (!(len === 1 && STOP_WORDS.has(substr))) {
                            if (allowedLevels.has(hskLevel)) {
                                if (!addedWords.has(substr)) {
                                    const data = VOCABULARY_DATABASE[substr];
                                    vocabulary.push({
                                        word: substr,
                                        pinyin: data?.pinyin || '',
                                        en: data?.en || '',
                                        cn: data?.cn || '',
                                        hskLevel,
                                    });
                                    addedWords.add(substr);
                                }
                            }
                        }
                        i += len;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    i++;
                }
            }
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

    const STOP_WORDS = new Set(['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '不', '没', '这', '那', '就', '也', '都', '要', '去', '来', '到', '说', '很', '好', '但', '出', '个', '得', '地', '与', '又', '着']);
    const matched = new Set();

    // 使用原生的 Intl.Segmenter 进行上下文感知的自然语言分词
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    const segments = segmenter.segment(content);

    for (const s of segments) {
        if (!s.isWordLike) continue;
        const segmentText = s.segment;
        const segmentLevel = HSK_VOCAB_MAP.get(segmentText);

        if (segmentLevel) {
            if (!(segmentText.length === 1 && STOP_WORDS.has(segmentText))) {
                if (!matched.has(segmentText)) {
                    levelCounts[segmentLevel] = (levelCounts[segmentLevel] || 0) + 1;
                    totalHskWords++;
                    matched.add(segmentText);
                }
            }
        }
        else {
            let i = 0;
            while (i < segmentText.length) {
                let matchedSomething = false;
                let maxLen = Math.min(10, segmentText.length - i);

                for (let len = maxLen; len >= 1; len--) {
                    const substr = segmentText.substring(i, i + len);
                    const subLevel = HSK_VOCAB_MAP.get(substr);

                    if (subLevel) {
                        if (!(len === 1 && STOP_WORDS.has(substr))) {
                            if (!matched.has(substr)) {
                                levelCounts[subLevel] = (levelCounts[subLevel] || 0) + 1;
                                totalHskWords++;
                                matched.add(substr);
                            }
                        }
                        i += len;
                        matchedSomething = true;
                        break;
                    }
                }
                if (!matchedSomething) {
                    i++;
                }
            }
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

/**
 * jieba-wasm 分词服务
 * 负责 jieba 的初始化、HSK 词库加载和文本分词
 */

import init, { cut, tokenize, with_dict } from 'jieba-wasm';

import {
    HSK_LEVEL_1, HSK_LEVEL_2, HSK_LEVEL_3, HSK_LEVEL_4,
    HSK_LEVEL_5, HSK_LEVEL_6, HSK_LEVEL_7_9
} from '../data/hskVocab';

let _isReady = false;
let _initPromise = null;

/**
 * 初始化 jieba-wasm 并加载 HSK 词库作为自定义词典
 * 幂等操作：重复调用返回同一 Promise
 */
export async function initJieba() {
    if (_isReady) return true;
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
        try {
            // 初始化 WASM，传入 wasm 文件路径
            await init('/jieba_rs_wasm_bg.wasm');

            // 将 HSK 词库加载为自定义词典
            const hskLevels = [
                { set: HSK_LEVEL_1, freq: 60000 },
                { set: HSK_LEVEL_2, freq: 50000 },
                { set: HSK_LEVEL_3, freq: 40000 },
                { set: HSK_LEVEL_4, freq: 30000 },
                { set: HSK_LEVEL_5, freq: 20000 },
                { set: HSK_LEVEL_6, freq: 10000 },
                { set: HSK_LEVEL_7_9, freq: 5000 },
            ];

            const dictLines = [];
            for (const { set, freq } of hskLevels) {
                for (const word of set) {
                    const cleanWord = word.replace(/\d+$/, '');
                    if (cleanWord.length > 0) {
                        dictLines.push(`${cleanWord} ${freq} n`);
                    }
                }
            }

            if (dictLines.length > 0) {
                with_dict(dictLines.join('\n'));
            }

            _isReady = true;
            console.log(`[jiebaService] 初始化完成，已加载 ${dictLines.length} 个 HSK 词汇`);
            return true;
        } catch (error) {
            console.error('[jiebaService] 初始化失败:', error);
            _initPromise = null;
            throw error;
        }
    })();

    return _initPromise;
}

/**
 * 检查 jieba 是否已就绪
 */
export function isJiebaReady() {
    return _isReady;
}

/**
 * 使用 jieba 对文本进行分词
 * @param {string} text 待分词文本
 * @returns {string[]} 分词结果数组
 */
export function segmentText(text) {
    if (!_isReady) {
        console.warn('[jiebaService] jieba 未初始化，回退到逐字切分');
        return [...text];
    }

    try {
        return cut(text, true);
    } catch (error) {
        console.error('[jiebaService] 分词失败:', error);
        return [...text];
    }
}

/**
 * 使用 jieba 对文本进行带位置信息的分词
 * @param {string} text 待分词文本
 * @returns {Array<{word: string, start: number, end: number}>} 分词结果
 */
export function tokenizeText(text) {
    if (!_isReady) {
        console.warn('[jiebaService] jieba 未初始化，回退到逐字切分');
        return [...text].map((char, i) => ({ word: char, start: i, end: i + 1 }));
    }

    try {
        return tokenize(text, 'default', true);
    } catch (error) {
        console.error('[jiebaService] tokenize 失败:', error);
        return [...text].map((char, i) => ({ word: char, start: i, end: i + 1 }));
    }
}
// AI 释义生成服务 - 使用本地 pinyin-pro 库生成拼音，使用本地 CC-CEDICT 生成英文释义
// 完全在浏览器端运行，无需任何 API Key，中国可用，无 CORS 问题

import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { pinyin } from "pinyin-pro";

// 缓存加载的字典对象，避免重复网络请求
let cachedDictionary = null;

// ─── 拼音生成（本地，无需网络）──────────────────────────────────────────────
/**
 * 用 pinyin-pro 为单个词生成带声调的拼音
 * 示例："中文" → "zhōng wén"
 */
function generatePinyin(word) {
    try {
        return pinyin(word, {
            toneType: "symbol",   // 声调符号：ā á ǎ à
            separator: " ",       // 音节间用空格分隔
            nonZh: "removed",    // 去除非中文字符
        });
    } catch {
        return "";
    }
}

// ─── 动态加载本地 CEDICT 字典 ──────────────────────────────────────────────
/**
 * 懒加载词典文件以减小前端首屏 bundle 体积
 */
async function loadDictionary() {
    if (cachedDictionary) return cachedDictionary;
    try {
        // 使用 Vite 的动态 import 特性懒加载本地大型 JSON 文件
        const dict = await import("../data/cedict.json");
        cachedDictionary = dict.default || dict;
        return cachedDictionary;
    } catch (err) {
        console.error("加载本地词典文件失败:", err);
        return {};
    }
}

/**
 * 尝试为未直接收录的词汇进行逐字拆分并拼接英文释义
 * 例如："两个" -> 拆分为 "两" 和 "个"，分别查询并组合成 "two; both / individual; measure word"
 */
function findFallbackDefinition(word, dict) {
    if (!word || word.length <= 1) return "";
    
    const parts = [];
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (dict[char]) {
            // 简单清理下太长的释义，只拿前几个主释义
            const def = dict[char].split('; ').slice(0, 2).join('; ');
            parts.push(`${char}: ${def}`);
        }
    }
    
    // 如果找到了部分字的释义，拼接返回
    if (parts.length > 0) {
        return parts.join(" | ");
    }
    return "";
}

// ─── 主接口：批量生成释义 ────────────────────────────────────────────────────
/**
 * 批量为词汇生成拼音（本地计算）和英文释义（从本地字典中查询，带拆分降级策略）。
 *
 * @param {string[]} words - 待处理的词列表
 * @returns {Promise<Record<string, {pinyin: string, en: string, cn: string}>>}
 */
export async function generateDefinitionsForWords(words) {
    if (!words || words.length === 0) return {};

    const dict = await loadDictionary();
    const results = {};
    for (const word of words) {
        const py = generatePinyin(word);
        
        // 1. 尝试直接整词查询
        let englishDef = dict[word] || "";
        
        // 2. 如果整词查询为空，且是多字词，尝试逐字拆分查询
        if (!englishDef && word.length > 1) {
            englishDef = findFallbackDefinition(word, dict);
        }
        
        results[word] = {
            pinyin: py,
            en: englishDef,
            cn: word,
        };
    }
    return results;
}

// ─── 保留的配置接口（以向下兼容其他调用） ──────────────────────────────────────
const LOCAL_CACHE_KEY = "baidu_translate_config";

export function getBaiduConfig() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "{}");
    } catch {
        return {};
    }
}

export function setCachedBaiduConfig(config) {
    if (config && typeof config === "object") {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(config));
    } else {
        localStorage.removeItem(LOCAL_CACHE_KEY);
    }
}

export async function loadBaiduConfigFromFirestore() {
    return getBaiduConfig();
}

export async function saveBaiduConfigToFirestore(config) {
    setCachedBaiduConfig(config);
}

export async function testBaiduConfig() {
    return true;
}

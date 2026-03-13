import fs from 'fs';
import { VOCABULARY_DATABASE } from './src/data/vocabDefinitions.js';

const text = "前两天，鹅厂总部门口，近千人为了只小龙虾大排长龙。从航空工程师到图书管理员…几十名鹅厂程序员现场摆摊，手把手免费帮大家安装OpenClaw。动静之大，甚至惊动了“龙虾之父”本人现身点赞。";

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
const segments = Array.from(segmenter.segment(text)).map(s => s.segment);
console.log("Segments:", segments.join('|'));

const VALID_WORDS = new Set([...Object.keys(VOCABULARY_DATABASE), '手把手']);

function detectVocab() {
    let result = [];
    for (let word of segments) {
        if (VALID_WORDS.has(word) && word.length >= 2) {
            result.push(word);
        }
    }
    return result;
}

console.log("Detected with Segmenter:", detectVocab());

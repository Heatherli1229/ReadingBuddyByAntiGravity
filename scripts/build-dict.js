import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const rawDict = require('cedict-json');

console.log('正在解析字典数据...');

const processed = {};

// 遍历字典，将其整理为以 simplified (简体字) 为 key 的映射
for (const key of Object.keys(rawDict)) {
    const entry = rawDict[key];
    if (!entry || !entry.simplified) continue;
    
    const word = entry.simplified;
    
    // 我们只需要英文释义列表。因为英文释义可能包含多个条目，这里我们用分号连接
    const definitions = entry.english ? entry.english.join('; ') : '';
    
    // 如果一个词有多重词义或不同读音，我们可以合并释义
    if (processed[word]) {
        processed[word] += ' / ' + definitions;
    } else {
        processed[word] = definitions;
    }
}

// 确保目标文件夹存在
const outputDir = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 写入压缩后的 JSON 文件
const outputPath = path.join(outputDir, 'cedict.json');
fs.writeFileSync(outputPath, JSON.stringify(processed));

console.log(`字典压缩处理完成！保存路径: ${outputPath}`);
console.log(`条目总数: ${Object.keys(processed).length}`);
console.log(`文件大小: ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);

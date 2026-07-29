import { getWordHskLevel } from './vocabDetector';

/**
 * 格式化 HSK 等级显示
 */
export function formatHskLevel(wordObj) {
    const level = wordObj.hskLevel || getWordHskLevel(wordObj.word) || '1';
    return level === 'Non-HSK' ? 'Non-HSK' : `HSK ${level}`;
}

/**
 * 通用文件下载辅助函数
 */
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 1. 导出为 CSV (Excel 兼容，带 UTF-8 BOM 防止中文乱码)
 */
export function exportToCSV(words, filename = '生词本_Vocabulary.csv') {
    const headers = ['生词 (Word)', '拼音 (Pinyin)', '英文释义 (English)', 'HSK等级 (HSK Level)'];
    const rows = words.map(w => {
        const hsk = formatHskLevel(w);
        const wordStr = `"${(w.word || '').replace(/"/g, '""')}"`;
        const pinyinStr = `"${(w.pinyin || '').replace(/"/g, '""')}"`;
        const enStr = `"${(w.en || '').replace(/"/g, '""')}"`;
        const hskStr = `"${hsk.replace(/"/g, '""')}"`;
        return [wordStr, pinyinStr, enStr, hskStr].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * 2. 打印 / 导出为 PDF (浏览器打印视图)
 */
export function printVocabList(words, title = '我的生词本') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('请允许浏览器打开弹窗以使用打印/导出 PDF 功能！');
        return;
    }

    const rowsHtml = words.map((w, index) => {
        const hsk = formatHskLevel(w);
        return `
            <tr>
                <td>${index + 1}</td>
                <td class="word">${w.word || ''}</td>
                <td class="pinyin">${w.pinyin || ''}</td>
                <td>${w.en || ''}</td>
                <td><span class="hsk-badge">${hsk}</span></td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                    padding: 28px;
                    color: #1f2937;
                    background-color: #fff;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #10b981;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                h1 {
                    font-size: 24px;
                    margin: 0 0 6px 0;
                    color: #111827;
                }
                .subtitle {
                    color: #6b7280;
                    font-size: 13px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #e5e7eb;
                    padding: 10px 14px;
                    text-align: left;
                    font-size: 14px;
                }
                th {
                    background-color: #f8fafc;
                    font-weight: 600;
                    color: #334155;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .word {
                    font-size: 17px;
                    font-weight: bold;
                    color: #059669;
                }
                .pinyin {
                    color: #4b5563;
                    font-style: italic;
                }
                .hsk-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #475569;
                    font-weight: 500;
                }
                @media print {
                    @page { margin: 1.2cm; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 ${title}</h1>
                <div class="subtitle">生词总数: ${words.length} 个 • 导出时间: ${new Date().toLocaleDateString()}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px">#</th>
                        <th>生词</th>
                        <th>拼音</th>
                        <th>英文释义</th>
                        <th>HSK等级</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 300);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

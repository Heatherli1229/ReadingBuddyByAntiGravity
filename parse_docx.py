import zipfile
import re
import json

docx_path = r'c:\工作\AI用于中文教学\ReadingBuddyByAntiGravity\生词库\HSK大纲2025 词汇表 v2 去掉了多等级.docx'

with zipfile.ZipFile(docx_path, 'r') as z:
    with z.open('word/document.xml') as f:
        content = f.read().decode('utf-8')

paragraphs = re.split(r'</w:p>', content)

lines = []
for p in paragraphs:
    texts = re.findall(r'<w:t(?: [^>]+)?>([^<]+)</w:t>', p)
    line = ''.join(texts).strip()
    if line:
        lines.append(line)

with open(r'c:\工作\AI用于中文教学\ReadingBuddyByAntiGravity\生词库\parsed.json', 'w', encoding='utf-8') as f:
    json.dump(lines, f, ensure_ascii=False, indent=2)

print("Parsed successfully")

import json

input_path = r'c:\工作\AI用于中文教学\ReadingBuddyByAntiGravity\生词库\parsed.json'
output_path = r'c:\工作\AI用于中文教学\ReadingBuddyByAntiGravity\src\data\hskVocab.js'

with open(input_path, 'r', encoding='utf-8') as f:
    lines = json.load(f)

# Structure is: '序号', '等级', '词语', '拼音', '词性'
# Example: "1", "1", "爱", "ài", "动"

vocab_map = {}
idx = 0

# Find where data starts
while idx < len(lines):
    if lines[idx] == "词性":
        idx += 1
        break
    idx += 1

while idx < len(lines):
    if lines[idx] in ["汉考国际", "考国际", "汉考国", "词汇大纲", "序号", "等级", "词语", "拼音", "词性"] or lines[idx].startswith('-') or lines[idx].strip() == "n":
        idx += 1
        continue
    # Could be the sequence number
    if lines[idx].isdigit() and int(lines[idx]) > 0:
        if idx + 4 < len(lines):
            # level could be "1", "2", ... "7-9"
            level = lines[idx+1]
            if level in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "7-9"]:
                word = lines[idx+2]
                
                # Check that word isn't a pinyin, it should contain some chinese or non-ascii
                # But let's just assume valid format
                pinyin = lines[idx+3]
                pos = lines[idx+4]
                
                # Sometime parts of speech might be split or missing
                # Let's just collect the level
                if level in ["7", "8", "9"]:
                    level = "7-9"
                if word not in vocab_map:
                    vocab_map[word] = level
                
                idx += 5
            else:
                idx += 1
        else:
            idx += 1
    else:
        idx += 1

js_content = f"""// HSK 2025 Vocabulary generated from Docx
export const HSK_VOCAB_MAP = new Map({json.dumps([[k, v] for k, v in vocab_map.items()], ensure_ascii=False)});
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated {len(vocab_map)} vocabularies.")

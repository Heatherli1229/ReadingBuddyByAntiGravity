import os
import re

src_dir = r"c:\工作\AI用于中文教学\ReadingBuddyByAntiGravity\src"

all_files = {}
for root, dirs, files in os.walk(src_dir):
    for f in files:
        full_path = os.path.join(root, f)
        # store lowercase path to original path mapping
        all_files[full_path.lower().replace('\\', '/')] = full_path.replace('\\', '/')

import_pattern = re.compile(r'import(?:.+?)from\s+[\'"](.+?)[\'"]')

errors = []
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if not f.endswith(('.js', '.jsx')): continue
        file_path = os.path.join(root, f)
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            imports = import_pattern.findall(content)
            for imp in imports:
                if not imp.startswith('.'): continue # external module
                
                # resolve path
                dir_path = root.replace('\\', '/')
                target_path = os.path.normpath(os.path.join(dir_path, imp)).replace('\\', '/')
                
                # Check with extensions
                found = False
                for ext in ['', '.js', '.jsx', '.css', '/index.js', '/index.jsx']:
                    test_path = target_path + ext
                    test_lower = test_path.lower()
                    if test_lower in all_files:
                        actual = all_files[test_lower]
                        # Check case
                        if not actual.endswith(test_path[test_path.rfind('/'):]):
                            # This is a bit simplified but compares string equality for the matched part
                            # We can just check if the actual path matches the requested path exactly except for the root part.
                            actual_rel = actual[len(src_dir):]
                            test_rel = test_path[len(src_dir.replace('\\', '/')):]
                            if actual_rel != test_rel:
                                errors.append(f"Case mismatch in {file_path}:\nImport: {imp} -> implies {test_path}\nActual: {actual}")
                        found = True
                        break
                
                if not found:
                    errors.append(f"Not found in {file_path}: {imp}")

for e in errors:
    print(e)
if not errors:
    print("No import errors found.")

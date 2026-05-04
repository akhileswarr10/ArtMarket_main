import os
import re

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

def process_file(filepath):
    if not filepath.endswith(('.tsx', '.ts', '.jsx', '.js')):
        return

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return

    original_content = content

    def replacer(m):
        class_str = m.group(1)
        
        # Check if this class string matches the characteristics of the form inputs
        if 'outline-none' not in class_str and 'focus:outline-none' not in class_str:
            return m.group(0)
            
        if 'bg-surface' not in class_str and 'bg-canvas' not in class_str and 'bg-transparent' not in class_str:
            return m.group(0)
            
        if 'text-ink' not in class_str:
            return m.group(0)
            
        # Ensure it has some input-like spacing or border to avoid matching completely unrelated things
        if 'border' not in class_str and 'px-' not in class_str and 'py-' not in class_str and 'bg-transparent' not in class_str:
            return m.group(0)
            
        # It's an input/textarea!
        new_class = 'input-galerie'
        if 'w-full' in class_str:
            new_class += ' w-full'
        if 'resize-none' in class_str:
            new_class += ' resize-none'
            
        return f'className="{new_class}"'

    content = re.sub(r'className="([^"]+)"', replacer, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated inputs in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

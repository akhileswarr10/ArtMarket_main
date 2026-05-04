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
    
    # 1. Full page loaders
    def full_page_loader_replacer(m):
        div_start = m.group(1)
        loader_part = m.group(2)
        div_end = m.group(3)
        loader_part = re.sub(r'className="[^"]+"', 'className="w-7 h-7 text-gold-500 animate-spin"', loader_part)
        return f'{div_start}{loader_part}{div_end}'

    content = re.sub(r'(<div\s+className="[^"]*min-h-screen[^"]*flex[^"]*justify-center[^"]*">\s*)(<Loader2[^>]+/>)(\s*</div>)', full_page_loader_replacer, content)

    # 2. Inline spinner colors
    def spinner_color_replacer(m):
        class_str = m.group(1)
        if 'animate-spin' in class_str:
            class_str = re.sub(r'text-indigo-(500|400)', 'text-gold-500', class_str)
            class_str = re.sub(r'text-gold-400', 'text-gold-500', class_str)
        return f'className="{class_str}"'
    
    content = re.sub(r'className="([^"]*animate-spin[^"]*)"', spinner_color_replacer, content)

    # 3. Skeletons
    def skeleton_replacer(m):
        class_str = m.group(1)
        if 'animate-pulse' in class_str:
            if 'bg-white/5' in class_str or 'bg-slate-800' in class_str or 'bg-surface/60' in class_str or 'bg-surface-raised' in class_str:
                class_str = re.sub(r'bg-(?:white\/5|slate-800|surface\/60|surface-raised)', '', class_str)
                class_str = class_str.replace('animate-pulse', 'skeleton')
                class_str = re.sub(r'\s+', ' ', class_str).strip()
        return f'className="{class_str}"'

    content = re.sub(r'className="([^"]*animate-pulse[^"]*)"', skeleton_replacer, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated loaders in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

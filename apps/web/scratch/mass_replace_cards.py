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
        
        is_card = False
        
        if 'bg-surface/60 border border-border rounded-' in class_str:
            is_card = True
        if 'bg-canvas-50 rounded-[2rem] border border-border-subtle' in class_str:
            is_card = True
        if 'bg-canvas-50 border border-border-subtle rounded-[2rem]' in class_str:
            is_card = True
        if 'bg-surface/60 border border-border-subtle rounded-[2rem]' in class_str:
            is_card = True
            
        if not is_card:
            return m.group(0)

        # Base replacement
        class_str = class_str.replace('bg-surface/60 border border-border rounded-xl', 'bg-surface border border-border-subtle rounded-xl shadow-card')
        class_str = class_str.replace('bg-surface/60 border border-border rounded-2xl', 'bg-surface border border-border-subtle rounded-2xl shadow-card')
        class_str = class_str.replace('bg-surface/60 border border-border rounded-3xl', 'bg-surface border border-border-subtle rounded-3xl shadow-card')
        class_str = class_str.replace('bg-surface/60 border border-border rounded-[2rem]', 'bg-surface border border-border-subtle rounded-3xl shadow-card')
        class_str = class_str.replace('bg-surface/60 border border-border-subtle rounded-[2rem]', 'bg-surface border border-border-subtle rounded-3xl shadow-card')
        class_str = class_str.replace('bg-canvas-50 rounded-[2rem] border border-border-subtle', 'bg-surface border border-border-subtle rounded-3xl shadow-card')
        class_str = class_str.replace('bg-canvas-50 border border-border-subtle rounded-[2rem]', 'bg-surface border border-border-subtle rounded-3xl shadow-card')
        
        if 'hover:' in class_str or 'cursor-pointer' in class_str:
            class_str = re.sub(r'hover:border-[a-zA-Z0-9\-\/]+', '', class_str)
            class_str = re.sub(r'hover:shadow-[a-zA-Z0-9\-\/]+', '', class_str)
            class_str = re.sub(r'transition-[a-zA-Z0-9\-]+', '', class_str)
            class_str = re.sub(r'duration-[0-9]+', '', class_str)
            
            class_str = re.sub(r'hover:bg-white/[0-9]+', '', class_str)
            
            class_str = re.sub(r'\s+', ' ', class_str).strip()
            
            class_str += ' hover:border-border-strong hover:shadow-card-hover transition-all duration-300'
            
        return f'className="{class_str}"'

    content = re.sub(r'className="([^"]+)"', replacer, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated cards in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

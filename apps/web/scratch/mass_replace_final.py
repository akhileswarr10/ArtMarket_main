import os
import re

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

def process_file(filepath):
    # Do not touch: Any file in apps/web/lib/
    if 'lib' in filepath:
        return
    # Do not touch: middleware.ts
    if 'middleware.ts' in filepath:
        return
    # Do not touch: Any .ts file that is not a React component (only touch .tsx or .jsx files)
    if not filepath.endswith(('.tsx', '.jsx')):
        return

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    original = content

    def replace_classes(class_str):
        # "slate-950" -> "canvas-950"
        class_str = class_str.replace('slate-950', 'canvas-950')
        
        # "indigo-" -> "gold-"
        class_str = re.sub(r'indigo-(\d+)', r'gold-\1', class_str)

        # "text-white" -> "text-ink"
        class_str = class_str.replace('text-white', 'text-ink')
        
        # "bg-white" -> "bg-canvas-50"
        # Be careful not to replace bg-white/5 etc.
        class_str = re.sub(r'bg-white(?!/[0-9]+)', 'bg-canvas-50', class_str)
        
        # "violet-" -> "copper-DEFAULT"
        class_str = re.sub(r'violet-\d+', 'copper-DEFAULT', class_str)

        return class_str

    # Process className="..."
    def replacer(m):
        return f'className="{replace_classes(m.group(1))}"'

    content = re.sub(r'className="([^"]+)"', replacer, content)

    # Process className={`...`}
    def template_replacer(m):
        return f'className={{`{replace_classes(m.group(1))}`}}'

    content = re.sub(r'className=\{\`([^\`]+)\`\}', template_replacer, content)
    
    # Process className={'...'}
    def literal_replacer(m):
        return f'className={{\'{replace_classes(m.group(1))}\'}}'
        
    content = re.sub(r'className=\{\'([^\']+)\'\}', literal_replacer, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

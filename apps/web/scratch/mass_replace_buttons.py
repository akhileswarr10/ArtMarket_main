import os
import re

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

icon_replacements = [
    (r'bg-(?:canvas|surface)-?50 hover:bg-(?:canvas|surface)-?100 text-ink-secondary', 'bg-surface-raised hover:bg-surface-overlay text-ink-secondary hover:text-ink border border-border-subtle'),
    (r'bg-emerald-DEFAULT hover:bg-emerald-500 text-ink(?:-secondary)?', 'bg-emerald-muted hover:bg-emerald-DEFAULT/20 text-emerald-DEFAULT border border-emerald-DEFAULT/20'),
    (r'bg-rose-muted hover:bg-rose-100 text-rose-DEFAULT', 'bg-rose-muted hover:bg-rose-DEFAULT/20 text-rose-DEFAULT border border-rose-DEFAULT/20')
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

    for old, new in icon_replacements:
        content = re.sub(old, new, content)

    def button_replacer(m):
        tag = m.group(1) # 'button' or 'Link'
        tag_inner = m.group(2)
        
        class_match = re.search(r'className=(?:(["\'])(.*?)\1|\{([^}]+)\})', tag_inner)
        if not class_match:
            return m.group(0)
            
        class_str = class_match.group(2) if class_match.group(2) is not None else class_match.group(3)
        if not class_str:
            return m.group(0)
            
        if 'btn-gold' in class_str or 'btn-ghost' in class_str:
            return m.group(0)

        if tag == 'Link':
            if 'px-' not in class_str or 'py-' not in class_str:
                return m.group(0)
            if 'bg-' not in class_str and 'border' not in class_str:
                return m.group(0)

        is_icon_button = any(x in class_str for x in ['w-8 h-8', 'w-10 h-10', 'w-12 h-12', 'w-6 h-6'])
        if 'p-2' in class_str and 'flex' not in class_str and 'px-' not in class_str:
            is_icon_button = True
        if is_icon_button:
            return m.group(0)

        is_primary = False
        is_secondary = False
        
        if 'type="submit"' in tag_inner or "type='submit'" in tag_inner:
            is_primary = True
        elif 'bg-surface' in class_str and 'text-ink' in class_str and 'border' not in class_str:
            is_primary = True
        elif 'bg-gold' in class_str:
            is_primary = True
        elif 'bg-emerald' in class_str:
            is_primary = True
        elif 'border' in class_str and ('bg-transparent' in class_str or 'bg-surface/60' in class_str or 'bg-' not in class_str):
            is_secondary = True
        
        if not is_primary and not is_secondary:
            if 'px-' in class_str and 'py-' in class_str:
                if 'bg-' not in class_str:
                    is_secondary = True
                else:
                    is_primary = True
            else:
                return m.group(0)

        if is_primary:
            new_class = 'btn-gold'
        else:
            new_class = 'btn-ghost'
            
        if 'w-full' in class_str:
            new_class += ' w-full'
        if 'disabled:opacity-50' in class_str:
            new_class += ' disabled:opacity-50'
        if 'disabled:cursor-not-allowed' in class_str:
            new_class += ' disabled:cursor-not-allowed'
            
        new_attr = f'className="{new_class}"'
        new_inner = tag_inner[:class_match.start()] + new_attr + tag_inner[class_match.end():]
        return f'<{tag}{new_inner}>'

    content = re.sub(r'<(button|Link)(\b[^>]*?)>', button_replacer, content, flags=re.DOTALL)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated buttons in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

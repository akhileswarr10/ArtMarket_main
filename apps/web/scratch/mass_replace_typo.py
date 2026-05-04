import os
import re

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

replacements = {
    # Labels
    'text-[10px] font-black text-ink-secondary uppercase tracking-[0.2em]': 'text-[11px] font-semibold text-ink-muted uppercase tracking-widest',
    'text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]': 'text-[11px] font-semibold text-ink-muted uppercase tracking-widest',
    'text-xs font-bold text-ink-secondary uppercase tracking-widest': 'text-xs font-semibold text-ink-muted uppercase tracking-widest',
    'text-xs font-bold text-slate-400 uppercase tracking-widest': 'text-xs font-semibold text-ink-muted uppercase tracking-widest',
    'text-xs font-bold uppercase tracking-widest': 'text-xs font-semibold uppercase tracking-widest',
    
    # Prices (Static)
    'text-3xl font-black text-emerald-DEFAULT': 'font-mono text-3xl font-semibold text-emerald-DEFAULT',
    'text-3xl font-black text-emerald-500': 'font-mono text-3xl font-semibold text-emerald-DEFAULT',
    
    # Headings
    'text-3xl font-black text-ink': 'font-display text-4xl font-bold text-ink',
    'text-3xl font-black text-white': 'font-display text-4xl font-bold text-ink',
    'text-3xl font-black': 'font-display text-4xl font-bold',
    
    'text-2xl font-bold text-ink': 'font-display text-2xl font-semibold text-ink',
    'text-2xl font-bold text-white': 'font-display text-2xl font-semibold text-ink',
    'text-2xl font-bold': 'font-display text-2xl font-semibold',
    
    'text-xl font-bold text-ink': 'font-display text-xl font-semibold text-ink',
    'text-xl font-bold text-white': 'font-display text-xl font-semibold text-ink',
    'text-xl font-bold': 'font-display text-xl font-semibold',
    
    'text-4xl font-black': 'font-display text-5xl font-bold',
    'text-5xl font-black': 'font-display text-6xl font-bold',
}

sorted_keys = sorted(replacements.keys(), key=len, reverse=True)

def process_file(filepath):
    if not filepath.endswith(('.tsx', '.ts', '.jsx', '.js')):
        return

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    original_content = content

    for k in sorted_keys:
        v = replacements[k]
        if ' ' in k:
            content = content.replace(k, v)
        else:
            pattern = r'(?<![a-zA-Z0-9\-\/])' + re.escape(k) + r'(?![a-zA-Z0-9\-\/])'
            content = re.sub(pattern, v, content)

    def price_replacer(m):
        class_str = m.group(1)
        class_str = class_str.replace('font-display', 'font-mono')
        class_str = class_str.replace('text-ink', '')
        if 'text-gold-500' not in class_str:
            class_str = class_str + ' text-gold-500'
        class_str = re.sub(r'\s+', ' ', class_str).strip()
        return f'className="{class_str}"{m.group(2)}>{m.group(3)}{m.group(4)}'

    # Note: capturing optional curly brace/quote stuff
    content = re.sub(r'className="([^"]*font-display text-2xl font-semibold[^"]*)"([^>]*)>(\s*(?:\{?[\'"`]?)?)(\$|£|€|&#36;)', price_replacer, content)

    def generic_price_replacer(m):
        class_str = m.group(1)
        class_str = class_str.replace('font-black', 'font-mono font-semibold')
        class_str = re.sub(r'\s+', ' ', class_str).strip()
        return f'className="{class_str}"{m.group(2)}>{m.group(3)}{m.group(4)}'

    content = re.sub(r'className="([^"]*font-black[^"]*)"([^>]*)>(\s*(?:\{?[\'"`]?)?)(\$|£|€|&#36;)', generic_price_replacer, content)

    # Finally, Body: font-black → font-bold
    content = re.sub(r'(?<![a-zA-Z0-9\-\/])font-black(?![a-zA-Z0-9\-\/])', 'font-bold', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated typography in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

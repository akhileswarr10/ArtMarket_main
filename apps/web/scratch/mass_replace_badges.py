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
    
    def preserve_layout(old_class, new_class):
        margins = re.findall(r'\bm[t|b|l|r|x|y]?-[0-9]+\b', old_class)
        for m in margins:
            new_class += f' {m}'
        if 'absolute' in old_class:
            new_class += ' absolute'
            positioning = re.findall(r'\b(?:top|bottom|left|right|inset)-[0-9a-zA-Z\-\[\]]+\b', old_class)
            for p in positioning:
                if 'border' not in p and 'text' not in p and 'bg' not in p:
                    new_class += f' {p}'
        # Also clean up multiple spaces
        new_class = re.sub(r'\s+', ' ', new_class).strip()
        return f'className="{new_class}"'

    def badge_replacer(m):
        class_str = m.group(1)
        
        if 'rounded-full' not in class_str:
            return m.group(0)
            
        # DRAFT / PENDING badges: bg-slate-900/80 (now bg-surface/80)
        if 'bg-surface/80' in class_str or 'bg-slate-900/80' in class_str:
            if 'text-slate-100' in class_str or 'text-ink' in class_str or 'text-white' in class_str:
                return preserve_layout(class_str, 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-surface-overlay border border-border text-ink-muted backdrop-blur-md')

        # PUBLISHED / SUCCESS badges: bg-emerald-500/80 (now bg-emerald-DEFAULT/80)
        if 'bg-emerald-DEFAULT/80' in class_str or 'bg-emerald-500/80' in class_str:
            return preserve_layout(class_str, 'badge-emerald')
            
        # GOLD / WARNING badges: bg-orange-500, bg-amber, bg-yellow
        if 'bg-orange-500' in class_str or 'bg-amber-500' in class_str or 'bg-yellow-500' in class_str or 'bg-amber-400' in class_str:
            return preserve_layout(class_str, 'badge-gold')
            
        # VERIFIED / EMERALD badges
        if 'bg-emerald-muted' in class_str and ('text-emerald-DEFAULT' in class_str or 'text-emerald-400' in class_str):
            if 'w-10' not in class_str and 'w-8' not in class_str and 'p-2' not in class_str:
                return preserve_layout(class_str, 'badge-emerald')
                
        # GOLD badges
        if 'bg-gold-muted' in class_str and 'text-gold-400' in class_str:
            if 'w-10' not in class_str and 'w-8' not in class_str and 'p-2' not in class_str:
                return preserve_layout(class_str, 'badge-gold')

        return m.group(0)

    content = re.sub(r'className="([^"]+)"', badge_replacer, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated badges in {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))

print("Done.")

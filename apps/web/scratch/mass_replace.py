import os
import re

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

replacements = {
    # Gradients first to catch multi-word or just sort by length
    'from-indigo-500 to-violet-600': 'from-gold-600 to-copper-DEFAULT',
    
    # Backgrounds
    'bg-slate-950': 'bg-canvas-950',
    'bg-slate-900': 'bg-surface',
    'bg-slate-800': 'bg-surface-raised',
    'bg-slate-700': 'bg-surface-overlay',
    'bg-slate-100': 'bg-canvas-100',
    'bg-slate-50': 'bg-canvas-50',
    'bg-white/10': 'bg-surface-raised/70',
    'bg-white/5': 'bg-surface/60',
    'bg-white/2': 'bg-surface/30',
    'bg-white/3': 'bg-surface/40',
    'bg-white': 'bg-canvas-50',
    'bg-indigo-500/10': 'bg-gold-muted',
    'bg-indigo-500/20': 'bg-gold/[0.18]',
    'bg-indigo-500': 'bg-gold-500',
    'bg-indigo-600': 'bg-gold-500',
    'bg-indigo-800': 'bg-gold-600',
    'bg-emerald-500/10': 'bg-emerald-muted',
    'bg-emerald-500': 'bg-emerald-DEFAULT',
    'bg-emerald-600': 'bg-emerald-500',
    'bg-rose-500/10': 'bg-rose-muted',
    'bg-rose-50': 'bg-rose-muted',

    # Text
    'text-white': 'text-ink',
    'text-slate-900': 'text-ink',
    'text-slate-800': 'text-ink',
    'text-slate-600': 'text-ink-secondary',
    'text-slate-500': 'text-ink-secondary',
    'text-slate-400': 'text-ink-secondary',
    'text-slate-300': 'text-ink-muted',
    'text-indigo-400': 'text-gold-400',
    'text-indigo-500': 'text-gold-500',
    'text-indigo-300': 'text-gold-300',
    'text-indigo-600': 'text-gold-600',
    'text-emerald-500': 'text-emerald-DEFAULT',
    'text-emerald-400': 'text-emerald-DEFAULT',
    'text-rose-500': 'text-rose-DEFAULT',
    'text-rose-400': 'text-rose-DEFAULT',
    'text-orange-500': 'text-copper-light',

    # Borders
    'border-white/10': 'border-border',
    'border-white/5': 'border-border-subtle',
    'border-white/20': 'border-border-strong',
    'border-slate-100': 'border-border-subtle',
    'border-slate-200': 'border-border',
    'border-indigo-500/20': 'border-gold/20',
    'border-indigo-500/30': 'border-gold/30',
    'border-indigo-500/50': 'border-gold/50',
    'border-emerald-400/30': 'border-emerald-DEFAULT/30',
    'border-rose-500/20': 'border-rose-DEFAULT/20',
    'border-rose-500/30': 'border-rose-DEFAULT/30',

    # Focus / Ring
    'focus:ring-indigo-500/5': 'focus:ring-gold/8',
    'focus:border-indigo-500': 'focus:border-gold-500',
    'ring-indigo-500': 'ring-gold-500',

    # Shadows
    'shadow-indigo-500/20': 'shadow-gold-sm',
    'shadow-indigo-500/30': 'shadow-gold',
    'shadow-slate-200': 'shadow-black/30',
    'shadow-white/5': 'shadow-black/20',

    # Gradients remaining
    'from-indigo-500': 'from-gold-500',
    'to-violet-600': 'to-copper-DEFAULT',
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

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                process_file(os.path.join(root, file))
    else:
        print(f"Directory not found: {d}")

print("Done.")

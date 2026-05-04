import os

directories = [
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\app',
    r'd:\Parameswaran\Project_main\ArtMarket_main\apps\web\components'
]

replacements = {
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-muted border border-emerald-500/20 text-emerald-DEFAULT text-xs font-semibold uppercase tracking-widest mb-5': 'badge-emerald mb-5',
    'mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-muted border border-emerald-500/20 rounded-full text-emerald-DEFAULT text-[10px] font-bold uppercase tracking-widest': 'badge-emerald mt-4',
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-muted border border-emerald-500/20 text-emerald-DEFAULT text-[10px] font-bold uppercase tracking-widest': 'badge-emerald',
    
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted text-gold-400 text-[10px] font-bold uppercase tracking-widest mb-4 border border-gold/20': 'badge-gold mb-4',
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold/20 text-gold-400 text-xs font-bold uppercase tracking-wider mb-8': 'badge-gold mb-8',
    'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-muted border border-gold/20 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4': 'badge-gold mb-4',
    'px-3 py-1 rounded-full bg-gold-muted border border-gold/20 text-gold-400 text-[10px] font-bold uppercase tracking-widest': 'badge-gold',
    
    'absolute top-6 left-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-border rounded-full text-left': 'absolute top-6 left-6 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-surface-overlay border border-border text-ink-muted backdrop-blur-md',
    'absolute top-6 left-6 px-4 py-2 bg-surface/80 backdrop-blur-md border border-border rounded-full text-left': 'absolute top-6 left-6 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-surface-overlay border border-border text-ink-muted backdrop-blur-md'
}

def process_file(filepath):
    if not filepath.endswith(('.tsx', '.ts', '.jsx', '.js')):
        return

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return

    original_content = content
    
    for old, new in replacements.items():
        content = content.replace(old, new)

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

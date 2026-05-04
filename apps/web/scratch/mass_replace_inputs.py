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
        tag = m.group(1)
        inner = m.group(2)
        
        # Skip non-text inputs
        if any(t in inner for t in ['type="checkbox"', "type='checkbox'", 'type="radio"', "type='radio'", 'type="file"', "type='file'", 'type="submit"', 'type="button"']):
            return m.group(0)
            
        class_match = re.search(r'className=(?:(["\'])(.*?)\1|\{([^}]+)\})', inner)
        if not class_match:
            return m.group(0)
            
        class_str = class_match.group(2) if class_match.group(2) is not None else class_match.group(3)
        if not class_str:
            return m.group(0)
            
        # Check if it looks like an input style
        is_text_input_style = any(x in class_str for x in ['px-', 'py-', 'bg-', 'border', 'outline-none', 'rounded', 'w-full'])
        
        if 'hidden' in class_str and 'border' not in class_str:
             return m.group(0) 
             
        if is_text_input_style:
            new_class = 'input-galerie'
            if 'w-full' in class_str:
                new_class += ' w-full'
            if tag == 'textarea':
                new_class += ' resize-none'
                
            new_attr = f'className="{new_class}"'
                     
            new_inner = inner[:class_match.start()] + new_attr + inner[class_match.end():]
            return f'<{tag}{new_inner}'
            
        return m.group(0)

    # Using DOTALL so it matches across newlines
    content = re.sub(r'<(input|textarea)(\b[^>]*?)>', replacer, content, flags=re.DOTALL)

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

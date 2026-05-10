import os
import glob
import re

theme_vars = """
    :root {
        --color-primary: #3EB489;
        --color-secondary: #A7F3D0;
        --color-accent: #A7F3D0;
        --color-success: #3EB489;
        --color-warning: #f59e0b;
        --color-light: #F6FFF9;
        --color-dark: #2E2E2E;
        --color-gray: #6B7280;
        --gradient-primary: linear-gradient(135deg, #3EB489, #28a073);
        --gradient-secondary: linear-gradient(135deg, #A7F3D0, #3EB489);
"""

def update_root_vars(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the :root block and replace the variables
    if ':root {' in content:
        # Regex to find the root block and its content up to the closing brace
        pattern = re.compile(r':root\s*\{[^}]+\}', re.MULTILINE)
        
        replacement = theme_vars.strip() + "\n"
        # We need to keep the shadow and border radius variables if they exist
        shadows_and_borders = """
        --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
        --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05);
        --shadow-lg: 0 10px 15px -3px rgba(46,46,46,0.05);
        --shadow-xl: 0 20px 25px -5px rgba(46,46,46,0.1);
        --border-radius: 8px;
        --border-radius-lg: 12px;
    }"""
        replacement += shadows_and_borders
        
        new_content = pattern.sub(replacement, content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            print(f"Updated :root in {file_path}")

def update_hardcoded_colors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace hardcoded colors in inline styles or other places
    content = content.replace('#667eea', '#3EB489')
    content = content.replace('#5563c6', '#28a073')
    content = content.replace('#f0f2f5', '#F6FFF9')
    content = content.replace('bg-dark', 'bg-white')
    content = content.replace('navbar-dark', 'navbar-light')
    
    # Text colors
    content = content.replace('#343a40', '#2E2E2E')
    content = content.replace('#6c757d', '#6B7280')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Updated hardcoded colors in {file_path}")

if __name__ == '__main__':
    templates = glob.glob('templates/*.html')
    for template in templates:
        update_root_vars(template)
        update_hardcoded_colors(template)

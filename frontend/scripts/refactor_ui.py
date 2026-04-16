import os
import re

dashboard_dir = r"c:\Users\Admin\Downloads\tulasihealth\frontend\app\dashboard"

for root, dirs, files in os.walk(dashboard_dir):
    for file in files:
        if file == "page.tsx" and root != dashboard_dir:  # Ignore the root dashboard page, we already fixed it manually
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 1. Remove the opening wrapper: <div className="bg-primary ...">
            content = re.sub(r'<div className="bg-primary[^>]*>\s*<div className="noise[^>]*/>\s*', '', content, count=1)

            # 2. Remove the entire <motion.aside> block
            # We use a non-greedy regex to match from <motion.aside to </motion.aside>
            content = re.sub(r'<motion\.aside.*?</motion\.aside>\s*', '', content, flags=re.DOTALL)

            # 3. Modify the <main> tag to match the new Apple layout padding/grid
            # e.g., turn <main className="flex-1 p-12 md:p-16..."> into a standard container
            content = re.sub(r'<main className="flex-1[^>]*>', r'<main className="w-full max-w-[1600px] mx-auto p-8 md:p-12 lg:p-16 min-h-screen">', content)

            # 4. Remove the closing </div> that matched the first wrapper
            # It will be the very last </div> in the main component.
            # Easiest way is to remove the last </div> before the final exported component brace.
            content = re.sub(r'</main>\s*</div>\s*\)', r'</main>\n  )', content)
            
            # 5. Aesthetic UI Search & Replace
            # Switch out "glass p-10" and linear easing for the new spring style
            content = content.replace('className="glass', 'className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px]')
            content = content.replace('ease: "easeOut"', 'type: "spring", stiffness: 300, damping: 30')
            content = content.replace('ease: [0.16, 1, 0.3, 1]', 'type: "spring", stiffness: 300, damping: 30')
            content = content.replace('font-black', 'font-semibold tracking-tight')

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Refactored: {filepath}")

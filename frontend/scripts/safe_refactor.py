import os
import re

dashboard_dir = r"c:\Users\Admin\Downloads\tulasihealth\frontend\app\dashboard"

for root, dirs, files in os.walk(dashboard_dir):
    for file in files:
        if file == "page.tsx" and root != dashboard_dir:  # Ignore the root dashboard page
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # 1. Remove the entire <motion.aside> block (sidebar) safely
            content = re.sub(r'<motion\.aside.*?</motion\.aside>\s*', '', content, flags=re.DOTALL)

            # 2. Convert the outer flex container directly without changing the HTML tree structure
            content = content.replace('className="bg-primary min-h-screen text-white font-sans flex relative overflow-hidden"', 'className="w-full max-w-[1600px] mx-auto p-8 md:p-12 lg:p-16 min-h-screen relative"')
            
            # 3. Strip out the inner <main className="..."> flex container padding so they integrate cleanly
            content = re.sub(r'<main className="flex-1[^>]*>', r'<main className="w-full">', content)

            # 4. Aesthetic UI Search & Replace
            content = content.replace('className="glass', 'className="bg-white/[0.015] border border-white/[0.03] shadow-[inset_0_1px_rgba(255,255,255,0.02)] rounded-[32px]')
            content = content.replace('ease: "easeOut"', 'type: "spring", stiffness: 300, damping: 30')
            content = content.replace('ease: [0.16, 1, 0.3, 1]', 'type: "spring", stiffness: 300, damping: 30')
            
            # Less aggressive text softening
            content = content.replace('text-[13px] font-black', 'text-[14px] font-semibold')
            content = content.replace('font-black', 'font-semibold tracking-tight')

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Safe Refactored: {filepath}")

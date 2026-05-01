import re

with open('src/app/dashboard/DashboardClient.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

div_count = 0
for i, line in enumerate(lines):
    opens = line.count('<div')
    closes = line.count('</div')
    div_count += opens - closes
    if div_count < 0:
        print(f"Negative div count at line {i+1}: {line.strip()}")
    pass
print("Total divs left open:", div_count)

print("Total divs left open:", div_count)

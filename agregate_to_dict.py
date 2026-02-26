# aggregate_to_dict.py
# Run: python aggregate_to_dict.py

import json
from collections import defaultdict

# Change this to your actual JSON file name
input_file = "slovenia_car_db.json"  # ← your 25,000-line file

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Aggregate: make + core_model → total count
agg = defaultdict(int)

for entry in data:
    make = entry.get('make', '').strip().upper()
    # Take core model name (before / or numbers)
    model_raw = entry.get('model', '').strip().upper()
    # Remove version numbers, /, TDI, TCE, 1.6 etc. - keep core name
    core_model = model_raw.split('/')[0].strip()
    core_model = ' '.join([w for w in core_model.split() if not any(c.isdigit() for c in w) and len(w) > 1])
    
    if make and core_model:
        key = f"{make} {core_model}"
        agg[key] += entry['count']

# Sort by count descending
sorted_agg = sorted(agg.items(), key=lambda x: x[1], reverse=True)

# Prepare final dictionary
popularity_dict = {}
for key, total_count in sorted_agg:
    popularity_dict[key] = total_count

# Save as JSON (easy to copy-paste)
output_file = "popularity_dict.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(popularity_dict, f, ensure_ascii=False, indent=2)

print(f"Saved {len(popularity_dict)} unique make-model combinations")
print("Top 20 most popular:")
for key, cnt in list(popularity_dict.items())[:20]:
    print(f"{key}: {cnt:,}")

print(f"\nCopy the content of {output_file} into your modelRiskDB.js")
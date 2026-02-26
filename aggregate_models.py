# aggregate_models.py - run with: python aggregate_models.py
import json
from collections import defaultdict

# Load your JSON file (change name if different)
with open('slovenia_car_db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Aggregate: make + core_model → total count
agg = defaultdict(int)

for entry in data:
    make = entry['make'].strip().upper()
    # Normalize model: take first word after split by / or space, remove numbers/versions
    model_raw = entry['model'].split('/')[0].strip().upper()
    model = ' '.join([w for w in model_raw.split() if not w.isdigit() and len(w) > 1])  # remove numbers
    if model:
        key = f"{make} {model}"
        agg[key] += entry['count']

# Sort by count descending
sorted_agg = sorted(agg.items(), key=lambda x: x[1], reverse=True)

# Prepare final list for extension
final_list = []
for key, cnt in sorted_agg[:5000]:  # limit to top 5000 if too many
    make, model = key.split(' ', 1)
    final_list.append({
        "make": make,
        "model": model,
        "count": cnt
    })

# Save as new JSON
with open('aggregated_car_db.json', 'w', encoding='utf-8') as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print(f"Saved {len(final_list)} unique make-model entries")
print("Top 10:")
for item in final_list[:10]:
    print(f"{item['make']} {item['model']}: {item['count']}")
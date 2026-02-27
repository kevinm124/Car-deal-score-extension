import json

# Change to your file name
input_file = "slovenia_car_db_final.json"   # or "popularity_dict.json"

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# If it's array, convert to dict
if isinstance(data, list):
    popularity = {}
    for item in data:
        make = item.get('make', '').upper()
        model = item.get('model', '').upper().split(' ')[0]
        key = f"{make} {model}"
        popularity[key] = item.get('count', 0)
else:
    popularity = data

# Generate issues skeleton
issues_skeleton = {}
for key in sorted(popularity.keys()):
    issues_skeleton[key] = []

# Save
with open('issues_skeleton2.json', 'w', encoding='utf-8') as f:
    json.dump(issues_skeleton, f, ensure_ascii=False, indent=2)

print(f"Generated {len(issues_skeleton)} empty issues entries")
print("Top 10:")
for key in list(issues_skeleton.keys())[:10]:
    print(f'"{key}": [],')
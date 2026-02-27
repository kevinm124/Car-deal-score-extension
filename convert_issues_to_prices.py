# convert_issues_to_prices.py
# Run: python convert_issues_to_prices.py

import json
import random

# Input: your current issues file
input_file = "issues.json"  # change if different

# Output: new marketPrices file
output_file = "marketPrices_generated.json"

# Load your issues JSON
with open(input_file, 'r', encoding='utf-8') as f:
    issues_data = json.load(f)

# New dictionary for prices
prices = {}

for model_key, issues_array in issues_data.items():
    # Step 1: Guess a realistic year based on model name (customize as needed)
    year = "2020"  # default fallback

    # Simple rules - add more for your common models
    if "Golf 7" in model_key or "Mk7" in model_key:
        year = "2018"
    elif "F30" in model_key:
        year = "2015"
    elif "B8" in model_key:
        year = "2012"
    elif "X5" in model_key:
        year = "2024"
    elif "5 Series" in model_key:
        year = "2020"
    elif "C-Class" in model_key:
        year = "2023"
    elif "Insignia" in model_key:
        year = "2019"
    elif "Clio" in model_key:
        year = "2019"
    elif "Octavia" in model_key:
        year = "2021"
    # Add 10–20 more rules for your top models if you want better accuracy

    # Step 2: Create new key "Make Model_year"
    new_key = f"{model_key}_{year}"

    # Step 3: Set placeholder price
    # Option A: fixed 0 (you fill later)
    price = 0

    # Option B: random realistic price (for testing)
    # price = random.randint(5000, 85000)

    prices[new_key] = price

# Save the new file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(prices, f, ensure_ascii=False, indent=2)

print(f"Converted {len(prices)} models to price format")
print(f"Saved to: {output_file}")
print("\nFirst 10 entries (example):")
for key, value in list(prices.items())[:10]:
    print(f'"{key}": {value},')
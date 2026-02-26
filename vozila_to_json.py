import pandas as pd
import json

csv_file = "Nio_vozila_1.csv"  # change if your filename is different (e.g. "vozila.csv")

try:
    df = pd.read_csv(csv_file, sep=';', encoding='latin1', low_memory=False, on_bad_lines='skip')
    print("Loaded OK. Shape:", df.shape)
except Exception as e:
    print("Load error:", e)
    exit()

# Correct columns from your debug:
make_col   = df.columns[20]   # D1-Znamka
model_col  = df.columns[22]   # D3-Komerc oznaka
date_col   = df.columns[25]   # D5-Datum COC (for year)
fuel_col   = df.columns[48]   # P13-Vrsta goriva (opis)

print("\nUsing these columns:")
print(f"Make: {make_col}")
print(f"Model: {model_col}")
print(f"Date (year): {date_col}")
print(f"Fuel: {fuel_col}")

# Extract and clean
df_clean = pd.DataFrame({
    'make': df[make_col].astype(str).str.strip().str.upper(),
    'model': df[model_col].astype(str).str.strip(),
    'year': pd.to_numeric(df[date_col].astype(str).str[-4:], errors='coerce').astype('Int64'),
    'fuel': df[fuel_col].astype(str).str.strip().str.title()
})

# Remove invalid rows
df_clean = df_clean.dropna(subset=['make', 'model', 'year'])
df_clean = df_clean[df_clean['make'].str.len() > 2]  # remove junk

print("\nCleaned data preview (first 10):")
print(df_clean.head(10).to_string())

# Aggregate counts
grouped = df_clean.groupby(['make', 'model', 'year', 'fuel']).size().reset_index(name='count')
grouped = grouped.sort_values('count', ascending=False)

print("\nTop 10 most common:")
print(grouped.head(10).to_string())

# Save full aggregated JSON
json_data = grouped.to_dict(orient='records')

output_file = "slovenia_car_db.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(json_data)} unique combinations to {output_file}")
print("Ready to copy into your extension!")
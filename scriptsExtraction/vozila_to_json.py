import pandas as pd
import json

csv_file = "Nio_vozila_2.csv"  # ← change if your file name is different

try:
    df = pd.read_csv(csv_file, sep=';', encoding='latin1', low_memory=False, on_bad_lines='skip')
    print("Loaded OK. Shape:", df.shape)
    print("Columns:", df.columns.tolist())
except Exception as e:
    print("Load error:", e)
    exit()

# Use YOUR real column names (from print above)
df = df.rename(columns={
    'D1-Znamka': 'make',
    'D3-Komerc oznaka': 'model',
    'D5-Datum izdaje COC dokumenta oz prve registracije': 'date',  # we'll extract year from this
    'P13-Vrsta goriva (opis)': 'fuel'
})

# Extract year from date column (last 4 digits, e.g. "23.06.2009" → 2009)
df['year'] = pd.to_numeric(df['date'].astype(str).str[-4:], errors='coerce').astype('Int64')

# Drop date column (not needed anymore)
df = df.drop(columns=['date'])

# Clean
df['make'] = df['make'].astype(str).str.strip().str.upper()
df['model'] = df['model'].astype(str).str.strip()
df['fuel'] = df['fuel'].astype(str).str.strip().str.title()

# Remove invalid rows
df = df.dropna(subset=['make', 'model', 'year'])
df = df[df['make'].str.len() > 2]  # remove junk like single letters

print("\nCleaned preview (first 10 rows):")
print(df.head(10).to_string())

# Aggregate counts
grouped = df.groupby(['make', 'model', 'year', 'fuel']).size().reset_index(name='count')
grouped = grouped.sort_values('count', ascending=False)

# Save as JSON
json_data = grouped.to_dict(orient='records')

output_file = "slovenia_car_db_final.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(json_data)} entries to {output_file}")
print("Top 10:")
print(json.dumps(json_data[:10], indent=2, ensure_ascii=False))
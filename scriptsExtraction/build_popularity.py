# build_popularity.py – rebuilds popularity.json (registered cars per make+model in Slovenia)
# from carDB/slovenia_car_db_final.json. The older sloveniaPopularity.json lost every
# model name containing digits (Peugeot 308, Audi A4, BMW 320d ...).
# Run from the repo root: python scriptsExtraction/build_popularity.py
import json
import re
import unicodedata
from collections import Counter

MAKE_ALIASES = {"KODA": "SKODA", "MERCEDES-BENZ": "MERCEDES BENZ", "CITROËN": "CITROEN"}


def norm(s):
    # The registry export was decoded as Latin-1 instead of cp1250 ("KODA" = "ŠKODA").
    try:
        s = (s or "").encode("latin-1").decode("cp1250")
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s.upper()).strip()


with open("carDB/slovenia_car_db_final.json", encoding="utf-8") as f:
    rows = json.load(f)

counts = Counter()
for r in rows:
    make = MAKE_ALIASES.get(norm(r["make"]), norm(r["make"]))
    first = norm(r["model"]).split("/")[0].strip()
    if not first:
        continue
    model = first.split(" ")[0]
    counts[f"{make} {model}"] += r["count"]
    # BMW registers engines ("320", "520"); also count them per series ("BMW 3").
    if make == "BMW" and re.fullmatch(r"[1-8]\d\d[A-Z]?", model):
        counts[f"BMW {model[0]}"] += r["count"]
    # Two-word model names ("C4 PICASSO", "GRAND SCENIC")
    if " " in first:
        counts[f"{make} {first}"] += r["count"]

popular = {k: v for k, v in sorted(counts.items(), key=lambda kv: -kv[1]) if v >= 5}
with open("popularity.json", "w", encoding="utf-8") as f:
    json.dump(popular, f, ensure_ascii=False, indent=0)
print(f"wrote {len(popular)} models")

#!/usr/bin/env python3
"""
Atlas Pannoniae Praehistoricae: data pipeline

Reads the merged GeoJSON (all source layers in one file) and writes the cleaned
dataset used by the website:

    src/data/atlas/pannonia-sites.json     what the map shows
    scripts/atlas/hidden/hidden-sites.json what is switched off for now (nothing is deleted)
    scripts/atlas/report.txt               a plain-text summary of what changed

Run from the project root:

    pip install shapely
    python scripts/atlas/build_data.py

What it does
  1. Hides records that are not prehistoric or are outside the study area (see HIDDEN below).
  2. Turns every period label into a period + early/mid/late tone using an EXPLICIT table.
     An unknown label stops the script with an error instead of being guessed.
  3. Merges true duplicates (same name, place, period and culture) and keeps their layer names.
  4. Assigns the modern country from the point's position (Natural Earth borders, public domain).
  5. Ranks cultures inside each period by number of sites and assigns each a marker shape.
"""
import json
import math
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts/atlas/source/prehistoric_pannonia_adriatic.geojson"
BORDERS = ROOT / "scripts/atlas/source/countries_region.geojson"
OUT_SITES = ROOT / "src/data/atlas/pannonia-sites.json"
OUT_HIDDEN = ROOT / "scripts/atlas/hidden/hidden-sites.json"
OUT_REPORT = ROOT / "scripts/atlas/report.txt"

# ---------------------------------------------------------------------------
# HIDDEN FOR NOW ("commented out").
# To bring a group back later, delete its line here and run the script again.
# Hidden records are saved in scripts/atlas/hidden/hidden-sites.json, not deleted.
# ---------------------------------------------------------------------------
HIDDEN_LAYERS = {
    "roman_pannonia_pois": "Roman period, not prehistoric",
    "barbaricum_roman_period": "Roman period (Barbaricum), not prehistoric",
    "migration_period_pannonia": "Migration Period, not prehistoric",
    "carpathian_basin_burials_10_11c": "Medieval, 10th-11th century, not prehistoric",
    "paleolithic_art_europe": "Europe-wide Palaeolithic art, outside the study area",
}
HIDDEN_PERIOD_LABELS = {
    "10th-11th century": "Medieval, not prehistoric",
    "5th century A.D.": "Migration Period, not prehistoric",
    "6th century A.D.": "Migration Period, not prehistoric",
    "Avar period": "Avar period, not prehistoric",
}

# ---------------------------------------------------------------------------
# PERIOD TABLE: raw label -> (period, tone)
#   periods: paleo (Palaeolithic and Mesolithic share one class), neo, eneo, bronze, iron
#   tone:    early | mid | late | None (label does not say; drawn in the mid tone)
# Labels naming two adjacent periods ("transition") are drawn in the EARLIER
# period, in its late tone. Labels naming a range inside one period use the mid tone.
# ---------------------------------------------------------------------------
PERIODS = {
    "Lower Palaeolithic": ("paleo", "early"),
    "Middle Palaeolithic": ("paleo", "mid"),
    "Upper Palaeolithic": ("paleo", "late"),
    "Paleolithic": ("paleo", None),
    "Paleolithic / Mesolithic": ("paleo", None),
    "Early Holocene / Mesolithic": ("paleo", None),
    "Mesolithic": ("paleo", None),
    "Neolithic": ("neo", None),
    "Early Neolithic": ("neo", "early"),
    "Middle Neolithic": ("neo", "mid"),
    "Late Neolithic": ("neo", "late"),
    "Late Neolithic / Eneolithic transition": ("neo", "late"),
    "Neolithic / Eneolithic transition": ("neo", "late"),
    "Copper Age / Eneolithic": ("eneo", None),
    "Early Copper Age": ("eneo", "early"),
    "Middle Copper Age": ("eneo", "mid"),
    "Late Copper Age": ("eneo", "late"),
    "Copper Age / Early Bronze Age": ("eneo", "late"),
    "Bronze Age": ("bronze", None),
    "Early Bronze Age": ("bronze", "early"),
    "Middle Bronze Age": ("bronze", "mid"),
    "Late Bronze Age": ("bronze", "late"),
    "Urnfield / Bronze Age": ("bronze", None),
    "Urnfield / Late Bronze Age": ("bronze", "late"),
    "Iron Age": ("iron", None),
    "Early Iron Age (Hallstatt)": ("iron", "early"),
    "Early and Middle Iron Age": ("iron", "mid"),
    "Late Iron Age": ("iron", "late"),
    "La Tène": ("iron", "late"),
}

# Marker shapes, in strict order. Circle = culture not specified / not among the top
# cultures of the period. Named cultures then take the next shapes by number of sites.
SHAPES = ["circle", "square", "triangle", "diamond", "star", "semicircle",
          "pentagon", "hexagon", "cross", "ring", "octagon", "crescent"]
NAMED_SHAPES = SHAPES[1:]            # 11 named cultures per period

COUNTRY_SNAP_KM = 12                 # points just offshore are moved to the nearest country
BORDER_NOTE_KM = 4                   # points this close to a border are flagged

SOURCES = [
    "Praistorija Jugoslavenskih Zemalja, vols. I-V (Akademija nauka i umjetnosti Bosne i Hercegovine)",
    "Hungarian Archaeology at the Turn of the Millennium (Zsolt Visy et al.; Teleki László Foundation / Ministry of National Cultural Heritage)",
]


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "site"


def km_between(lon1, lat1, lon2, lat2):
    dx = (lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2)) * 111.32
    dy = (lat2 - lat1) * 110.57
    return math.hypot(dx, dy)


def load_borders():
    data = json.loads(BORDERS.read_text(encoding="utf-8"))
    geoms = [shape(f["geometry"]) for f in data["features"]]
    names = [f["properties"]["name"] for f in data["features"]]
    return geoms, names, STRtree(geoms)


def country_of(lon, lat, geoms, names, tree):
    """Return (country, flag). flag is '' | 'border' | 'coast' | 'unknown'."""
    p = Point(lon, lat)
    inside = [i for i in tree.query(p) if geoms[i].contains(p)]
    if inside:
        i = inside[0]
        # flag points close to ANOTHER country (the coastline is not a border)
        near_km = min(
            (geoms[j].distance(p) * 111.0 * math.cos(math.radians(lat))
             for j in tree.query(p.buffer(0.1)) if j != i),
            default=1e9,
        )
        return names[i], ("border" if near_km < BORDER_NOTE_KM else "")
    # not inside any polygon: snap to the nearest country if close enough (coast, islands)
    best, best_km = None, 1e9
    for i in tree.query(p.buffer(0.3)):
        d = geoms[i].distance(p) * 111.0 * math.cos(math.radians(lat))
        if d < best_km:
            best, best_km = i, d
    if best is not None and best_km <= COUNTRY_SNAP_KM:
        return names[best], "coast"
    return "Unknown", "unknown"


def main():
    raw = json.loads(SRC.read_text(encoding="utf-8"))["features"]
    geoms, names, tree = load_borders()

    visible, hidden = [], []
    for ft in raw:
        pr = ft["properties"]
        lon, lat = ft["geometry"]["coordinates"][:2]
        label = (pr.get("period_major") or "").strip()
        layer = (pr.get("source_layer") or pr.get("source_file") or "").replace(".geojson", "")
        reason = HIDDEN_LAYERS.get(layer) or HIDDEN_PERIOD_LABELS.get(label)
        rec = {"name": re.sub(r"\s+", " ", (pr.get("name") or "").strip()),
               "culture": (pr.get("culture") or "").strip(), "label": label,
               "layer": layer, "lon": float(lon), "lat": float(lat)}
        if reason:
            rec["hidden_reason"] = reason
            hidden.append(rec)
        else:
            visible.append(rec)

    # unknown labels stop the script (no silent guessing)
    unknown = sorted({r["label"] for r in visible if r["label"] not in PERIODS})
    if unknown:
        sys.exit("Unmapped period labels (add them to PERIODS or HIDDEN_PERIOD_LABELS):\n  " + "\n  ".join(unknown))

    # merge true duplicates: same name, place (3 decimals), period label and culture
    merged = {}
    for r in visible:
        key = (r["name"].casefold(), round(r["lon"], 3), round(r["lat"], 3), r["label"], r["culture"].casefold())
        if key in merged:
            if r["layer"] not in merged[key]["layers"]:
                merged[key]["layers"].append(r["layer"])
        else:
            merged[key] = {**r, "layers": [r["layer"]]}
    unique = list(merged.values())

    # country, period, tone
    flags = Counter()
    for r in unique:
        r["period"], tone = PERIODS[r["label"]]
        r["tone"] = tone or "mid"
        r["toneStated"] = tone is not None
        r["country"], r["cflag"] = country_of(r["lon"], r["lat"], geoms, names, tree)
        flags[r["cflag"] or "ok"] += 1
        r["culture"] = None if r["culture"].lower() in ("", "undetermined") else r["culture"]

    # culture ranking inside each period, by number of sites
    ranks = {}
    for period in ("paleo", "neo", "eneo", "bronze", "iron"):
        counts = Counter(r["culture"] for r in unique if r["period"] == period and r["culture"])
        ordered = [c for c, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0].casefold()))]
        ranks[period] = [{"culture": c, "sites": counts[c], "shape": NAMED_SHAPES[i]}
                         for i, c in enumerate(ordered[: len(NAMED_SHAPES)])]
    shape_of = {(p, e["culture"]): e["shape"] for p, lst in ranks.items() for e in lst}

    # stable ids
    used = Counter()
    out = []
    for r in sorted(unique, key=lambda r: (r["name"].casefold(), r["lon"], r["lat"], r["label"])):
        base = f"{slug(r['name'])}-{round(r['lon'] * 100)}-{round(r['lat'] * 100)}-{r['period']}"
        used[base] += 1
        sid = base if used[base] == 1 else f"{base}-{used[base]}"
        out.append({
            "id": sid, "name": r["name"], "culture": r["culture"],
            "period": r["period"], "tone": r["tone"], "toneStated": r["toneStated"],
            "label": r["label"], "country": r["country"], "cflag": r["cflag"],
            "lon": round(r["lon"], 4), "lat": round(r["lat"], 4),
            "layers": sorted(r["layers"]),
            "shape": shape_of.get((r["period"], r["culture"]), "circle"),
        })

    countries = Counter(s["country"] for s in out)
    meta = {
        "title": "Atlas Pannoniae Praehistoricae",
        "built": date.today().isoformat(),
        "sources": SOURCES,
        "counts": {"visible": len(out), "hidden": len(hidden)},
        "periods": Counter(s["period"] for s in out),
        "countries": [{"name": n, "sites": c} for n, c in countries.most_common()],
        "cultureRanks": ranks,
    }
    OUT_SITES.parent.mkdir(parents=True, exist_ok=True)
    OUT_HIDDEN.parent.mkdir(parents=True, exist_ok=True)
    OUT_SITES.write_text(json.dumps({"meta": meta, "sites": out}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_HIDDEN.write_text(json.dumps(hidden, ensure_ascii=False, indent=1), encoding="utf-8")

    hid = Counter(h["hidden_reason"] for h in hidden)
    lines = [
        "ATLAS DATA REPORT", "=" * 60,
        f"Records in source file:            {len(raw)}",
        f"Hidden for now:                    {len(hidden)}",
        *[f"    {n:4d}  {why}" for why, n in hid.most_common()],
        f"Visible records before merging:    {len(visible)}",
        f"True duplicates merged:            {len(visible) - len(unique)}",
        f"Sites shown on the map:            {len(out)}",
        "", "Sites per period:",
        *[f"    {p:7s} {n:5d}" for p, n in sorted(meta["periods"].items())],
        "", "Tone not stated in the label (drawn in the mid tone): "
        f"{sum(1 for s in out if not s['toneStated'])}",
        "", "Country assignment:",
        f"    inside a country, clear of borders: {flags['ok']}",
        f"    within {BORDER_NOTE_KM} km of a border (flagged):    {flags['border']}",
        f"    offshore, moved to nearest land (<= {COUNTRY_SNAP_KM} km): {flags['coast']}",
        f"    unresolved:                         {flags['unknown']}",
        "", "Sites per country:", *[f"    {c['sites']:5d}  {c['name']}" for c in meta["countries"]],
        "", "Culture shapes per period (top 11 named cultures):",
    ]
    for p, lst in ranks.items():
        lines.append(f"  {p}: " + ", ".join(f"{e['shape']}={e['culture']} ({e['sites']})" for e in lst[:6]) + (" ..." if len(lst) > 6 else ""))
    OUT_REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

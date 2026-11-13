# Atlas data pipeline

Turns the merged source file into the cleaned dataset the website uses.

```
pip install shapely
python scripts/atlas/build_data.py
```

| File | Purpose |
|---|---|
| `source/prehistoric_pannonia_adriatic.geojson` | The merged source data (input). Replace it when you have a new merge. |
| `source/countries_region.geojson` | Present-day country borders for the region (Natural Earth 1:10m, public domain; clipped and simplified). Used to assign each point's country. |
| `build_data.py` | The pipeline. The tables at the top (hidden layers, period labels, marker shapes) are the settings. |
| `hidden/hidden-sites.json` | Records switched off for now, with the reason. Nothing is deleted. |
| `report.txt` | What the last run did: counts, hidden records, country checks, culture shapes. |
| `../../src/data/atlas/pannonia-sites.json` | The output. The website reads this file. |

## Bringing hidden records back later

Open `build_data.py`. Delete the line of the group you want in `HIDDEN_LAYERS` (or `HIDDEN_PERIOD_LABELS`), then add its period labels to the `PERIODS` table if they are not there yet, and run the script again. The script stops with a clear message if it meets a period label it does not know, instead of guessing.

## Adding or changing a period label

Add one line to `PERIODS`: `"Label as in the data": ("period", "tone")`.
Periods are `paleo`, `neo`, `eneo`, `bronze`, `iron`. Tones are `early`, `mid`, `late`, or `None` when the label does not say (drawn in the mid tone).

## After running

Run `npm run build` and look at `/atlas/pannonia`. The legend and shapes update by themselves.

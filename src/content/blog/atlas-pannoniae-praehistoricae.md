---
title: "Atlas Pannoniae Praehistoricae: a map of prehistoric Pannonia"
description: "An interactive map sandbox project of more than 2,400 prehistoric sites, from the Pannonian Basin to the Adriatic coast, built from two reference works."
pubDate: 2026-11-11
tags: ["Map design", "Geospatial databases"]
# To show a screenshot at the top of the post, put the image in src/assets/blog/ and remove the # below:
cover: "../../assets/blog/atlas-pannoniae-praehistoricae.png"
draft: false
---
**[Open the Atlas Pannoniae Praehistoricae →](/atlas/pannonia)**

<!-- TODO: replace this placeholder with your own introduction: why this atlas, and what you hoped to find. -->

The Atlas Pannoniae Praehistoricae is an interactive map of prehistoric archaeological sites in Pannonia, the Dinaric Alps and along the Adriatic coast, from the Paleolithic to the Iron Age. It shows 2,410 sites, taken from two reference works:

- *Praistorija Jugoslavenskih Zemalja*, vols. I–V (Akademija nauka i umjetnosti Bosne i Hercegovine)
- *Hungarian Archaeology at the Turn of the Millennium* (Zsolt Visy et al.; Teleki László Foundation / Ministry of National Cultural Heritage)

## How to read the map

- **Colour** is the period. Lighter to darker tones of the same colour mean early, mid and late phases.
- **Size and stacking:** earlier periods are drawn larger and lie underneath later ones. A place used again and again shows up as a set of rings.
- **Shape** is the culture, within its own period. The most numerous cultures of a period get a shape each.
- Use the period roller at the top of the side panel to step through the periods, search by site, culture or country, and click any marker for its details.

## What the data can and cannot tell you

- Positions are given to two decimal places, which is roughly a kilometre, so a marker may sit slightly away from the true site.
- The dataset does not record which volume or page of the books a site comes from, and it has no calendar dates or site types.
- Roman, Migration Period, Avar and medieval records are in the source data but are not shown, because they are not prehistoric.
- The country of each site is worked out from its position, using present-day borders.

## How it was built

<!-- TODO: write a few sentences, in your own words, about building the atlas. -->

The data was cleaned with a small script: repeated records were merged, every period label was mapped to a period and phase by an explicit table, and countries were assigned from border data. The map itself is drawn with MapLibre GL JS, which puts every marker on the graphics card so that filtering is instant, even on a phone.

## What comes next

<!-- TODO: list what you plan to add, for example the later periods that are hidden for now, or more source works. -->

**[Open the Atlas Pannoniae Praehistoricae →](/atlas/pannonia)**  


**[More atlas projects →](/atlas)**

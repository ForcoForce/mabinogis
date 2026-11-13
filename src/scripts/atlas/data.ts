import dataUrl from "@/data/atlas/pannonia-sites.json?url";
import type { PeriodKey, Tone, ShapeName } from "./config";

export interface Site {
  id: string;
  name: string;
  culture: string | null;
  period: PeriodKey;
  tone: Tone;
  /** true when the source label itself names an early, middle or late phase */
  toneStated: boolean;
  /** the period label exactly as it appears in the dataset */
  label: string;
  country: string;
  /** "" | "border" | "coast" | "unknown": how reliable the country is (see the About text) */
  cflag: "" | "border" | "coast" | "unknown";
  lon: number;
  lat: number;
  layers: string[];
  shape: ShapeName;
  /** lower-case, accent-free text used by the search box */
  search: string;
}

export interface CultureRank {
  culture: string;
  sites: number;
  shape: ShapeName;
}

export interface AtlasMeta {
  title: string;
  built: string;
  sources: string[];
  counts: { visible: number; hidden: number };
  countries: { name: string; sites: number }[];
  cultureRanks: Record<PeriodKey, CultureRank[]>;
}

export interface AtlasData {
  meta: AtlasMeta;
  sites: Site[];
  byId: Map<string, Site>;
  /** sites that share a place (3 decimals), used for "also recorded here" */
  byPlace: Map<string, Site[]>;
}

/** lower-case and remove accents, so "Kastel" finds "Kaštel" */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function placeKey(s: { lon: number; lat: number }): string {
  return `${s.lon.toFixed(3)},${s.lat.toFixed(3)}`;
}

export async function loadAtlasData(): Promise<AtlasData> {
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`Could not load the atlas data (HTTP ${res.status})`);
  const json = (await res.json()) as { meta: AtlasMeta; sites: Omit<Site, "search">[] };

  const sites: Site[] = json.sites.map((s) => ({
    ...s,
    search: fold(`${s.name} ${s.culture ?? ""} ${s.country} ${s.label}`),
  }));
  const byId = new Map(sites.map((s) => [s.id, s]));
  const byPlace = new Map<string, Site[]>();
  for (const s of sites) {
    const key = placeKey(s);
    const list = byPlace.get(key);
    if (list) list.push(s);
    else byPlace.set(key, [s]);
  }
  return { meta: json.meta, sites, byId, byPlace };
}

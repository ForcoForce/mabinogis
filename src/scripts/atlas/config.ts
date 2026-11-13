// Shared by the Astro page (legend markup) and the browser scripts.
// No browser-only code in this file.

export type PeriodKey = "paleo" | "neo" | "eneo" | "bronze" | "iron";
export type Tone = "early" | "mid" | "late";

export interface PeriodDef {
  label: string;
  /** marker diameter in px; earlier periods are larger so they show as rings under later ones */
  size: number;
  /** stacking order: higher is drawn on top */
  z: number;
  /** the pastel colours actually drawn (derived from the spec colours below) */
  colors: Record<Tone, string>;
}

/** How much softer the spec colours are drawn. Raise `lighten` for paler, lower it for stronger colours. */
export const PASTEL = { saturation: 0.88, lighten: 0.16, lightenWhenAlreadyLight: 0.04 };

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** A softer, more pastel version of a colour. Very light colours barely change, so they stay visible. */
export function pastel(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  const lift = l > 0.85 ? PASTEL.lightenWhenAlreadyLight : PASTEL.lighten;
  return hslToHex(h, s * PASTEL.saturation, l + (1 - l) * lift);
}

const soften = (c: Record<Tone, string>): Record<Tone, string> => ({ early: pastel(c.early), mid: pastel(c.mid), late: pastel(c.late) });

export const PERIOD_ORDER: PeriodKey[] = ["paleo", "neo", "eneo", "bronze", "iron"];

/** The period colours from the project brief, before they are softened */
const SPEC_COLORS: Record<PeriodKey, Record<Tone, string>> = {
  paleo: { early: "#fdf6bb", mid: "#f6e166", late: "#e8be2b" },
  neo: { early: "#f6b3a8", mid: "#e47665", late: "#bd3d2b" },
  eneo: { early: "#bfe7d1", mid: "#73c79e", late: "#2f9667" },
  bronze: { early: "#fed9ad", mid: "#f5a85e", late: "#db7822" },
  iron: { early: "#a3c5f4", mid: "#5f96e0", late: "#2762b8" },
};

export const PERIODS: Record<PeriodKey, PeriodDef> = {
  paleo: { label: "Paleolithic / Mesolithic", size: 13.5, z: 1, colors: soften(SPEC_COLORS.paleo) },
  neo: { label: "Neolithic", size: 12.15, z: 2, colors: soften(SPEC_COLORS.neo) },
  eneo: { label: "Copper Age (Eneolithic)", size: 10.8, z: 3, colors: soften(SPEC_COLORS.eneo) },
  bronze: { label: "Bronze Age", size: 9.45, z: 4, colors: soften(SPEC_COLORS.bronze) },
  iron: { label: "Iron Age", size: 8.1, z: 5, colors: soften(SPEC_COLORS.iron) },
};

/** The period shown when the atlas opens: "all" or one of the period keys */
export const START_PERIOD: PeriodKey | "all" = "paleo";

/** Markers grow by this factor while the pointer is over them */
export const HOVER_SCALE = 1.33;

/** Neutral fill for "culture not specified" in the legend */
export const NEUTRAL_FILL = "#bcab90";

export const TONES: Tone[] = ["early", "mid", "late"];
export const TONE_LABEL: Record<Tone, string> = { early: "Early", mid: "Mid", late: "Late" };

export const SHAPES = [
  "circle", "square", "triangle", "diamond", "star", "semicircle",
  "pentagon", "hexagon", "cross", "ring", "octagon", "crescent",
] as const;
export type ShapeName = (typeof SHAPES)[number];

export const SHAPE_LABEL: Record<ShapeName, string> = {
  circle: "Circle", square: "Square", triangle: "Triangle", diamond: "Diamond", star: "Star",
  semicircle: "Semicircle", pentagon: "Pentagon", hexagon: "Hexagon", cross: "Cross",
  ring: "Ring", octagon: "Octagon", crescent: "Crescent",
};

/** Initial map view: the Pannonian Basin, the Dinarides and the Adriatic coast */
export const REGION_BOUNDS: [[number, number], [number, number]] = [[12.8, 41.0], [24.8, 48.8]];
/** The map cannot be panned far outside Central and South-East Europe */
export const MAX_BOUNDS: [[number, number], [number, number]] = [[2, 33], [38, 57]];

export const MIN_ZOOM = 5;
export const MAX_ZOOM = 14;

export const BASEMAP_CREDITS = {
  archive: [
    { text: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
    { text: "Relief: Esri, USGS, NOAA", href: "https://www.esri.com" },
  ],
  satellite: [
    { text: "Imagery: Esri, Maxar, Earthstar Geographics and the GIS User Community", href: "https://www.esri.com" },
    { text: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
  ],
};

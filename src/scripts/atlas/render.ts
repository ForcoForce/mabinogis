// Small DOM builders. Everything is inserted with textContent, never as raw HTML.
import { PERIODS, TONE_LABEL, NEUTRAL_FILL, type PeriodKey, type ShapeName } from "./config";
import { shapeDataUrl } from "./symbols";
import type { AtlasData, CultureRank, Site } from "./data";

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}

export function swatch(shape: ShapeName, color: string, px = 22): HTMLImageElement {
  const img = el("img", { class: "swatch", alt: "", width: String(px), height: String(px) });
  img.src = shapeDataUrl(shape, color, px);
  return img;
}

export function siteSwatch(site: Site, px = 22): HTMLImageElement {
  return swatch(site.shape, PERIODS[site.period].colors[site.tone], px);
}

/** The period/phase text shown under a site name */
export function periodText(site: Site): string {
  return site.label;
}

export function renderList(
  container: HTMLElement,
  sites: Site[],
  limit: number,
  onPick: (id: string) => void,
  activeId: string | null,
  onHover?: (id: string | null) => void,
) {
  container.replaceChildren();
  for (const s of sites.slice(0, limit)) {
    const meta = [periodText(s), s.culture, s.country].filter(Boolean).join(" · ");
    const btn = el(
      "button",
      { type: "button", class: "row" + (s.id === activeId ? " row--active" : ""), "data-id": s.id },
      siteSwatch(s),
      el("span", { class: "row__text" }, el("span", { class: "row__name" }, s.name), el("span", { class: "row__meta" }, meta)),
    );
    btn.addEventListener("click", () => onPick(s.id));
    if (onHover) {
      btn.addEventListener("mouseenter", () => onHover(s.id));
      btn.addEventListener("mouseleave", () => onHover(null));
    }
    container.append(el("li", {}, btn));
  }
}

export interface RollerItem {
  value: string;
  label: string;
  count: number;
}

/** The period roller: one row per period; the script slides the list so the chosen row sits in the middle. */
export function renderRoller(list: HTMLElement, items: RollerItem[], onPick: (index: number) => void) {
  list.replaceChildren();
  items.forEach((item, i) => {
    const btn = el(
      "button",
      { type: "button", class: "roller__item", role: "option", id: `roller-opt-${i}`, tabindex: "-1", "aria-selected": "false", "data-index": String(i) },
      el("span", { class: "roller__label" }, item.label),
      el("span", { class: "roller__n" }, item.count.toLocaleString("en")),
    );
    btn.addEventListener("click", () => onPick(i));
    list.append(el("li", { role: "presentation" }, btn));
  });
}

export function renderLegendShapes(container: HTMLElement, period: PeriodKey | "all", ranks: Record<PeriodKey, CultureRank[]>) {
  container.replaceChildren();
  if (period === "all") {
    container.append(el("li", { class: "legend__hint" }, "Pick a period to see which culture each shape stands for. The shape always refers to a culture within its own period."));
    return;
  }
  const grey = NEUTRAL_FILL;
  container.append(el("li", {}, swatch("circle", grey, 20), el("span", {}, "Culture not specified, or not among the most numerous")));
  for (const r of ranks[period]) {
    container.append(el("li", {}, swatch(r.shape as ShapeName, grey, 20), el("span", {}, `${r.culture} `, el("em", {}, `(${r.sites})`))));
  }
}

function fact(label: string, value: Child, extra?: Child) {
  return el("div", { class: "fact" }, el("dt", {}, label), el("dd", {}, value, extra));
}

export interface DetailHandlers {
  onBack: () => void;
  onPick: (id: string) => void;
}

export function renderDetail(container: HTMLElement, site: Site, data: AtlasData, h: DetailHandlers) {
  const def = PERIODS[site.period];
  const back = el("button", { type: "button", class: "back" }, "← Back to the list");
  back.addEventListener("click", h.onBack);

  const phase = site.toneStated
    ? `${TONE_LABEL[site.tone]} phase (named in the source label)`
    : "The source label does not name an early, middle or late phase (drawn in the mid tone)";

  const copy = el("button", { type: "button", class: "btn btn--ghost btn--small" }, "Copy");
  const coords = `${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}`;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(coords);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 1500);
    } catch {
      copy.textContent = "Press Ctrl+C";
    }
  });

  const countryNote =
    site.cflag === "border" ? "Close to a national border. The country comes from the point's coordinates."
    : site.cflag === "coast" ? "Plotted slightly offshore. The country is the nearest land."
    : "";

  const others = (data.byPlace.get(`${site.lon.toFixed(3)},${site.lat.toFixed(3)}`) ?? []).filter((o) => o.id !== site.id);
  const otherList = others.length
    ? el("section", { class: "detail__block" },
        el("h3", {}, "Also recorded at this location"),
        el("ul", { class: "list list--tight" }, ...others.map((o) => {
          const b = el("button", { type: "button", class: "row" }, siteSwatch(o), el("span", { class: "row__text" }, el("span", { class: "row__name" }, o.name), el("span", { class: "row__meta" }, [periodText(o), o.culture].filter(Boolean).join(" · "))));
          b.addEventListener("click", () => h.onPick(o.id));
          return el("li", {}, b);
        })))
    : null;

  const osm = el("a", { href: `https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lon}#map=12/${site.lat}/${site.lon}`, target: "_blank", rel: "noopener noreferrer" }, "Open this position in OpenStreetMap");

  const parts: Child[] = [
    back,
    el("header", { class: "detail__head" }, siteSwatch(site, 34), el("div", {}, el("p", { class: "mono-label" }, def.label), el("h2", {}, site.name))),
    el("dl", { class: "facts" },
      fact("Period", site.label),
      fact("Phase", phase),
      fact("Culture", site.culture ?? "Not specified in the source"),
      fact("Country", site.country, countryNote ? el("small", {}, countryNote) : null),
      fact("Position", coords, copy),
    ),
    otherList,
    el("section", { class: "detail__block" },
      el("h3", {}, "Source"),
      el("p", {}, "Compiled from:"),
      el("ul", { class: "sources" }, ...data.meta.sources.map((s) => el("li", {}, s))),
      el("p", { class: "small" }, "The dataset does not record which volume or page a point comes from. Dataset layer: ", el("code", {}, site.layers.join(", "))),
    ),
    el("p", { class: "small" }, osm),
  ];
  container.replaceChildren(...parts.filter((c): c is Node | string => Boolean(c)));
}

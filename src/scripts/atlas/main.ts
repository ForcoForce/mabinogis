import { loadAtlasData, fold, type AtlasData, type Site } from "./data";
import { PERIODS, PERIOD_ORDER, BASEMAP_CREDITS, START_PERIOD, type PeriodKey } from "./config";
import { AtlasMap, type BaseMap } from "./map";
import { renderList, renderRoller, renderLegendShapes, renderDetail, el } from "./render";
import { initSheet } from "./sheet";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const NONE = "__none__";
const PAGE = 60;

type Period = PeriodKey | "all";
/** the rows of the period roller, top to bottom */
const ROLL: Period[] = ["all", ...PERIOD_ORDER];

interface State {
  period: Period;
  culture: string;
  country: string;
  query: string;
  base: BaseMap;
  selected: string | null;
  shown: number;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

async function start() {
  const count = $("count");
  count.textContent = "Loading the atlas…";

  let data: AtlasData;
  try {
    data = await loadAtlasData();
  } catch {
    count.textContent = "The atlas data could not be loaded. Please reload the page.";
    return;
  }
  if (!hasWebGL()) {
    count.textContent = "This map needs WebGL, which your browser or device has turned off.";
    return;
  }

  const state: State = { period: START_PERIOD, culture: "all", country: "all", query: "", base: "archive", selected: null, shown: PAGE };
  const collator = new Intl.Collator("hr", { sensitivity: "base" });
  const sorted = [...data.sites].sort((a, b) => collator.compare(a.name, b.name));

  // ---- map ------------------------------------------------------------------
  const atlasMap = new AtlasMap($("map"), $("basemap"), data.sites, { onSelect: (id) => select(id) });
  await atlasMap.whenReady();
  if (import.meta.env.DEV) (window as unknown as { __atlas: AtlasMap }).__atlas = atlasMap; // for testing only

  const panel = $("panel");
  // the closed shelf is as tall as the period roller needs, so the roller is always in view
  const peekHeight = () => {
    const scroller = $("panel-scroll");
    return $("roller").getBoundingClientRect().bottom - panel.getBoundingClientRect().top + scroller.scrollTop + 12;
  };
  const sheet = initSheet(panel, $("handle"), (px) => {
    atlasMap.bottomInset = px;
    document.documentElement.style.setProperty("--sheet-px", `${px}px`);
  }, peekHeight);
  const mobile = window.matchMedia("(max-width: 899px)");

  // ---- filtering --------------------------------------------------------------
  const matches = (s: Site): boolean =>
    (state.period === "all" || s.period === state.period) &&
    (state.culture === "all" || (state.culture === NONE ? s.culture === null : s.culture === state.culture)) &&
    (state.country === "all" || s.country === state.country) &&
    (!state.query || s.search.includes(state.query));

  const filtered = (): Site[] => sorted.filter(matches);

  const periodCounts: Record<string, number> = { all: data.sites.length };
  for (const s of data.sites) periodCounts[s.period] = (periodCounts[s.period] ?? 0) + 1;

  // ---- period roller -----------------------------------------------------------
  const rollerList = $("roller-list");
  const rollerWindow = $("roller-window");
  const rollerUp = $<HTMLButtonElement>("roller-up");
  const rollerDown = $<HTMLButtonElement>("roller-down");

  renderRoller(
    rollerList,
    ROLL.map((p) => ({ value: p, label: p === "all" ? "All periods" : PERIODS[p].label, count: periodCounts[p] ?? 0 })),
    (i) => setPeriodIndex(i),
  );

  function syncRoller() {
    const i = ROLL.indexOf(state.period);
    rollerList.style.setProperty("--i", String(i));
    rollerList.querySelectorAll<HTMLElement>(".roller__item").forEach((b, k) => {
      b.setAttribute("aria-selected", String(k === i));
      b.classList.toggle("roller__item--current", k === i);
    });
    rollerWindow.setAttribute("aria-activedescendant", `roller-opt-${i}`);
    rollerUp.disabled = i <= 0;
    rollerDown.disabled = i >= ROLL.length - 1;
  }

  /** Move the roller and apply the period straight away (no separate "select" step). */
  function setPeriodIndex(index: number) {
    const i = Math.max(0, Math.min(ROLL.length - 1, index));
    if (ROLL[i] === state.period) return;
    state.period = ROLL[i];
    state.culture = "all";
    state.shown = PAGE;
    rebuildCultures();
    syncRoller();
    apply(true);
  }
  const step = (delta: number) => setPeriodIndex(ROLL.indexOf(state.period) + delta);

  rollerUp.addEventListener("click", () => step(-1));
  rollerDown.addEventListener("click", () => step(1));

  // mouse wheel
  let wheelLocked = false;
  rollerWindow.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (wheelLocked || Math.abs(e.deltaY) < 4) return;
    wheelLocked = true;
    window.setTimeout(() => (wheelLocked = false), 170);
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // keyboard
  rollerWindow.addEventListener("keydown", (e) => {
    const moves: Record<string, () => void> = {
      ArrowUp: () => step(-1), ArrowDown: () => step(1),
      Home: () => setPeriodIndex(0), End: () => setPeriodIndex(ROLL.length - 1),
    };
    if (moves[e.key]) { e.preventDefault(); moves[e.key](); }
  });

  // touch and mouse drag
  let dragFrom = 0;
  let dragging = false;
  let dragged = false;
  rollerWindow.addEventListener("pointerdown", (e) => { dragging = true; dragged = false; dragFrom = e.clientY; });
  rollerWindow.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - dragFrom;
    if (Math.abs(dy) > 30) {
      dragged = true;
      step(dy < 0 ? 1 : -1);
      dragFrom = e.clientY;
    }
  });
  const endDrag = () => { dragging = false; };
  rollerWindow.addEventListener("pointerup", endDrag);
  rollerWindow.addEventListener("pointercancel", endDrag);
  rollerWindow.addEventListener("pointerleave", endDrag);
  // a drag must not count as a click on a row
  rollerWindow.addEventListener("click", (e) => {
    if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
  }, true);

  // ---- culture list for the current period -------------------------------------
  function rebuildCultures() {
    const select = $<HTMLSelectElement>("f-culture");
    const counts = new Map<string, number>();
    let none = 0;
    for (const s of data.sites) {
      if (state.period !== "all" && s.period !== state.period) continue;
      if (s.culture) counts.set(s.culture, (counts.get(s.culture) ?? 0) + 1);
      else none += 1;
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));
    const options = [
      el("option", { value: "all" }, "All cultures"),
      ...ordered.map(([c, n]) => el("option", { value: c }, `${c} (${n})`)),
    ];
    if (none) options.push(el("option", { value: NONE }, `Not specified (${none})`));
    select.replaceChildren(...options);
    select.value = state.culture;
  }

  function mapFilter() {
    const f: unknown[] = ["all"];
    if (state.period !== "all") f.push(["==", ["get", "period"], state.period]);
    if (state.culture !== "all") f.push(["==", ["get", "culture"], state.culture === NONE ? "" : state.culture]);
    if (state.country !== "all") f.push(["==", ["get", "country"], state.country]);
    return f;
  }

  function apply(fit = false) {
    const list = filtered();
    const f = mapFilter();
    if (state.query) f.push(["in", ["get", "id"], ["literal", list.map((s) => s.id)]]);
    atlasMap.setFilter(f.length > 1 ? (f as never) : null);

    $("count").textContent = `${list.length.toLocaleString("en")} of ${data.sites.length.toLocaleString("en")} sites`;
    renderList($("list"), list, state.shown, (id) => select(id), state.selected, (id) => atlasMap.setHover(id));
    const more = $("more");
    more.hidden = list.length <= state.shown;
    more.textContent = `Show more (${Math.min(PAGE, list.length - state.shown)} of ${list.length - state.shown} remaining)`;
    renderLegendShapes($("legend-shapes"), state.period, data.meta.cultureRanks);
    $("shapes-title").textContent = state.period === "all" ? "Culture shapes" : `Culture shapes: ${PERIODS[state.period].label}`;

    if (fit) {
      const unfiltered = state.period === "all" && state.culture === "all" && state.country === "all" && !state.query;
      if (unfiltered) atlasMap.resetView();
      else atlasMap.fitSites(list);
    }
  }

  function resetFilters() {
    state.period = "all"; state.culture = "all"; state.country = "all"; state.query = ""; state.shown = PAGE;
    $<HTMLInputElement>("q").value = "";
    $<HTMLSelectElement>("f-country").value = "all";
    rebuildCultures();
    syncRoller();
    apply(true);
  }

  // ---- views ------------------------------------------------------------------
  type View = "explore" | "detail" | "about";
  function showView(view: View) {
    $("view-explore").hidden = view !== "explore";
    $("view-detail").hidden = view !== "detail";
    $("view-about").hidden = view !== "about";
    $("panel-scroll").scrollTop = 0;
  }

  /** If a site is hidden by the current filters, clear the filters so it can be seen on the map. */
  function ensureVisible(site: Site) {
    if (matches(site)) return;
    state.period = "all"; state.culture = "all"; state.country = "all"; state.query = ""; state.shown = PAGE;
    $<HTMLInputElement>("q").value = "";
    $<HTMLSelectElement>("f-country").value = "all";
    rebuildCultures();
    syncRoller();
    apply(false);
  }

  function select(id: string, opts: { fly?: boolean } = {}) {
    const site = data.byId.get(id);
    if (!site) return;
    ensureVisible(site);
    state.selected = id;
    atlasMap.setSelected(id);
    renderDetail($("view-detail"), site, data, { onBack: closeDetail, onPick: (other) => select(other) });
    showView("detail");
    if (mobile.matches && sheet.get() === "peek") sheet.set("half");
    if (opts.fly !== false) atlasMap.flyToSite(site);
    history.replaceState(null, "", `#site=${encodeURIComponent(id)}`);
    document.title = `${site.name} · Atlas Pannoniae Praehistoricae`;
  }

  function closeDetail() {
    state.selected = null;
    atlasMap.setSelected(null);
    showView("explore");
    history.replaceState(null, "", location.pathname + location.search);
    document.title = "Atlas Pannoniae Praehistoricae";
    apply(false);
  }

  // ---- controls -----------------------------------------------------------------
  $("open-about").addEventListener("click", () => {
    showView("about");
    if (mobile.matches) sheet.set("full");
  });
  $("about-back").addEventListener("click", () => (state.selected ? showView("detail") : showView("explore")));

  let timer: number | undefined;
  $<HTMLInputElement>("q").addEventListener("input", (e) => {
    window.clearTimeout(timer);
    const value = (e.target as HTMLInputElement).value;
    timer = window.setTimeout(() => {
      state.query = fold(value.trim());
      state.shown = PAGE;
      // a search looks at the whole atlas, so the roller goes back to "All periods"
      if (state.query && state.period !== "all") {
        state.period = "all";
        state.culture = "all";
        rebuildCultures();
        syncRoller();
      }
      apply(state.query.length > 0);
    }, 140);
  });
  $<HTMLInputElement>("q").addEventListener("focus", () => { if (mobile.matches && sheet.get() !== "full") sheet.set("full"); });

  $<HTMLSelectElement>("f-culture").addEventListener("change", (e) => {
    state.culture = (e.target as HTMLSelectElement).value; state.shown = PAGE; apply(true);
  });
  $<HTMLSelectElement>("f-country").addEventListener("change", (e) => {
    state.country = (e.target as HTMLSelectElement).value; state.shown = PAGE; apply(true);
  });
  $<HTMLSelectElement>("f-base").addEventListener("change", (e) => {
    state.base = (e.target as HTMLSelectElement).value as BaseMap;
    atlasMap.setBase(state.base);
    renderAttribution();
  });
  $("reset").addEventListener("click", resetFilters);
  $("more").addEventListener("click", () => { state.shown += PAGE; apply(false); });

  $<HTMLSelectElement>("f-country").append(
    ...data.meta.countries.map((c) => el("option", { value: c.name }, `${c.name} (${c.sites})`)),
  );

  // ---- legend -------------------------------------------------------------------
  const legend = $("legend");
  const legendBody = $("legend-body");
  const legendToggle = $("legend-toggle");
  function setLegend(open: boolean) {
    legendBody.hidden = !open;
    legendToggle.setAttribute("aria-expanded", String(open));
    legend.dataset.open = String(open);
  }
  legendToggle.addEventListener("click", () => setLegend(legendBody.hidden));
  setLegend(!mobile.matches);

  // ---- attribution (always visible in the bottom-right corner of the map) ------
  function renderAttribution() {
    const box = $("attrib");
    box.replaceChildren();
    BASEMAP_CREDITS[state.base].forEach((c, i) => {
      if (i) box.append(" · ");
      box.append(el("a", { href: c.href, target: "_blank", rel: "noopener noreferrer" }, c.text));
    });
    box.append(" · ", el("a", { href: "https://maplibre.org", target: "_blank", rel: "noopener noreferrer" }, "MapLibre"));
  }

  // ---- keyboard -------------------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("view-detail").hidden) closeDetail();
  });

  // ---- start ----------------------------------------------------------------------
  rebuildCultures();
  syncRoller();
  renderAttribution();
  apply(false);

  const wanted = new URLSearchParams(location.hash.slice(1)).get("site");
  if (wanted && data.byId.has(wanted)) select(wanted);
}

start();

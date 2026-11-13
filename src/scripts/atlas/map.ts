import * as maplibregl from "maplibre-gl";
// MapLibre 6 keeps its web worker in a separate file; the bundler must publish it and we point MapLibre at it.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Site } from "./data";
import { PERIODS, REGION_BOUNDS, MAX_BOUNDS, MIN_ZOOM, MAX_ZOOM, HOVER_SCALE, type ShapeName } from "./config";
import { shapeImageData } from "./symbols";

export type BaseMap = "archive" | "satellite";

export interface MapHandlers {
  onSelect: (id: string) => void;
}

const IMG_PX = 48;           // pixels drawn per marker image
const IMG_LOGICAL = 16;      // logical size of one image; icon-size scales from this
const SHAPE_FILL = 0.42 / 0.36; // markers are drawn smaller inside their image (room for the shadow); this evens it out

/**
 * The look of the "archive" basemap. Every value can be tuned here.
 * The OpenStreetMap tiles are turned to grey, then a warm cream wash tints them like aged paper.
 */
export const LOOK = {
  paper: "#e0c792",                                  // colour behind the tiles
  osm: { saturation: -0.5, contrast: 0.15, brightnessMin: 0.05, brightnessMax: 0.85, opacity: 1 }, // -1 = fully grey; try -0.9 to keep a hint of colour
  wash: { color: "#e5d5a9", opacity: 0.25 },         // cream-yellow tint over the map; raise the opacity for a more uniform paper look
  relief: { opacity: 0.75 },                          // Esri hillshade
};

const iconName = (shape: ShapeName, color: string) => `${shape}|${color}`;

/** Marker size: grows a little as you zoom in, times `k` (used for the hover growth). */
function sizeExpression(k: number): maplibregl.DataDrivenPropertyValueSpecification<number> {
  const size = (zoomFactor: number) => ["*", ["get", "size"], zoomFactor * k];
  return ["interpolate", ["linear"], ["zoom"], 5, size(0.85), 8, size(1), 12, size(1.45)] as never;
}

export class AtlasMap {
  readonly map: maplibregl.Map;
  private hover: maplibregl.Popup;
  private sitesById = new Map<string, Site>();
  private ready: Promise<void>;
  /** extra space at the bottom covered by the mobile sheet, in px */
  bottomInset = 0;
  private hoverId: string | null = null;
  private hoverK = 1;
  private hoverFrame = 0;

  constructor(container: HTMLElement, sites: Site[], private handlers: MapHandlers) {
    sites.forEach((s) => this.sitesById.set(s.id, s));
    maplibregl.setWorkerUrl(workerUrl);

    this.map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19 },
          relief: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 13 },
          imagery: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18 },
          places: { type: "raster", tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18 },
          wash: {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[-179.9, -85], [179.9, -85], [179.9, 85], [-179.9, 85], [-179.9, -85]]] } },
          },
        },
        layers: [
          { id: "paper", type: "background", paint: { "background-color": LOOK.paper } },
          { id: "imagery", type: "raster", source: "imagery", paint: { "raster-opacity": 0 } },
          { id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": LOOK.osm.saturation, "raster-contrast": LOOK.osm.contrast, "raster-brightness-min": LOOK.osm.brightnessMin, "raster-brightness-max": LOOK.osm.brightnessMax, "raster-opacity": LOOK.osm.opacity } },
          { id: "relief", type: "raster", source: "relief", paint: { "raster-opacity": LOOK.relief.opacity } },
          { id: "wash", type: "fill", source: "wash", paint: { "fill-color": LOOK.wash.color, "fill-opacity": LOOK.wash.opacity } },
          { id: "places", type: "raster", source: "places", paint: { "raster-opacity": 0 } },
        ],
      },
      bounds: REGION_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    this.map.touchZoomRotate.disableRotation();
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    this.map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    this.hover = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "atlas-hover" });

    this.ready = new Promise((resolve) => {
      this.map.on("load", () => {
        this.addSites(sites);
        this.bindEvents();
        resolve();
      });
    });
  }

  whenReady() {
    return this.ready;
  }

  /** Register one image per (shape, colour) pair that actually occurs, then add the layers. */
  private addSites(sites: Site[]) {
    const wanted = new Set<string>();
    const features = sites.map((s) => {
      const def = PERIODS[s.period];
      const color = def.colors[s.tone];
      const icon = iconName(s.shape, color);
      wanted.add(icon);
      return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
        properties: {
          id: s.id, icon, z: def.z, size: (def.size / IMG_LOGICAL) * SHAPE_FILL,
          period: s.period, culture: s.culture ?? "", country: s.country,
        },
      };
    });

    for (const icon of wanted) {
      const [shape, color] = icon.split("|") as [ShapeName, string];
      this.map.addImage(icon, shapeImageData(shape, color, IMG_PX), { pixelRatio: IMG_PX / IMG_LOGICAL });
    }

    this.map.addSource("sites", { type: "geojson", data: { type: "FeatureCollection", features } });

    this.map.addLayer({
      id: "sites",
      type: "symbol",
      source: "sites",
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": sizeExpression(1),
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        // earlier periods first, so later periods are drawn on top of them
        "symbol-sort-key": ["get", "z"],
      },
    });
    // the marker under the pointer is drawn again on top, and grows
    this.map.addLayer({
      id: "hover",
      type: "symbol",
      source: "sites",
      filter: ["==", ["get", "id"], ""],
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": sizeExpression(1),
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
    this.map.addLayer({
      id: "selected",
      type: "circle",
      source: "sites",
      filter: ["==", ["get", "id"], ""],
      paint: { "circle-radius": 14, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#bf4c2c", "circle-stroke-width": 2.5 },
    });
  }

  private pick(point: maplibregl.Point): Site | null {
    const pad = 10;
    const hits = this.map.queryRenderedFeatures(
      [[point.x - pad, point.y - pad], [point.x + pad, point.y + pad]] as [maplibregl.PointLike, maplibregl.PointLike],
      { layers: ["sites"] },
    );
    let best: Site | null = null;
    let bestScore = Infinity;
    for (const h of hits) {
      const site = this.sitesById.get(String(h.properties?.id));
      if (!site) continue;
      const p = this.map.project([site.lon, site.lat]);
      const dist = Math.hypot(p.x - point.x, p.y - point.y);
      // nearest wins; on a tie the later period (drawn on top) wins
      const score = dist - PERIODS[site.period].z * 0.01;
      if (score < bestScore) { best = site; bestScore = score; }
    }
    return best;
  }

  private bindEvents() {
    const canvas = this.map.getCanvas();
    this.map.on("click", (e) => {
      const site = this.pick(e.point);
      if (site) this.handlers.onSelect(site.id);
    });
    this.map.on("mousemove", (e) => {
      const site = this.pick(e.point);
      canvas.style.cursor = site ? "pointer" : "";
      this.setHover(site ? site.id : null);
      if (site) {
        const box = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = site.name;
        const small = document.createElement("span");
        small.textContent = ` · ${PERIODS[site.period].label}`;
        box.append(strong, small);
        this.hover.setLngLat([site.lon, site.lat]).setDOMContent(box).addTo(this.map);
      } else {
        this.hover.remove();
      }
    });
    const leave = () => {
      this.hover.remove();
      this.setHover(null);
      canvas.style.cursor = "";
    };
    this.map.on("mouseout", leave);
    canvas.addEventListener("mouseleave", leave);
  }

  /** Grow the marker of this site (or shrink it back when `id` is null). */
  setHover(id: string | null) {
    if (!this.map.getLayer("hover") || id === this.hoverId) return;
    this.hoverId = id;
    if (id) {
      this.map.setFilter("hover", ["==", ["get", "id"], id]);
      this.hoverK = 1;
    }
    this.animateHover();
  }

  /** Grow or shrink the hovered marker over about 140 ms, whatever the frame rate. */
  private animateHover() {
    cancelAnimationFrame(this.hoverFrame);
    const from = this.hoverK;
    const to = this.hoverId ? HOVER_SCALE : 1;
    const start = performance.now();
    const duration = 140;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.hoverK = from + (to - from) * eased;
      this.map.setLayoutProperty("hover", "icon-size", sizeExpression(this.hoverK));
      if (t < 1) this.hoverFrame = requestAnimationFrame(step);
      else if (!this.hoverId) this.map.setFilter("hover", ["==", ["get", "id"], ""]);
    };
    this.hoverFrame = requestAnimationFrame(step);
  }

  /** `filter` is a MapLibre filter expression, or null to show every site. */
  setFilter(filter: maplibregl.FilterSpecification | null) {
    if (this.map.getLayer("sites")) this.map.setFilter("sites", filter);
  }

  setSelected(id: string | null) {
    if (this.map.getLayer("selected")) this.map.setFilter("selected", ["==", ["get", "id"], id ?? ""]);
  }

  flyToSite(site: Site) {
    this.hover.remove();
    this.map.easeTo({
      center: [site.lon, site.lat],
      zoom: Math.max(this.map.getZoom(), 9),
      duration: 700,
      padding: { top: 0, left: 0, right: 0, bottom: this.bottomInset },
    });
  }

  fitSites(sites: Site[]) {
    if (sites.length === 0) return;
    if (sites.length === 1) return this.flyToSite(sites[0]);
    const b = new maplibregl.LngLatBounds();
    sites.forEach((s) => b.extend([s.lon, s.lat]));
    this.map.fitBounds(b, { padding: { top: 56, left: 56, right: 56, bottom: 56 + this.bottomInset }, maxZoom: 10, duration: 700 });
  }

  resetView() {
    this.map.fitBounds(REGION_BOUNDS, { padding: { top: 24, left: 24, right: 24, bottom: 24 + this.bottomInset }, duration: 700 });
  }

  setBase(mode: BaseMap) {
    const m = this.map;
    const sat = mode === "satellite";
    m.setPaintProperty("imagery", "raster-opacity", sat ? 1 : 0);
    m.setPaintProperty("places", "raster-opacity", sat ? 0.9 : 0);
    m.setPaintProperty("osm", "raster-opacity", sat ? 0 : LOOK.osm.opacity);
    m.setPaintProperty("relief", "raster-opacity", sat ? 0 : LOOK.relief.opacity);
    m.setPaintProperty("wash", "fill-opacity", sat ? 0 : LOOK.wash.opacity);
  }

  resize() {
    this.map.resize();
  }
}

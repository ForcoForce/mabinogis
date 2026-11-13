// Draws the twelve culture marker shapes on a canvas.
// The same drawing is used for the map markers, the legend and the list.
import type { ShapeName } from "./config";

const TAU = Math.PI * 2;

function polygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * TAU) / sides;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export interface DrawOptions {
  /** a very soft drop shadow (used for the markers on the map, not for legend or list swatches) */
  shadow?: boolean;
}

/** Draw one shape, filled and without an outline, on a square canvas of `px` pixels. */
export function drawShape(ctx: CanvasRenderingContext2D, shape: ShapeName, fill: string, px: number, opts: DrawOptions = {}): void {
  const c = px / 2;
  // shadowed markers are a little smaller so the shadow is not cut off at the edge of the image
  const R = px * (opts.shadow ? 0.36 : 0.42);
  ctx.save();
  ctx.fillStyle = fill;
  if (opts.shadow) {
    ctx.shadowColor = "rgba(39, 32, 26, 0.34)";
    ctx.shadowBlur = px * 0.07;
    ctx.shadowOffsetY = px * 0.035;
  }
  let rule: CanvasFillRule = "nonzero";

  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(c, c, R, 0, TAU);
      break;
    case "square": {
      const s = R * 1.6;
      ctx.beginPath();
      ctx.rect(c - s / 2, c - s / 2, s, s);
      break;
    }
    case "triangle":
      polygon(ctx, c, c + R * 0.14, R * 1.15, 3);
      break;
    case "diamond":
      polygon(ctx, c, c, R * 1.18, 4);
      break;
    case "star": {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? R * 1.18 : R * 0.5;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = c + r * Math.cos(a);
        const y = c + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case "semicircle":
      ctx.beginPath();
      ctx.arc(c, c + R * 0.38, R * 1.08, Math.PI, 0);
      ctx.closePath();
      break;
    case "pentagon":
      polygon(ctx, c, c + R * 0.06, R * 1.12, 5);
      break;
    case "hexagon":
      polygon(ctx, c, c, R * 1.08, 6, 0);
      break;
    case "cross": {
      const t = R * 0.5;
      const L = R * 1.15;
      ctx.beginPath();
      ctx.moveTo(c - t, c - L); ctx.lineTo(c + t, c - L); ctx.lineTo(c + t, c - t);
      ctx.lineTo(c + L, c - t); ctx.lineTo(c + L, c + t); ctx.lineTo(c + t, c + t);
      ctx.lineTo(c + t, c + L); ctx.lineTo(c - t, c + L); ctx.lineTo(c - t, c + t);
      ctx.lineTo(c - L, c + t); ctx.lineTo(c - L, c - t); ctx.lineTo(c - t, c - t);
      ctx.closePath();
      break;
    }
    case "ring":
      ctx.beginPath();
      ctx.arc(c, c, R * 1.05, 0, TAU);
      ctx.moveTo(c + R * 0.5, c);
      ctx.arc(c, c, R * 0.5, 0, TAU, true);
      rule = "evenodd";
      break;
    case "octagon":
      polygon(ctx, c, c, R * 1.1, 8, Math.PI / 8);
      break;
    case "crescent": {
      const d = R * 0.55;
      const r = R * 0.88;
      const x0 = (d * d + R * R - r * r) / (2 * d);
      const y0 = Math.sqrt(Math.max(0, R * R - x0 * x0));
      ctx.beginPath();
      ctx.arc(c, c, R, Math.atan2(-y0, x0), Math.atan2(y0, x0), true);
      ctx.arc(c + d, c, r, Math.atan2(y0, x0 - d), Math.atan2(-y0, x0 - d), false);
      ctx.closePath();
      break;
    }
  }
  ctx.fill(rule);
  ctx.restore();
}

/** Pixel data for MapLibre's addImage (draw at `px`, register with pixelRatio px / 16). */
export function shapeImageData(shape: ShapeName, fill: string, px = 48): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  drawShape(ctx, shape, fill, px, { shadow: true });
  return ctx.getImageData(0, 0, px, px);
}

const urlCache = new Map<string, string>();

/** A small PNG data URL for legend and list swatches. */
export function shapeDataUrl(shape: ShapeName, fill: string, px = 28): string {
  const key = `${shape}|${fill}|${px}`;
  let url = urlCache.get(key);
  if (!url) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px * 2;
    drawShape(canvas.getContext("2d")!, shape, fill, px * 2);
    url = canvas.toDataURL("image/png");
    urlCache.set(key, url);
  }
  return url;
}

// Mobile bottom sheet: three heights, a drag handle, and a tap to step through them.
// On desktop the panel is a normal left column and this does nothing.

export type SheetState = "peek" | "half" | "full";
const ORDER: SheetState[] = ["peek", "half", "full"];
// share of the screen height: the closed sheet keeps 15% of the screen on view
const SHARE: Record<SheetState, number> = { peek: 0.15, half: 0.52, full: 0.88 };

export function initSheet(panel: HTMLElement, handle: HTMLElement, onChange: (px: number) => void) {
  const mobile = window.matchMedia("(max-width: 899px)");
  let state: SheetState = "peek";
  let startY = 0;
  let startH = 0;
  let dragging = false;
  let moved = false;
  let swallowClick = false;

  const heightFor = (s: SheetState) => Math.round(window.innerHeight * SHARE[s]);

  const apply = (s: SheetState) => {
    state = s;
    panel.dataset.state = s;
    panel.style.removeProperty("--sheet-h");
    handle.setAttribute("aria-expanded", String(s !== "peek"));
    onChange(mobile.matches ? heightFor(s) : 0);
  };

  handle.addEventListener("pointerdown", (e) => {
    if (!mobile.matches) return;
    dragging = true;
    moved = false;
    startY = e.clientY;
    startH = panel.getBoundingClientRect().height;
    panel.classList.add("panel--dragging");
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = startY - e.clientY;
    if (Math.abs(dy) > 4) moved = true;
    const h = Math.min(window.innerHeight * 0.92, Math.max(window.innerHeight * 0.12, startH + dy));
    panel.style.setProperty("--sheet-h", `${h}px`);
  });
  const next = () => apply(ORDER[(ORDER.indexOf(state) + 1) % ORDER.length]);
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("panel--dragging");
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    if (!moved) return; // a plain tap is handled by the click event below
    swallowClick = true;
    setTimeout(() => (swallowClick = false), 0);
    const h = panel.getBoundingClientRect().height;
    const nearest = ORDER.reduce((a, b) => (Math.abs(heightFor(b) - h) < Math.abs(heightFor(a) - h) ? b : a));
    apply(nearest);
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
  // click covers taps, the keyboard (Enter/Space) and screen readers
  handle.addEventListener("click", () => {
    if (swallowClick) return;
    next();
  });

  window.addEventListener("resize", () => onChange(mobile.matches ? heightFor(state) : 0));
  apply("peek");
  return { set: apply, get: () => state };
}

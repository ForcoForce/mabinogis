// Mobile bottom sheet: three heights, a drag handle, and a tap to step through them.
// The closed ("peek") height is measured so the whole period roller is always visible.
// On desktop the panel is a normal left column and this does nothing.

export type SheetState = "peek" | "half" | "full";
const ORDER: SheetState[] = ["peek", "half", "full"];
// share of the screen height for the open heights
const SHARE = { half: 0.6, full: 0.88 };

/**
 * `getPeek` returns the height (px) needed to show the roller.
 * `onChange` receives the current sheet height in px (0 on desktop).
 */
export function initSheet(panel: HTMLElement, handle: HTMLElement, onChange: (px: number) => void, getPeek: () => number) {
  const mobile = window.matchMedia("(max-width: 899px)");
  let state: SheetState = "peek";
  let startY = 0;
  let startH = 0;
  let dragging = false;
  let moved = false;
  let swallowClick = false;

  // never taller than 45% of the screen, so the map stays usable
  const peek = () => Math.min(Math.round(getPeek()), Math.round(window.innerHeight * 0.45));
  const heightFor = (s: SheetState) =>
    s === "peek" ? peek() : Math.max(Math.round(window.innerHeight * SHARE[s]), peek() + 140);

  const apply = (s: SheetState) => {
    state = s;
    panel.dataset.state = s;
    // the script is the single source for all three heights; the stylesheet just uses them
    panel.style.setProperty("--peek-h", `${peek()}px`);
    panel.style.setProperty("--half-h", `${heightFor("half")}px`);
    panel.style.setProperty("--full-h", `${heightFor("full")}px`);
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
    const h = Math.min(window.innerHeight * 0.92, Math.max(peek() * 0.8, startH + dy));
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

  // sizes can change when fonts load or the screen turns
  const refresh = () => apply(state);
  window.addEventListener("resize", refresh);
  document.fonts?.ready.then(refresh);
  apply("peek");
  return { set: apply, get: () => state };
}

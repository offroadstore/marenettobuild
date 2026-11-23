export type PlacementRect = { left: number; top: number; width: number; height: number };

/** Find the nearest free viewport position, never covering readable or interactive content. */
export function whatsappPlacement(
  preferred: PlacementRect,
  obstacles: PlacementRect[],
  viewport: { width: number; height: number },
): { left: number; top: number } | null {
  const maxLeft = viewport.width - preferred.width;
  const maxTop = viewport.height - preferred.height;
  if (maxLeft < 0 || maxTop < 0) return null;
  const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));
  const visible = obstacles.filter(r => r.width > 0 && r.height > 0 && r.left < viewport.width &&
    r.left + r.width > 0 && r.top < viewport.height && r.top + r.height > 0);
  const free = (left: number, top: number) => !visible.some(r =>
    left < r.left + r.width + 5 && left + preferred.width > r.left - 5 &&
    top < r.top + r.height + 5 && top + preferred.height > r.top - 5);
  const left = clamp(preferred.left, maxLeft);
  const top = clamp(preferred.top, maxTop);
  if (free(left, top)) return { left, top };
  // Edge candidates avoid a pixel-by-pixel scan on every scroll frame.
  // Preserve the normal 20px gutter, or a smaller margin explicitly chosen
  // by dragging. Search obstacle edges horizontally as well as vertically.
  const inset = Math.min(20, left, maxLeft - left);
  const xs = new Set([left, inset, maxLeft - inset]);
  const ys = new Set([top, 0, maxTop]);
  for (const r of visible) {
    for (const x of [r.left - preferred.width - 5, r.left + r.width + 5]) {
      if (x >= inset && x <= maxLeft - inset) xs.add(x);
    }
    for (const y of [r.top - preferred.height - 5, r.top + r.height + 5]) {
      if (y >= 0 && y <= maxTop) ys.add(y);
    }
  }
  let best: { left: number; top: number } | null = null;
  let distance = Infinity;
  for (const x of xs) for (const y of ys) {
    const score = (x - left) ** 2 + (y - top) ** 2;
    if (score < distance && free(x, y)) {
      best = { left: x, top: y };
      distance = score;
    }
  }
  return best;
}

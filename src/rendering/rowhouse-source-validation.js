// Do not substitute a partial FBX fragment for a complete generated building.
// Conservative thresholds: a coherent rowhouse must contain multiple components
// and span at least one substantial above-ground storey in world units.
export function assessRowhouseSource(sourceMeshes, stats) {
  const height = Number(stats?.modelBounds?.size?.[1] ?? 0);
  const width = Number(stats?.modelBounds?.size?.[0] ?? 0);
  const reasons = [];
  if (!Number.isFinite(sourceMeshes) || sourceMeshes < 8) reasons.push('insufficient-component-count');
  if (!Number.isFinite(height) || height < 7) reasons.push('insufficient-building-height');
  if (!Number.isFinite(width) || width < 3) reasons.push('insufficient-building-width');
  return { usable: reasons.length === 0, reasons, sourceMeshes, width, height };
}

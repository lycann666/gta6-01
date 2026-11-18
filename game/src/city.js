// The city of Teluk Neon: a deterministic road grid, building blocks, parks,
// a harbor strip along the south edge, and collision helpers. All geometry is
// derived from the seed, so the same seed always builds the same city.
import { WORLD, PALETTE } from './config.js';
import { pick, range } from './random.js';

export const ROAD_W = 96;
export const GRID = 360; // distance between road centrelines
export const ROADS_X = [180, 540, 900, 1260, 1620, 1980, 2340, 2700, 3060];
export const ROADS_Y = [180, 540, 900, 1260, 1620, 1980];

export function createCity(random) {
  const buildings = [];
  const parks = [];
  const trees = [];
  // One building per block between roads (skip the harbor strip and a few parks).
  for (let ix = 0; ix < ROADS_X.length - 1; ix++) {
    for (let iy = 0; iy < ROADS_Y.length - 1; iy++) {
      const bx = ROADS_X[ix] + ROAD_W / 2 + 14;
      const by = ROADS_Y[iy] + ROAD_W / 2 + 14;
      const bw = GRID - ROAD_W - 28;
      const bh = GRID - ROAD_W - 28;
      if (by + bh > 2000) continue; // harbor strip stays open
      if (random() < 0.14) { parks.push({ x: bx, y: by, w: bw, h: bh }); continue; }
      const color = pick(random, PALETTE.building);
      const roof = pick(random, PALETTE.roof);
      buildings.push({ x: bx, y: by, w: bw, h: bh, color, roof, hgt: 14 + Math.floor(random() * 26),
        name: pick(random, ['Kantor', 'Ruko', 'Apartemen', 'Gudang', 'Hotel', 'Pasar', 'Kantor Pos', 'Bengkel']) });
      for (let t = 0; t < 3; t++) trees.push({ x: bx + range(random, 10, bw - 10), y: by + range(random, 10, bh - 10), r: 7 + random() * 5 });
    }
  }
  // Park trees
  for (const p of parks) for (let t = 0; t < 8; t++) trees.push({ x: p.x + range(random, 12, p.w - 12), y: p.y + range(random, 12, p.h - 12), r: 8 + random() * 6 });

  function onRoad(x, y) {
    for (const rx of ROADS_X) if (Math.abs(x - rx) < ROAD_W / 2) return true;
    for (const ry of ROADS_Y) if (Math.abs(y - ry) < ROAD_W / 2) return true;
    return y > 2000; // harbor strip is open ground
  }
  function nearestRoadPoint(x, y) {
    let best = null; let bd = Infinity;
    for (const rx of ROADS_X) { const d = Math.abs(x - rx); if (d < bd) { bd = d; best = { x: rx, y, vertical: true }; } }
    for (const ry of ROADS_Y) { const d = Math.abs(y - ry); if (d < bd) { bd = d; best = { x, y: ry, vertical: false }; } }
    return best;
  }
  // Push a circle out of every building it overlaps; returns true on a hit.
  function collideCircle(p, r) {
    let hit = false;
    for (const b of buildings) {
      const cx = Math.max(b.x, Math.min(p.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
      const dx = p.x - cx; const dy = p.y - cy; const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        hit = true;
        if (d2 > 0.01) { const d = Math.sqrt(d2); p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r; }
        else p.y = b.y - r; // centre inside: push out the top
      }
    }
    p.x = Math.max(20, Math.min(WORLD.width - 20, p.x));
    p.y = Math.max(20, Math.min(2240, p.y)); // the pier walkway ends at the water
    return hit;
  }
  // Circle vs building test without moving (for cars).
  function hitsBuilding(x, y, r) {
    for (const b of buildings) {
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
    }
    return false;
  }
  return { buildings, parks, trees, onRoad, nearestRoadPoint, collideCircle, hitsBuilding };
}

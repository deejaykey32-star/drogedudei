// Konwersja danych OpenStreetMap (okolice WORD Katowice, ul. Francuska 78) do lekkiego JSON dla symulatora.
// Wejście: tools/osm/raw.json (drogi + obszary, out geom), tools/osm/nodes.json (węzły ze znakami).
// Wyjście: www/data/katowice.json – współrzędne w metrach względem WORD (x na wschód, y na południe).
// Dane © OpenStreetMap contributors, licencja ODbL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(dir, '../../www/data/katowice.json');
const raw = JSON.parse(fs.readFileSync(path.join(dir, 'raw.json'), 'utf8'));
const nodes = JSON.parse(fs.readFileSync(path.join(dir, 'nodes.json'), 'utf8'));

const LAT0 = 50.2432241, LON0 = 19.0253455;
const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KY = 110540;
const r1 = (v) => Math.round(v * 10) / 10;
const proj = (lat, lon) => [r1((lon - LON0) * KX), r1(-(lat - LAT0) * KY)];

function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    // Zamknięty pierścień (pierwszy = ostatni punkt): odległość od punktu, inaczej każdy obszar zapada się do 2 punktów.
    const d = L ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / L : Math.hypot(px - ax, py - ay);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return simplify(pts.slice(0, idx + 1), eps).slice(0, -1).concat(simplify(pts.slice(idx), eps));
}

const WIDTH = { motorway: 11, trunk: 10, primary: 10, secondary: 9, tertiary: 8, unclassified: 6.5, residential: 6, living_street: 5, service: 4 };
const SPEED = { motorway: 140, motorway_link: 60, trunk: 70, trunk_link: 50, living_street: 20, service: 20 };

const roads = [], areas = [];
for (const e of raw.elements) {
  if (e.type !== 'way' || !e.geometry) continue;
  const t = e.tags || {};
  const pts = e.geometry.map((g) => proj(g.lat, g.lon));
  if (t.highway) {
    const base = t.highway.replace('_link', '');
    const near = pts.some(([x, y]) => Math.hypot(x, y) < 450);
    if (t.highway === 'service' && t.service === 'parking_aisle' && !near) continue;
    if (t.highway === 'service' && !near && t.service && t.service !== 'alley') continue;
    if (t.access === 'private' && !near) continue;
    let w = WIDTH[base] || 6;
    if (t.highway.endsWith('_link')) w = 5.5;
    if (t.lanes) w = Math.max(w * 0.6, Math.min(16, Number(t.lanes) * 3.3));
    const twoWay = !(t.oneway === 'yes' || t.junction === 'roundabout' || t.highway.startsWith('motorway'));
    if (twoWay && t.highway !== 'service') w = Math.max(5, w);
    const oneway = t.oneway === 'yes' || t.junction === 'roundabout' || t.highway === 'motorway' || t.highway === 'motorway_link';
    let ms = parseInt(t.maxspeed, 10);
    if (!ms) ms = SPEED[t.highway] || SPEED[base] || 50;
    roads.push({
      t: t.highway, n: t.name || '', w: Math.round(w * 10) / 10, ms, ow: oneway ? 1 : 0,
      rb: t.junction === 'roundabout' ? 1 : 0, br: t.bridge ? 1 : 0, tu: t.tunnel ? 1 : 0, l: Number(t.layer || 0),
      p: pts,
    });
  } else {
    let k = t.building ? 'b' : t.amenity === 'parking' ? 'p' : t.natural === 'water' ? 'w' : t.landuse === 'forest' ? 'f' : 'g';
    if (pts.length < 4) continue;
    const s = simplify(pts, k === 'b' ? 0.4 : 1.2);
    areas.push({ k, p: s });
  }
}

const feats = [];
for (const e of nodes.elements) {
  if (e.type !== 'node') continue;
  const t = e.tags || {};
  const kind = { traffic_signals: 'sig', stop: 'stop', give_way: 'give', crossing: 'cross' }[t.highway];
  if (!kind) continue;
  const [x, y] = proj(e.lat, e.lon);
  const f = { k: kind, x, y };
  if (kind === 'cross') f.c = t.crossing === 'traffic_signals' ? 'sig' : t.crossing === 'unmarked' ? 'u' : 'z';
  if (t.direction) f.d = t.direction;
  feats.push(f);
}

const data = {
  attribution: 'Dane mapy © OpenStreetMap contributors (ODbL)',
  origin: { lat: LAT0, lon: LON0, name: 'WORD Katowice, ul. Francuska 78' },
  roads, areas, feats,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data));
console.log(`roads ${roads.length}, areas ${areas.length}, feats ${feats.length}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);

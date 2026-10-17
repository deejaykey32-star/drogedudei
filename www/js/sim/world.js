// Świat symulatora: sieć dróg z OpenStreetMap (okolice WORD Katowice), graf, trasy, indeks przestrzenny.
// Układ: metry, x – wschód, y – południe, (0,0) = budynek WORD przy ul. Francuskiej 78.

const NO_ROUTE = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link']);
const CELL = 25;

export async function loadWorld() {
  const res = await fetch('data/katowice.json');
  const data = await res.json();
  return buildWorld(data);
}

export function buildWorld(data) {
  const roads = data.roads.map((r, i) => {
    const xs = r.p.map((p) => p[0]), ys = r.p.map((p) => p[1]);
    return { ...r, id: i, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
  // Siatka segmentów: szybkie „na jakiej drodze jestem” i „czy jestem na jezdni”.
  const grid = new Map();
  const segs = [];
  for (const r of roads) {
    for (let i = 0; i < r.p.length - 1; i++) {
      const a = r.p[i], b = r.p[i + 1];
      const s = { r, a, b, i };
      segs.push(s);
      const x0 = Math.floor(Math.min(a[0], b[0]) / CELL), x1 = Math.floor(Math.max(a[0], b[0]) / CELL);
      const y0 = Math.floor(Math.min(a[1], b[1]) / CELL), y1 = Math.floor(Math.max(a[1], b[1]) / CELL);
      for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
        const k = gx + ',' + gy;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(s);
      }
    }
  }
  // Graf skierowany (węzły = wspólne wierzchołki dróg).
  const nodes = new Map();
  const key = (p) => p[0] + ',' + p[1];
  const node = (p) => {
    const k = key(p);
    if (!nodes.has(k)) nodes.set(k, { k, x: p[0], y: p[1], out: [], deg: 0 });
    return nodes.get(k);
  };
  for (const r of roads) {
    const routable = !NO_ROUTE.has(r.t) && !(r.t === 'service' && Math.hypot(r.p[0][0], r.p[0][1]) > 160);
    for (let i = 0; i < r.p.length - 1; i++) {
      const A = node(r.p[i]), B = node(r.p[i + 1]);
      A.deg++; B.deg++;
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      if (len < 0.01) continue;
      const cost = len / Math.max(15, r.ms) * (r.t === 'service' ? 3 : r.t === 'living_street' ? 2 : 1);
      if (routable) {
        A.out.push({ to: B, len, cost, r });
        if (!r.ow) B.out.push({ to: A, len, cost, r });
      }
    }
  }
  const feats = data.feats.map((f) => ({ ...f, node: nodes.get(f.x + ',' + f.y) || null }));
  const featByNode = new Map(feats.filter((f) => f.node).map((f) => [f.node.k, f]));
  return { data, roads, segs, grid, nodes, feats, featByNode, areas: data.areas, attribution: data.attribution };
}

function segDist(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy || 1;
  let t = ((px - a[0]) * dx + (py - a[1]) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  const qx = a[0] + t * dx, qy = a[1] + t * dy;
  // znak: >0 = punkt po prawej stronie kierunku a→b (y w dół)
  const cross = dx * (py - a[1]) - dy * (px - a[0]);
  return { d: Math.hypot(px - qx, py - qy), t, qx, qy, side: Math.sign(cross), dir: Math.atan2(dy, dx) };
}

// Najbliższy segment jezdni (z pominięciem dróg na innym poziomie, gdy podano warstwę).
export function nearestRoad(W, x, y, maxD = 40, filter = null) {
  let best = null;
  const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    for (const s of W.grid.get(gx + i + ',' + (gy + j)) || []) {
      if (filter && !filter(s.r)) continue;
      const q = segDist(x, y, s.a, s.b);
      const edge = q.d - s.r.w / 2;
      if (q.d <= maxD && (!best || edge < best.edge)) best = { ...q, s, r: s.r, edge };
    }
  }
  return best;
}

export function nearestNode(W, x, y, pred = () => true) {
  let best = null, bd = Infinity;
  for (const n of W.nodes.values()) {
    if (!n.out.length || !pred(n)) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// Dijkstra po grafie skierowanym; indexPrev() trzeba wywołać raz po zbudowaniu świata.
export function indexPrev(W) {
  for (const n of W.nodes.values()) for (const e of n.out) e.fromNode = n;
}
export function routeFast(W, from, to, avoidFirst = null) {
  const dist = new Map([[from.k, 0]]), prev = new Map();
  const heap = [[0, from]];
  const seen = new Set();
  while (heap.length) {
    let bi = 0;
    for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i;
    const [d, n] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop();
    if (seen.has(n.k)) continue;
    seen.add(n.k);
    if (n === to) break;
    for (const e of n.out) {
      if (avoidFirst && n === from && e.to === avoidFirst) continue;
      const nd = d + e.cost;
      if (nd < (dist.get(e.to.k) ?? Infinity)) { dist.set(e.to.k, nd); prev.set(e.to.k, e); heap.push([nd, e.to]); }
    }
  }
  if (from === to) return [];
  if (!prev.has(to.k)) return null;
  const out = [];
  for (let k = to.k; k !== from.k;) { const e = prev.get(k); out.unshift(e); k = e.fromNode.k; }
  return out;
}

// Trasa jako polilinia z przesunięciem na prawy pas.
export function routePolyline(edges) {
  const pts = [];
  edges.forEach((e, i) => {
    const off = laneOffset(e.r);
    const ax = e.fromNode.x, ay = e.fromNode.y, bx = e.to.x, by = e.to.y;
    const L = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / L, ny = (bx - ax) / L; // normalna w prawo (y w dół): (-dy, dx)
    const p0 = { x: ax + nx * off, y: ay + ny * off, e, node: e.fromNode };
    const p1 = { x: bx + nx * off, y: by + ny * off, e, node: e.to };
    if (i === 0) pts.push(p0);
    else {
      const last = pts[pts.length - 1];
      last.x = (last.x + p0.x) / 2; last.y = (last.y + p0.y) / 2; // łagodzenie załamań
    }
    pts.push(p1);
  });
  let acc = 0;
  pts.forEach((p, i) => { if (i) acc += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); p.s = acc; });
  return pts;
}

export function laneOffset(r) {
  if (r.ow) return r.w >= 7 ? r.w / 4 : 0;
  return Math.max(1.2, r.w / 4);
}

// Rzut punktu na polilinię trasy (od indeksu startowego, w oknie).
export function projectOnPath(pts, x, y, from = 0, window = 60) {
  let best = null;
  const end = Math.min(pts.length - 1, from + window);
  for (let i = Math.max(0, from - 3); i < end; i++) {
    const a = pts[i], b = pts[i + 1];
    const q = segDist(x, y, [a.x, a.y], [b.x, b.y]);
    if (!best || q.d < best.d) best = { ...q, i, s: a.s + q.t * (b.s - a.s) };
  }
  return best;
}

export function pointAt(pts, s) {
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i + 1].s >= s) {
      const a = pts[i], b = pts[i + 1];
      const t = (s - a.s) / ((b.s - a.s) || 1);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dir: Math.atan2(b.y - a.y, b.x - a.x), i };
    }
  }
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  return { x: b.x, y: b.y, dir: Math.atan2(b.y - a.y, b.x - a.x), i: pts.length - 2 };
}

export const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

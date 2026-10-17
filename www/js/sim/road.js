// Etap 2: jazda w ruchu drogowym – prawdziwa sieć ulic wokół WORD Katowice (OSM).
import { nearestRoad, nearestNode, routeFast, indexPrev, routePolyline, projectOnPath, pointAt, angDiff, laneOffset } from './world.js';
import { obbHit, pointInOBB, toLocal } from './engine.js';
import { drawVehicle } from './vehicles.js';

const DEG = Math.PI / 180;
const CYCLE = 34;
const NPC_COLORS = ['#c0392b', '#2c3e50', '#7f8c8d', '#16a085', '#8e44ad', '#d35400', '#ecf0f1', '#2980b9', '#1b1b1b', '#f39c12'];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

export function lightState(off, heading, t) {
  const axis = Math.abs(Math.cos(heading)) > Math.abs(Math.sin(heading)) ? 1 : 0;
  const p = (((t + off + axis * CYCLE / 2) % CYCLE) + CYCLE) % CYCLE;
  return p < 13 ? 'g' : p < 16 ? 'y' : p < 31 ? 'r' : 'ry';
}

export function createRoad(sim, W, onDone) {
  if (!W._idx) { indexPrev(W); W._idx = true; W.edges = [...W.nodes.values()].flatMap((n) => n.out); }
  const cat = sim.cat, v = sim.v;
  const moto = v.kind === 'moto';
  const sigOffsets = new Map();
  const sigOff = (k) => sigOffsets.get(k) ?? (hash(k) % CYCLE);

  // --- trasa: WORD → ul. Ceglana → Rondo gen. Fieldorfa „Nila” → Rondo Policji Woj. Śl. → powrót do WORD ---
  const start = nearestNode(W, -40, 22);
  const ceg = W.roads.find((r) => r.n === 'Ceglana');
  const wps = [
    ceg ? nearestNode(W, ...ceg.p[Math.floor(ceg.p.length / 2)]) : null,
    nearestNode(W, -39, -471, (n) => n.out.some((e) => e.r.rb)),
    nearestNode(W, 125, -545, (n) => n.out.some((e) => e.r.rb)),
    start,
  ].filter(Boolean);
  let wpIdx = 0;

  function buildFrom(node, avoid) {
    const edges = [];
    let cur = node;
    for (let k = wpIdx; k < wps.length; k++) {
      const seg = routeFast(W, cur, wps[k], edges.length ? null : avoid);
      if (!seg) continue;
      edges.push(...seg);
      cur = wps[k];
    }
    return edges;
  }

  let R = {}; // trasa i wydarzenia
  function setRoute(edges) {
    const pts = routePolyline(edges);
    R = { edges, pts, total: pts[pts.length - 1].s, idx: 0, s: 0, maneuvers: [], signals: [], crossings: [], stops: [], limits: [] };
    // manewry (skręty na skrzyżowaniach, zjazdy z rond)
    let inRb = null;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], n = p.node;
      const eIn = pts[i].e, eOut = pts[i + 1].e;
      if (!inRb && eOut.r.rb && !eIn.r.rb) inRb = { s: p.s, exits: 0 };
      else if (inRb && eIn.r.rb && !eOut.r.rb) {
        R.maneuvers.push({ s: p.s, type: 'exit', n: inRb.exits + 1, entry: inRb.s, need: 'R' });
        inRb = null;
      } else if (inRb && n.deg >= 3 && n.out.some((e) => !e.r.rb)) inRb.exits++;
      else if (!inRb && n.deg >= 3 && !eIn.r.rb) {
        const a = pointAt(pts, Math.max(0, p.s - 14)), b = pointAt(pts, Math.min(R.total, p.s + 14));
        const d = angDiff(Math.atan2(b.y - p.y, b.x - p.x), Math.atan2(p.y - a.y, p.x - a.x));
        if (Math.abs(d) > 35 * DEG && !R.maneuvers.some((m) => Math.abs(m.s - p.s) < 15)) R.maneuvers.push({ s: p.s, type: 'turn', dir: d > 0 ? 'R' : 'L', need: d > 0 ? 'R' : 'L', street: eOut.r.n });
      }
      const f = W.featByNode.get(n.k);
      if (f) {
        const isSig = f.k === 'sig' || (f.k === 'cross' && f.c === 'sig');
        if (isSig) {
          const near = R.signals.find((q) => Math.abs(q.s - p.s) < 35);
          if (near) sigOffsets.set(n.k, near.off);
          else { const off = hash(n.k) % CYCLE; sigOffsets.set(n.k, off); R.signals.push({ s: p.s, stopS: p.s - (f.k === 'cross' ? 3 : 6), off, node: n, passed: false }); }
        } else if (f.k === 'cross' && !R.crossings.some((q) => Math.abs(q.s - p.s) < 12)) R.crossings.push({ s: p.s, x: n.x, y: n.y, w: eOut.r.w, spawned: false, peds: [] });
        else if (f.k === 'stop') R.stops.push({ s: p.s, stopS: p.s - 4, ok: false, done: false });
      }
    }
    R.maneuvers.sort((a, b) => a.s - b.s);
    R.maneuvers = R.maneuvers.filter((m, i, arr) => i === 0 || m.s - arr[i - 1].s >= 20);
    // ograniczenia prędkości (zmiana limitu wzdłuż trasy)
    let lastMs = null;
    pts.forEach((p) => { if (p.e.r.ms !== lastMs) { R.limits.push({ s: p.s, ms: p.e.r.ms }); lastMs = p.e.r.ms; } });
    R.said = new Set();
  }
  setRoute(buildFrom(start));

  // --- zadania egzaminacyjne w ruchu (strefy z geometrią bezwzględną) ---
  function findStraight(minLen, fromS, okRoad) {
    const pts = R.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      if (pts[i].s < fromS) continue;
      let j = i, ok = true;
      const d0 = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
      while (j < pts.length - 1 && pts[j].s - pts[i].s < minLen) {
        const d = Math.atan2(pts[j + 1].y - pts[j].y, pts[j + 1].x - pts[j].x);
        if (Math.abs(angDiff(d, d0)) > 7 * DEG || !okRoad(pts[j + 1].e.r) || (j > i && pts[j].node.deg >= 3)) { ok = false; break; }
        j++;
      }
      if (ok && pts[j].s - pts[i].s >= minLen) return { s: pts[i].s, r: pts[i + 1].e.r, dir: d0 };
    }
    return null;
  }
  const tasks = [];
  const taskDefs = [];
  if (cat === 'B' || cat === 'B1') taskDefs.push('koperta', 'prostopadle');
  else if (['C', 'C1'].includes(cat)) taskDefs.push('prostopadle');
  else if (cat.startsWith('D')) taskDefs.push('przystanek');
  taskDefs.push('hamowanie');
  let cursor = 160;
  const cityRoad = (r) => !r.ow && r.w >= 5 && ['residential', 'tertiary', 'unclassified', 'secondary'].includes(r.t);
  for (const kind of taskDefs) {
    const need = kind === 'hamowanie' ? 70 : kind === 'przystanek' ? 45 : 40;
    let st = findStraight(need, cursor, kind === 'hamowanie' ? (r) => !r.rb && r.w >= 5 : cityRoad);
    if (!st) st = findStraight(need, 60, (r) => !r.rb && r.w >= 5);
    if (!st) continue;
    cursor = st.s + need + 140;
    const r = st.r;
    const base = pointAt(R.pts, st.s);
    const dir = st.dir;
    const fx = Math.cos(dir), fy = Math.sin(dir), nx = -fy, ny = fx; // nx,ny – w prawo
    const laneOff = laneOffset(r);
    const axis = { x: base.x - nx * laneOff, y: base.y - ny * laneOff };
    const at = (along, lat) => ({ x: axis.x + fx * along + nx * lat, y: axis.y + fy * along + ny * lat });
    const t = { kind, tries: 0, status: 'todo', dir, at, r, along0: 0 };
    const curb = r.w / 2;
    if (kind === 'koperta') {
      const slot = v.len * 1.55;
      const pc = { len: 4.3, wid: 1.8 };
      t.n = 'Parkowanie równoległe (koperta)';
      t.zone = { a: 0, b: 10 + pc.len * 2 + slot + 6, lat0: curb, lat1: curb + 2.6 };
      const a1 = 12 + pc.len / 2;
      const free0 = 12 + pc.len + 0.3, free1 = free0 + slot;
      t.parked = [{ ...at(a1, curb + 1.3), h: dir, ...pc, color: '#7f8c8d' }, { ...at(free1 + 0.3 + pc.len / 2, curb + 1.3), h: dir, ...pc, color: '#34495e' }];
      t.target = { ...at((free0 + free1) / 2, curb + 1.3), h: dir, len: slot, wid: 2.6 };
      t.align = 0;
      t.say = 'Proszę zaparkować równolegle w zatoce po prawej stronie, między samochodami.';
    } else if (kind === 'prostopadle') {
      const bw = v.wid + 0.9, bd = v.len + 0.8;
      t.n = 'Parkowanie prostopadłe';
      t.zone = { a: 0, b: 10 + bw * 5 + 6, lat0: curb, lat1: curb + bd + 0.3 };
      t.bays = [0, 1, 2, 3, 4].map((k) => ({ ...at(10 + bw * (k + 0.5), curb + bd / 2 + 0.1), h: dir + Math.PI / 2, len: bd, wid: bw }));
      t.parked = t.bays.filter((_, k) => k !== 2 && k !== 4).map((b, k) => ({ x: b.x, y: b.y, h: b.h + (k % 2 ? Math.PI : 0), len: Math.min(4.4, bd - 0.8), wid: 1.8, color: NPC_COLORS[k + 2] }));
      t.target = { ...t.bays[2], len: bd + 0.2, wid: bw };
      t.align = 90;
      t.say = `Proszę zaparkować prostopadle${['C', 'C1'].includes(cat) ? ' tyłem' : ''} na wolnym miejscu po prawej stronie.`;
    } else if (kind === 'przystanek') {
      t.n = 'Zatrzymanie na przystanku';
      t.zone = { a: 0, b: 40, lat0: curb, lat1: curb + 3.2 };
      t.target = { ...at(22, curb + 1.6), h: dir, len: v.len + 4, wid: 3.4 };
      t.align = 0;
      t.say = 'Proszę zatrzymać się na przystanku autobusowym po prawej, otworzyć i zamknąć drzwi.';
    } else {
      t.n = 'Hamowanie do zatrzymania w wyznaczonym miejscu';
      t.zone = null;
      t.cone = at(50, curb + 0.4);
      t.coneAlong = 50;
      t.say = 'Proszę zatrzymać pojazd tak, aby przód był na wysokości pachołka po prawej stronie.';
    }
    tasks.push(t);
  }

  // --- ruch innych pojazdów i piesi ---
  const npcs = [];
  const peds = [];
  function spawnNPC() {
    const c = sim.body();
    for (let tries = 0; tries < 25; tries++) {
      const e = W.edges[Math.floor(Math.random() * W.edges.length)];
      if (e.r.t === 'service' || e.r.t === 'living_street') continue;
      const mx = (e.fromNode.x + e.to.x) / 2, my = (e.fromNode.y + e.to.y) / 2;
      const d = Math.hypot(mx - c.x, my - c.y);
      if (d < 70 || d > 260) continue;
      const kinds = [['car', 4.3, 1.8], ['car', 4.6, 1.85], ['car', 4.0, 1.75], ['van', 5.2, 2.0], ['bus', 12, 2.55], ['truck', 9, 2.5]];
      const kd = Math.random() < 0.85 ? kinds[Math.floor(Math.random() * 4)] : kinds[4 + Math.floor(Math.random() * 2)];
      const n = { e, t: Math.random() * e.len, v: 6, kind: kd[0], len: kd[1], wid: kd[2], color: kd[0] === 'bus' ? '#1f5fbf' : NPC_COLORS[Math.floor(Math.random() * NPC_COLORS.length)] };
      const np = npcPose(n);
      if (Math.hypot(np.x - c.x, np.y - c.y) < 60) continue;
      if (npcs.some((o) => { const q = npcPose(o); return Math.hypot(q.x - np.x, q.y - np.y) < 12; })) continue;
      npcs.push(n);
      return;
    }
  }
  function npcPose(n) {
    const a = n.e.fromNode, b = n.e.to, L = n.e.len || 1;
    const fx = (b.x - a.x) / L, fy = (b.y - a.y) / L, off = laneOffset(n.e.r);
    return { x: a.x + fx * n.t - fy * off, y: a.y + fy * n.t + fx * off, h: Math.atan2(fy, fx), len: n.len, wid: n.wid };
  }

  // --- stan ---
  const S = { overT: 0, leftT: 0, offT: 0, lastMs: 50, instr: '', finished: false, faultsMinor: {} };
  sim.slope = null;
  // start: na drodze wewnętrznej WORD
  {
    const p0 = R.pts[0], p1 = R.pts[Math.min(3, R.pts.length - 1)];
    const h = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    sim.setPose(p0.x + Math.cos(h) * v.len / 2, p0.y + Math.sin(h) * v.len / 2, h);
  }
  sim.msg('🎙️ Egzaminator: Proszę wyjechać z ośrodka. Będę podawał kierunki jazdy.', '', true);

  function minor(key, msg) {
    sim.fault(msg, false);
    S.faultsMinor[key] = (S.faultsMinor[key] || 0) + 1;
    if (S.faultsMinor[key] >= 3) sim.fault(`Powtarzający się błąd: ${msg}`, true);
  }

  function instruct(text) { S.instr = text; sim.msg('🎙️ ' + text, '', true); }

  function reroute() {
    const c = sim.body();
    const [hx, hy] = [Math.cos(c.h), Math.sin(c.h)];
    const n = nearestNode(W, c.x + hx * 15, c.y + hy * 15, (q) => ((q.x - c.x) * hx + (q.y - c.y) * hy) > 0 && Math.hypot(q.x - c.x, q.y - c.y) < 70);
    if (!n) return;
    // pomiń osiągnięte punkty trasy
    while (wpIdx < wps.length - 1 && Math.hypot(wps[wpIdx].x - c.x, wps[wpIdx].y - c.y) < 40) wpIdx++;
    const edges = buildFrom(n);
    if (edges.length) { setRoute(edges); instruct('Zmieniamy trasę – proszę jechać dalej według moich poleceń.'); }
  }

  const stage = {
    bg: '#6f9a5c',
    W,
    tasks,
    summary: () => tasks.map((t) => ({ n: t.n, status: t.status, tries: t.tries })),
    hud(sim) {
      const c = sim.body();
      const nr = nearestRoad(W, c.x, c.y, 30);
      const sig = R.signals.find((q) => q.stopS > R.s - 2 && q.stopS - R.s < 80);
      const nextLim = R.limits.find((l) => l.s > R.s && l.s - R.s < 70 && l.ms < S.lastMs);
      return { stage: 'Jazda w ruchu – Katowice', street: nr?.r.n || '', limit: S.lastMs, nextLimit: nextLim ? `${nextLim.ms} za ${Math.round(nextLim.s - R.s)} m` : '', task: tasks.find((t) => t.status === 'active')?.n || '', instr: S.instr, light: sig ? lightState(sig.off, pointAt(R.pts, sig.stopS).dir, sim.time) : null, lightDist: sig ? Math.round(sig.stopS - R.s) : null, progress: Math.round((R.s / R.total) * 100) };
    },
    update(sim, dt) {
      if (sim.ended) return;
      const c = sim.car, b = sim.body(), f = sim.front();
      const kmh = Math.abs(c.v) * 3.6;
      // pozycja na trasie
      const pr = projectOnPath(R.pts, b.x, b.y, R.idx, 40);
      if (pr) { R.idx = pr.i; R.s = pr.s; }
      const fS = R.s + v.len / 2;
      const inZone = tasks.some((t) => t.zone && t.status !== 'ok' && zoneHas(t, b));
      if (pr && pr.d > 18 && !inZone) reroute();

      // polecenia egzaminatora
      for (const m of R.maneuvers) {
        const key = 'm' + Math.round(m.s);
        const lead = m.type === 'exit' ? m.s - m.entry + 60 : 60;
        if (!R.said.has(key) && R.s > m.s - lead && R.s < m.s - 5) {
          R.said.add(key);
          if (m.type === 'exit') instruct(`Na rondzie proszę zjechać ${['pierwszym', 'drugim', 'trzecim', 'czwartym', 'piątym'][Math.min(4, m.n - 1)]} zjazdem${m.n >= 4 ? ' (zawracamy)' : ''}.`);
          else instruct(`Na najbliższym skrzyżowaniu proszę skręcić w ${m.dir === 'R' ? 'prawo' : 'lewo'}${m.street ? ` (ul. ${m.street})` : ''}.`);
        }
        // kierunkowskaz
        const from = m.type === 'exit' ? Math.min(m.entry, m.s - 22) : m.s - 22;
        if (R.s > from && R.s < m.s + 1) { if (c.blink === m.need) m.blinkOk = true; }
        if (!m.checked && R.s > m.s + 3) { m.checked = true; if (!m.blinkOk) minor('blink', `Brak sygnalizowania zamiaru ${m.type === 'exit' ? 'zjazdu z ronda' : 'skrętu'} kierunkowskazem`); }
      }
      // sygnalizacja świetlna
      for (const sg of R.signals) {
        if (sg.passed) continue;
        if (fS >= sg.stopS && fS - sg.stopS < 6) {
          sg.passed = true;
          const stl = lightState(sg.off, pointAt(R.pts, sg.stopS).dir, sim.time);
          if (stl === 'r' || stl === 'ry') sim.fault('Wjazd za sygnalizator przy czerwonym świetle', true);
        } else if (fS > sg.stopS + 6) sg.passed = true;
      }
      // STOP
      for (const sp of R.stops) {
        if (sp.done) continue;
        if (fS > sp.stopS - 10 && fS < sp.stopS + 1 && kmh < 1) sp.ok = true;
        if (fS > sp.stopS + 2) { sp.done = true; if (!sp.ok) sim.fault('Niezatrzymanie się przed znakiem STOP', true); }
      }
      // przejścia dla pieszych
      for (const cr of R.crossings) {
        const d = cr.s - fS;
        if (!cr.spawned && d < 45 && d > 25) {
          cr.spawned = true;
          if (Math.random() < 0.6) {
            const p = pointAt(R.pts, cr.s);
            const nx = -Math.sin(p.dir), ny = Math.cos(p.dir);
            const lane = laneOffset(R.pts[p.i + 1].e.r);
            const ax = p.x - nx * lane, ay = p.y - ny * lane; // oś jezdni
            const side = Math.random() < 0.5 ? 1 : -1;
            const half = cr.w / 2 + 1.2;
            cr.peds.push({ x: ax + nx * half * side, y: ay + ny * half * side, vx: -nx * side * 1.35, vy: -ny * side * 1.35, ax, ay, nx, ny, half, side, wait: Math.random() * 1.2 });
            peds.push(cr.peds[0]);
            instruct('Uwaga – pieszy przy przejściu.');
            S.instr = '';
          }
        }
        if (!cr.checked && d < 0) {
          cr.checked = true;
          for (const p of cr.peds) { const lat = (p.x - p.ax) * p.nx + (p.y - p.ay) * p.ny; if (Math.abs(lat) < cr.w / 2 + 0.3) sim.fault('Nieustąpienie pierwszeństwa pieszemu na przejściu', true); }
        }
      }
      for (const p of peds) {
        if (p.wait > 0) { p.wait -= dt; continue; }
        const lat = (p.x - p.ax) * p.nx + (p.y - p.ay) * p.ny;
        if (lat * p.side > -p.half) { p.x += p.vx * dt; p.y += p.vy * dt; }
        if (pointInOBB(p, b, 0.3)) sim.fault('Potrącenie pieszego', true);
      }
      // prędkość
      const seg = R.pts[Math.min(R.idx + 1, R.pts.length - 1)].e.r;
      if (seg.ms !== S.lastMs) { S.limitT = sim.time; S.lastMs = seg.ms; }
      if (kmh > S.lastMs + 20 && sim.time - (S.limitT || 0) > 2.5) sim.fault(`Przekroczenie prędkości o ponad 20 km/h (${Math.round(kmh)} przy ${S.lastMs})`, true);
      if (kmh > S.lastMs + 3) { S.overT += dt; if (S.overT > 2.5) { S.overT = -8; minor('speed', `Przekroczenie dopuszczalnej prędkości (${S.lastMs} km/h)`); } } else if (S.overT > 0) S.overT = 0; else S.overT = Math.min(0, S.overT + dt);
      // jezdnia, pas, kierunek
      const layer = seg.l || 0;
      const sameLevel = (r) => (r.l || 0) === layer && (seg.t.startsWith('motorway') || !r.t.startsWith('motorway'));
      const nr = nearestRoad(W, b.x, b.y, 40, sameLevel);
      const nearJunction = R.pts.some((p) => Math.abs(p.s - R.s) < 28 && p.node.deg >= 3);
      const nearRb = R.pts.some((p) => Math.abs(p.s - R.s) < 45 && p.e.r.rb);
      if (!inZone && !nearJunction && kmh > 3) {
        const tol = v.kind === 'truck' || v.kind === 'bus' || v.trailer ? 1.6 : 0.9;
        const outside = sim.corners().slice(0, 2).some((p) => { const q = nearestRoad(W, p.x, p.y, 40, sameLevel); return !q || q.edge > tol; });
        if (outside) { S.offT += dt; if (S.offT > 0.6) sim.fault('Wjazd poza jezdnię (chodnik / pobocze / krawężnik)', true); } else S.offT = 0;
      } else S.offT = 0;
      if (nr && kmh > 4) {
        const segDir = nr.dir;
        const opp = Math.abs(angDiff(b.h, segDir)) > 120 * DEG;
        if (nr.r.ow && opp && !nr.r.rb && !nearRb && !nearJunction && pr && pr.d > 3) sim.fault('Jazda pod prąd po drodze jednokierunkowej', true);
        if (!nr.r.ow && nr.r.w >= 5 && !inZone && !nearJunction && pr && pr.d < 8) {
          // przesunięcie względem toru prawego pasa (oś jezdni = tor − laneOffset)
          const laneOff = laneOffset(seg);
          const lateral = pr.side * pr.d + laneOff; // >0 = po prawej stronie osi jezdni
          const longV = v.len > 7 || v.trailer ? 0.6 : 0;
          if (lateral < -0.6 - longV) { S.leftT += dt; if (S.leftT > 2.5) { S.leftT = -6; minor('left', 'Jazda lewą stroną jezdni'); } } else if (S.leftT > 0) S.leftT = 0; else S.leftT = Math.min(0, S.leftT + dt);
        }
      }
      // zadania
      for (const t of tasks) taskUpdate(t, sim, dt, b);
      // NPC
      while (npcs.length < 12) spawnNPC();
      const poses = npcs.map((q) => ({ ...npcPose(q), n: q }));
      for (let i = npcs.length - 1; i >= 0; i--) {
        const n = npcs[i];
        const p = npcPose(n);
        if (Math.hypot(p.x - b.x, p.y - b.y) > 320) { npcs.splice(i, 1); continue; }
        let target = Math.min(n.e.r.ms, n.e.r.rb ? 25 : 50) / 3.6 * 0.85;
        const look = 5 + n.v * 1.6 + n.len / 2;
        // korytarz jazdy: prostokąty wzdłuż kierunku jazdy – czy coś na nim stoi?
        const R2 = (look + n.len + 14) ** 2;
        const others = [{ ...b, me: true }, ...poses.filter((o) => o.n !== n), ...peds.map((q) => ({ x: q.x, y: q.y, h: 0, len: 0.6, wid: 0.6 }))].filter((o) => (o.x - p.x) ** 2 + (o.y - p.y) ** 2 < R2);
        const ph = Math.cos(p.h), qh = Math.sin(p.h);
        outer: for (let d = n.len / 2 + 1.5; d < look + n.len / 2; d += 2) {
          const box = { x: p.x + ph * d, y: p.y + qh * d, h: p.h, len: 2.2, wid: n.wid + 0.5 };
          for (const o of others) {
            if (!o.len || (n.force > 0 && !o.me && o.len > 0.7)) continue;
            if (obbHit(box, o)) { target = d < n.len / 2 + 4 ? 0 : Math.min(target, Math.max(0, (d - n.len / 2 - 3) * 0.5)); break outer; }
          }
        }
        const fe = W.featByNode.get(n.e.to.k);
        if (fe && (fe.k === 'sig' || (fe.k === 'cross' && fe.c === 'sig'))) {
          const dleft = n.e.len - n.t;
          const ls = lightState(sigOff(n.e.to.k), p.h, sim.time);
          if (ls !== 'g' && dleft > 4 && dleft < 22) target = dleft < 9 ? 0 : Math.min(target, 3);
        }
        // cierpliwość: rozładowanie zatorów między NPC
        let redAhead = false;
        if (fe && (fe.k === 'sig' || (fe.k === 'cross' && fe.c === 'sig'))) redAhead = lightState(sigOff(n.e.to.k), p.h, sim.time) !== 'g' && n.e.len - n.t < 22;
        if (n.v < 0.2 && !redAhead) n.waitT = (n.waitT || 0) + dt; else n.waitT = 0;
        if (n.waitT > 6) { n.force = 3; n.waitT = 0; }
        if (n.force > 0) n.force -= dt;
        n.stuckT = n.v < 0.2 ? (n.stuckT || 0) + dt : 0;
        if (n.stuckT > 30 && Math.hypot(p.x - b.x, p.y - b.y) > 40) { npcs.splice(i, 1); continue; }
        n.v += Math.max(-6 * dt, Math.min(1.8 * dt, target - n.v));
        n.t += n.v * dt;
        while (n.t > n.e.len) {
          const opts = n.e.to.out.filter((e) => e.to !== n.e.fromNode && e.r.t !== 'service');
          if (!opts.length) { npcs.splice(i, 1); break; }
          n.t -= n.e.len;
          n.e = opts.find((e) => e.r === n.e.r) && Math.random() < 0.7 ? opts.find((e) => e.r === n.e.r) : opts[Math.floor(Math.random() * opts.length)];
        }
        if (npcs[i] === n && kmh > 3 && obbHit(npcPose(n), b)) {
          // wina zdającego: kontakt przodem (lub tyłem przy cofaniu) pojazdu
          const np = npcPose(n);
          const hitFront = sim.corners().slice(0, 2).some((q) => pointInOBB(q, np, 0.15)) || pointInOBB(sim.front(), np, 0.2);
          const hitRear = sim.corners().slice(2).some((q) => pointInOBB(q, np, 0.15));
          if ((c.v > 0 && hitFront) || (c.v < 0 && hitRear)) sim.fault('Kolizja z innym pojazdem', true);
        }
      }
      // koniec trasy
      if (R.s > R.total - 25 && wpIdx >= wps.length - 1 && kmh < 1 && !S.finished) {
        S.finished = true;
        const failed = tasks.some((t) => t.status === 'fail' || t.status === 'todo' || t.status === 'active');
        if (tasks.some((t) => t.status !== 'ok')) sim.fault('Nie wykonano wszystkich zadań egzaminacyjnych', true);
        else { sim.msg('✅ Egzaminator: Dziękuję, koniec egzaminu. Wynik pozytywny!', '', true); sim.end('pozytywny'); }
        void failed;
      }
      if (wpIdx < wps.length - 1 && Math.hypot(wps[wpIdx].x - b.x, wps[wpIdx].y - b.y) < 30) wpIdx++;
    },
    key(code) {
      if (code === 'KeyO') {
        if (Math.abs(sim.car.v) > 0.3) return sim.fault('Otwarcie drzwi podczas jazdy', true);
        sim.car.doors = !sim.car.doors;
        const t = tasks.find((q) => q.kind === 'przystanek' && q.status === 'active');
        if (t) { if (sim.car.doors) t.doorT = sim.time; else if (t.inside && sim.time - (t.doorT || 0) >= 3) done(t); }
      }
    },
    drawWorld(g, sim) { drawMap(g, sim, W, R, tasks, sigOff); },
    drawOver(g, sim) {
      for (const t of tasks) for (const p of t.parked || []) { g.save(); g.translate(p.x, p.y); g.rotate(p.h); drawVehicle(g, { len: p.len, wid: p.wid, kind: 'car', color: p.color }, null); g.restore(); }
      for (const n of npcs) { const p = npcPose(n); g.save(); g.translate(p.x, p.y); g.rotate(p.h); drawVehicle(g, { len: n.len, wid: n.wid, kind: n.kind === 'van' ? 'car' : n.kind, color: n.color }, { braking: n.v < 1 }); g.restore(); }
      for (const p of peds) { g.fillStyle = '#ff7675'; g.beginPath(); g.arc(p.x, p.y, 0.4, 0, 7); g.fill(); g.fillStyle = '#2d3436'; g.beginPath(); g.arc(p.x, p.y, 0.22, 0, 7); g.fill(); }
    },
    drawScreen(g, sim) { drawMinimap(g, sim, W, R); },
    objects() {
      return {
        cars: [...tasks.flatMap((t) => t.parked || []), ...npcs.map((n) => ({ ...npcPose(n), color: n.color, kind: n.kind, v: n.v }))],
        peds: peds.map((p) => ({ x: p.x, y: p.y })),
        cones: tasks.filter((t) => t.cone).map((t) => t.cone),
        lights: R.signals.map((sg) => { const p = pointAt(R.pts, sg.stopS); return { x: p.x + Math.cos(p.dir + Math.PI / 2) * 3.2, y: p.y + Math.sin(p.dir + Math.PI / 2) * 3.2, h: p.dir, state: lightState(sg.off, p.dir, sim.time) }; }),
        signs: [
          ...R.stops.map((sp) => { const p = pointAt(R.pts, sp.stopS); return { x: p.x + Math.cos(p.dir + Math.PI / 2) * 3, y: p.y + Math.sin(p.dir + Math.PI / 2) * 3, h: p.dir, code: 'B-20' }; }),
          ...R.limits.slice(1).map((l) => { const p = pointAt(R.pts, l.s + 4); return { x: p.x + Math.cos(p.dir + Math.PI / 2) * 3.2, y: p.y + Math.sin(p.dir + Math.PI / 2) * 3.2, h: p.dir, code: 'B-33', num: l.ms }; }),
          ...R.crossings.map((cr) => { const p = pointAt(R.pts, cr.s - 3); return { x: p.x + Math.cos(p.dir + Math.PI / 2) * 3.2, y: p.y + Math.sin(p.dir + Math.PI / 2) * 3.2, h: p.dir, code: 'D-6' }; }),
        ],
      };
    },
    route: () => R,
  };

  function zoneHas(t, b) {
    const l = toLocal(b, { x: t.at(0, 0).x, y: t.at(0, 0).y, h: t.dir });
    return l.x > t.zone.a - 8 && l.x < t.zone.b + 8 && l.y > t.zone.lat0 - 4 && l.y < t.zone.lat1 + 1;
  }
  function done(t) {
    t.status = 'ok';
    sim.msg(`✅ ${t.n} – zaliczone. Proszę kontynuować jazdę.`, '', true);
  }
  function tfail(t, msg) {
    t.tries++;
    sim.fault(`${t.n}: ${msg}`, false);
    if (t.tries >= 2) { t.status = 'fail'; sim.fault(`${t.n} – dwie nieudane próby`, true); }
    else { t.status = 'active'; t.stopT = 0; sim.msg('🎙️ Proszę spróbować jeszcze raz.', '', true); }
  }
  function taskUpdate(t, sim, dt, b) {
    if (t.status === 'ok' || t.status === 'fail') return;
    const o = { x: t.at(0, 0).x, y: t.at(0, 0).y, h: t.dir };
    const l = toLocal(b, o);
    if (t.status === 'todo' && l.x > -70 && l.x < 0 && Math.abs(l.y) < 12) { t.status = 'active'; instruct(t.say); }
    if (t.status !== 'active') return;
    const c = sim.car;
    if (t.kind === 'hamowanie') {
      const fl = toLocal(sim.front(), o);
      if (Math.abs(c.v) < 0.05 && fl.x > t.coneAlong - 12) {
        t.stopT = (t.stopT || 0) + dt;
        if (t.stopT > 0.8) { if (Math.abs(fl.x - t.coneAlong) <= (moto ? 1.5 : 1.0)) done(t); else { tfail(t, `zatrzymanie ${fl.x < t.coneAlong ? 'przed' : 'za'} pachołkiem (${Math.abs(fl.x - t.coneAlong).toFixed(1)} m)`); t.coneAlong += 90; t.cone = t.at(t.coneAlong, t.r.w / 2 + 0.4); } }
      } else t.stopT = 0;
      if (fl.x > t.coneAlong + 6) { tfail(t, 'przejechanie wyznaczonego miejsca bez zatrzymania'); t.coneAlong += 90; t.cone = t.at(t.coneAlong, t.r.w / 2 + 0.4); }
      return;
    }
    for (const p of t.parked || []) if (obbHit(p, b) || (sim.trailer && obbHit(p, sim.trailerBody()))) { tfail(t, 'kontakt z zaparkowanym pojazdem'); sim.setPose(t.at(-8, laneOffset(t.r)).x, t.at(-8, laneOffset(t.r)).y, t.dir); return; }
    const inside = sim.corners().every((p) => pointInOBB(p, t.target, 0.05));
    const al = Math.abs(angDiff(c.h, t.dir + (t.align * DEG)));
    const aligned = t.align ? Math.min(al, Math.PI - al) < 12 * DEG : al < 10 * DEG;
    t.inside = inside && aligned && Math.abs(c.v) < 0.05;
    if (t.kind === 'przystanek') return;
    if (t.inside) { t.stopT = (t.stopT || 0) + dt; if (t.stopT > 1.5) done(t); } else t.stopT = 0;
    if (l.x > t.zone.b + 45) tfail(t, 'pominięcie zadania');
  }

  return stage;
}

// ---------- rysowanie mapy ----------
const AREA_COL = { g: '#7fae6a', f: '#4d7d43', w: '#5b9bd5', p: '#8a8d93', b: '#c4b4a2' };
function drawMap(g, sim, W, R, tasks, sigOff) {
  const vw = sim.view;
  const vis = (bb) => bb[2] > vw.cx - vw.r && bb[0] < vw.cx + vw.r && bb[3] > vw.cy - vw.r && bb[1] < vw.cy + vw.r;
  if (!W._abb) W._abb = W.areas.map((a) => { const xs = a.p.map((p) => p[0]), ys = a.p.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  W.areas.forEach((a, i) => {
    if (a.k === 'b' || !vis(W._abb[i])) return;
    g.fillStyle = AREA_COL[a.k]; g.beginPath(); a.p.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill();
  });
  const roads = W.roads.filter((r) => vis(r.bb)).sort((a, b) => a.l - b.l || a.w - b.w);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const path = (r) => { g.beginPath(); r.p.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); };
  for (const r of roads) { if (r.t !== 'service' && !r.t.startsWith('motorway')) { path(r); g.strokeStyle = '#bdb6a8'; g.lineWidth = r.w + 3.4; g.stroke(); } }
  for (const r of roads) { path(r); g.strokeStyle = r.br ? '#3f434a' : '#4b4f57'; g.lineWidth = r.w; g.stroke(); }
  g.setLineDash([3, 5]); g.lineWidth = 0.15; g.strokeStyle = '#f2f2f2';
  for (const r of roads) if (r.w >= 6 && r.t !== 'service' && !r.rb && (!r.ow || r.w >= 7)) { path(r); g.stroke(); }
  g.setLineDash([]);
  // budynki
  W.areas.forEach((a, i) => {
    if (a.k !== 'b' || !vis(W._abb[i])) return;
    g.fillStyle = AREA_COL.b; g.strokeStyle = '#8f7f70'; g.lineWidth = 0.3;
    g.beginPath(); a.p.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); g.stroke();
  });
  // przejścia (zebry) i znaki z OSM
  for (const f of W.feats) {
    if (Math.abs(f.x - vw.cx) > vw.r || Math.abs(f.y - vw.cy) > vw.r) continue;
    if (f.k === 'cross' && f.c !== 'u') {
      const nr = nearestRoad(W, f.x, f.y, 6);
      if (!nr) continue;
      g.save(); g.translate(f.x, f.y); g.rotate(nr.dir);
      g.fillStyle = '#f4f4f4';
      for (let k = -nr.r.w / 2 + 0.3; k < nr.r.w / 2 - 0.2; k += 1.0) g.fillRect(-2, k, 4, 0.5);
      g.restore();
    } else if (f.k === 'sig' || f.k === 'stop' || f.k === 'give') {
      g.fillStyle = f.k === 'sig' ? '#222' : f.k === 'stop' ? '#d0021b' : '#ffcc00';
      g.beginPath(); g.arc(f.x, f.y, 0.6, 0, 7); g.fill();
    }
  }
  // linie zatrzymania na trasie
  const line = (s, col, w = 0.4) => { const p = pointAt(R.pts, s); g.save(); g.translate(p.x, p.y); g.rotate(p.dir); g.fillStyle = col; g.fillRect(-w / 2, -1.9, w, 3.8); g.restore(); };
  for (const sg of R.signals) {
    line(sg.stopS, '#f4f4f4');
    const p = pointAt(R.pts, sg.stopS);
    const st = lightState(sg.off, p.dir, sim.time);
    const lx = p.x + Math.cos(p.dir + Math.PI / 2) * 3.4, ly = p.y + Math.sin(p.dir + Math.PI / 2) * 3.4;
    g.fillStyle = '#111'; g.fillRect(lx - 0.5, ly - 1.3, 1, 2.6);
    g.fillStyle = st === 'r' || st === 'ry' ? '#ff3030' : '#3a1010'; g.beginPath(); g.arc(lx, ly - 0.8, 0.35, 0, 7); g.fill();
    g.fillStyle = st === 'y' || st === 'ry' ? '#ffc400' : '#3a3010'; g.beginPath(); g.arc(lx, ly, 0.35, 0, 7); g.fill();
    g.fillStyle = st === 'g' ? '#22d36a' : '#0e3420'; g.beginPath(); g.arc(lx, ly + 0.8, 0.35, 0, 7); g.fill();
  }
  for (const sp of R.stops) { line(sp.stopS, '#f4f4f4', 0.6); }
  // trasa (podgląd 180 m naprzód)
  g.strokeStyle = 'rgba(255,214,0,.55)'; g.lineWidth = 0.6; g.setLineDash([2, 2]);
  g.beginPath();
  let started = false;
  for (const p of R.pts) { if (p.s < R.s || p.s > R.s + 180) continue; started ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); started = true; }
  g.stroke(); g.setLineDash([]);
  // strefy zadań
  for (const t of tasks) {
    if (t.status === 'ok') continue;
    if (t.zone) {
      const a = t.at(t.zone.a, t.zone.lat0), b2 = t.at(t.zone.b, t.zone.lat0), c2 = t.at(t.zone.b, t.zone.lat1), d = t.at(t.zone.a, t.zone.lat1);
      g.fillStyle = '#55585f'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b2.x, b2.y); g.lineTo(c2.x, c2.y); g.lineTo(d.x, d.y); g.fill();
      g.strokeStyle = '#f4f4f4'; g.lineWidth = 0.15; g.stroke();
      const tg = t.target;
      g.save(); g.translate(tg.x, tg.y); g.rotate(tg.h);
      g.strokeStyle = t.kind === 'przystanek' ? '#ffcc00' : '#f4f4f4'; g.lineWidth = 0.15; g.setLineDash([0.8, 0.6]); g.strokeRect(-tg.len / 2, -tg.wid / 2, tg.len, tg.wid); g.setLineDash([]);
      if (t.kind === 'przystanek') { g.fillStyle = '#ffcc00'; g.font = 'bold 1.6px sans-serif'; g.textAlign = 'center'; g.fillText('BUS', 0, 0.5); }
      g.restore();
      if (t.bays) for (const bb of t.bays) { g.save(); g.translate(bb.x, bb.y); g.rotate(bb.h); g.strokeStyle = '#f4f4f4'; g.lineWidth = 0.12; g.strokeRect(-bb.len / 2, -bb.wid / 2, bb.len, bb.wid); g.restore(); }
    }
    if (t.cone) { g.fillStyle = '#ff6b00'; g.beginPath(); g.arc(t.cone.x, t.cone.y, 0.4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(t.cone.x, t.cone.y, 0.16, 0, 7); g.fill(); }
  }
}

let mini = null;
function drawMinimap(g, sim, W, R) {
  const size = Math.round(150 * sim.dpr), range = 700;
  if (!mini || mini.width !== size) {
    mini = document.createElement('canvas'); mini.width = mini.height = size;
    const m = mini.getContext('2d');
    m.fillStyle = 'rgba(20,28,40,.85)'; m.fillRect(0, 0, size, size);
    m.translate(size / 2, size / 2); m.scale(size / (2 * range), size / (2 * range));
    m.strokeStyle = '#8895a7'; m.lineCap = 'round';
    for (const r of W.roads) { if (r.t === 'service') continue; m.lineWidth = Math.max(4, r.w); m.beginPath(); r.p.forEach(([x, y], j) => (j ? m.lineTo(x, y) : m.moveTo(x, y))); m.stroke(); }
    m.fillStyle = '#e1172b'; m.beginPath(); m.arc(0, 0, 18, 0, 7); m.fill();
  }
  const x0 = sim.cv.width - size - 10 * sim.dpr, y0 = 10 * sim.dpr + 40 * sim.dpr;
  g.drawImage(mini, x0, y0);
  const k = size / (2 * range);
  g.save(); g.beginPath(); g.rect(x0, y0, size, size); g.clip();
  g.strokeStyle = 'rgba(255,214,0,.9)'; g.lineWidth = 2 * sim.dpr; g.beginPath();
  R.pts.forEach((p, i) => { const x = x0 + size / 2 + p.x * k, y = y0 + size / 2 + p.y * k; i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.stroke();
  const b = sim.body();
  g.fillStyle = '#2ecc71'; g.beginPath(); g.arc(x0 + size / 2 + b.x * k, y0 + size / 2 + b.y * k, 4 * sim.dpr, 0, 7); g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.font = `${10 * sim.dpr}px sans-serif`; g.fillText('N ↑  © OSM', x0 + 4, y0 + size - 4);
}

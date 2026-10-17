// Schematy skrzyżowań („mapki”) w SVG z animacją kolejności przejazdu.
// Ruch prawostronny. Ramiona: S (dół), W (lewo), N (góra), E (prawo).
import { signSVG } from './signs.js';

const C = 200, H = 40, SIZE = 400;
const ARM_ROT = { S: 0, W: 90, N: 180, E: 270 };
const ARM_IDX = { S: 0, W: 1, N: 2, E: 3 };
const COLORS = { A: '#e74c3c', B: '#3498db', C: '#2ecc71', D: '#f39c12', E: '#9b59b6', T: '#f1c40f', K: '#ecf0f1' };

function rot([x, y], deg) {
  const r = (deg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  return [C + (x - C) * cs - (y - C) * sn, C + (x - C) * sn + (y - C) * cs];
}
const f = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f(p[0])} ${f(p[1])}`;

// Trasa w układzie lokalnym (pojazd z dołu jedzie w górę), potem obrót do ramienia.
function crossPath(from, to, startY = C + H + 30) {
  const d = (ARM_IDX[to] - ARM_IDX[from] + 4) % 4;
  const deg = ARM_ROT[from];
  const R = (p) => pt(rot(p, deg));
  const x = C + 20;
  const start = [x, startY], entry = [x, C + H];
  if (d === 2) return `M${R(start)} L${R([x, -60])}`;
  if (d === 3) return `M${R(start)} L${R(entry)} Q${R([x, C + 20])} ${R([C + H, C + 20])} L${R([SIZE + 60, C + 20])}`;
  if (d === 1) return `M${R(start)} L${R(entry)} Q${R([x, C - 20])} ${R([C - H, C - 20])} L${R([-60, C - 20])}`;
  return `M${R(start)} L${R([x, C])} Q${R([x, C - 30])} ${R([C, C - 30])} Q${R([C - 20, C - 30])} ${R([C - 20, C])} L${R([C - 20, SIZE + 60])}`;
}

function roundPath(from, to) {
  const deg = ARM_ROT[from];
  const Rr = 70;
  const d = (ARM_IDX[to] - ARM_IDX[from] + 4) % 4;
  const a0 = (Math.acos(20 / Rr) * 180) / Math.PI; // ≈73.4°
  const s = (Math.asin(20 / Rr) * 180) / Math.PI; // ≈16.6°
  const ends = { 3: s, 2: -a0, 1: -180 + s, 0: -180 - a0 };
  const end = ends[d];
  const pts = [[C + 20, SIZE + 40], [C + 20, C + Math.sin((a0 * Math.PI) / 180) * Rr]];
  for (let a = a0; a >= end; a -= 6) pts.push([C + Rr * Math.cos((a * Math.PI) / 180), C + Rr * Math.sin((a * Math.PI) / 180)]);
  const ea = (end * Math.PI) / 180;
  pts.push([C + Rr * Math.cos(ea), C + Rr * Math.sin(ea)]);
  const exitLocal = { 3: [SIZE + 60, C + 20], 2: [C + 20, -60], 1: [-60, C - 20], 0: [C - 20, SIZE + 60] }[d];
  pts.push(exitLocal);
  return 'M' + pts.map((p) => pt(rot(p, deg))).join(' L');
}

function nestedSign(code, x, y, size) {
  return signSVG(code, size).replace('<svg class="sign"', `<svg x="${f(x - size / 2)}" y="${f(y - size / 2)}"`);
}

function vehicleShape(v) {
  const col = v.color || COLORS[v.id] || '#e74c3c';
  const label = `<text x="0" y="2" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="800" fill="#fff" font-family="Arial" transform="rotate(${-0})">${v.id}</text>`;
  switch (v.kind) {
    case 'tram': return `<rect x="-12" y="-34" width="24" height="68" rx="5" fill="#f1c40f" stroke="#222" stroke-width="2"/><rect x="-9" y="-30" width="18" height="8" fill="#9fd3ff"/>${label.replace('#fff', '#222')}`;
    case 'bus': return `<rect x="-12" y="-28" width="24" height="56" rx="4" fill="${col}" stroke="#222" stroke-width="2"/><rect x="-9" y="-25" width="18" height="7" fill="#9fd3ff"/>${label}`;
    case 'truck': return `<rect x="-12" y="-30" width="24" height="14" rx="3" fill="${col}" stroke="#222" stroke-width="2"/><rect x="-13" y="-14" width="26" height="44" rx="2" fill="#bdc3c7" stroke="#222" stroke-width="2"/>${label.replace('y="2"', 'y="8"').replace('#fff', '#222')}`;
    case 'bike': return `<rect x="-4" y="-14" width="8" height="28" rx="4" fill="${col}" stroke="#222" stroke-width="1.5"/><circle r="6" fill="${col}" stroke="#fff" stroke-width="1.5"/><text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="800" fill="#fff">${v.id}</text>`;
    case 'amb': return `<rect x="-11" y="-18" width="22" height="36" rx="5" fill="#fff" stroke="#c0392b" stroke-width="2"/><rect x="-9" y="-16" width="18" height="5" fill="#2e86de"/><path d="M-5 4 h10 M0 -1 v10" stroke="#c0392b" stroke-width="3"/><text x="0" y="-24" text-anchor="middle" font-size="11" font-weight="800" fill="#c0392b">${v.id}</text>`;
    default: return `<rect x="-11" y="-18" width="22" height="36" rx="6" fill="${col}" stroke="#222" stroke-width="2"/><rect x="-8" y="-13" width="16" height="7" rx="2" fill="#bfe3ff"/>${label}`;
  }
}

function blinker(v) {
  const d = (ARM_IDX[v.to] - ARM_IDX[v.from] + 4) % 4;
  if (d === 2 || v.kind === 'tram' || v.kind === 'bike') return '';
  const side = d === 3 ? 1 : -1;
  return `<circle class="blink" cx="${side * 11}" cy="-16" r="3.5" fill="#ffb300"/><circle class="blink" cx="${side * 11}" cy="16" r="3.5" fill="#ffb300"/>`;
}

export function sceneSVG(sc, uid = 'sc' + Math.random().toString(36).slice(2, 7)) {
  const arms = sc.arms || ['S', 'W', 'N', 'E'];
  const round = sc.type === 'round';
  let g = `<rect width="${SIZE}" height="${SIZE}" fill="#5c8a4a"/>`;
  // Chodniki + jezdnie
  for (const a of arms) {
    const deg = ARM_ROT[a];
    g += `<g transform="rotate(${deg} ${C} ${C})"><rect x="${C - H - 10}" y="${C}" width="${2 * H + 20}" height="${C}" fill="#c9c3b6"/>
      <rect x="${C - H}" y="${C}" width="${2 * H}" height="${C}" fill="#4d525a"/>
      ${round ? '' : `<line x1="${C}" y1="${C + H + 4}" x2="${C}" y2="${SIZE}" stroke="#fff" stroke-width="2.5" stroke-dasharray="14 12"/>`}
      ${sc.prio && sc.prio.includes(a) ? '' : round ? '' : `<line x1="${C}" y1="${C + H + 2}" x2="${C + H}" y2="${C + H + 2}" stroke="#fff" stroke-width="${sc.signs?.[a] === 'B-20' ? 5 : 3}" ${sc.signs?.[a] === 'A-7' ? 'stroke-dasharray="6 5"' : ''}/>`}
      ${sc.zebra?.includes(a) ? [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${C - H + 3 + i * 11}" y="${C + H + 8}" width="6" height="22" fill="#f5f5f5"/>`).join('') : ''}
      ${sc.tram?.includes(a) ? `<g stroke="#2b2b2b" stroke-width="2"><line x1="${C + 12}" y1="${C}" x2="${C + 12}" y2="${SIZE}"/><line x1="${C + 28}" y1="${C}" x2="${C + 28}" y2="${SIZE}"/></g>` : ''}
    </g>`;
  }
  if (round) {
    g += `<circle cx="${C}" cy="${C}" r="${H + 52}" fill="#4d525a"/><circle cx="${C}" cy="${C}" r="46" fill="#6aa357" stroke="#ddd" stroke-width="4"/>`;
  } else {
    g += `<rect x="${C - H}" y="${C - H}" width="${2 * H}" height="${2 * H}" fill="#4d525a"/>`;
    if (sc.tram) g += `<g stroke="#2b2b2b" stroke-width="2"><line x1="${C + 12}" y1="0" x2="${C + 12}" y2="${SIZE}"/><line x1="${C + 28}" y1="0" x2="${C + 28}" y2="${SIZE}"/><line x1="${C - 12}" y1="0" x2="${C - 12}" y2="${SIZE}"/><line x1="${C - 28}" y1="0" x2="${C - 28}" y2="${SIZE}"/></g>`;
  }
  // Znaki i sygnalizatory na wlotach (prawa strona wlotu)
  for (const a of arms) {
    const [x, y] = rot([C + H + 26, C + H + 42], ARM_ROT[a]);
    if (sc.signs?.[a]) {
      const codes = [].concat(sc.signs[a]);
      codes.forEach((code, i) => { g += nestedSign(code, x, y + i * 34, 32); });
    }
    if (sc.lights?.[a]) {
      const l = sc.lights[a];
      g += `<g transform="translate(${f(x - 7)} ${f(y - 22)})"><rect width="14" height="40" rx="4" fill="#111"/>
        <circle cx="7" cy="8" r="4.5" fill="${l === 'r' || l === 'ry' ? '#ff3030' : '#3a1414'}"/>
        <circle cx="7" cy="20" r="4.5" fill="${l === 'y' || l === 'ry' || l === 'yb' ? '#ffc400' : '#3a3010'}" ${l === 'yb' ? 'class="blink"' : ''}/>
        <circle cx="7" cy="32" r="4.5" fill="${l === 'g' ? '#22d36a' : '#0e3420'}"/></g>`;
      if (sc.arrow?.includes(a)) g += `<g transform="translate(${f(x + 9)} ${f(y + 8)})"><rect width="14" height="10" fill="#000"/><path d="M2 5 h8 m-3 -3 l3 3 l-3 3" stroke="#22d36a" stroke-width="2" fill="none"/></g>`;
    }
  }
  // Piesi
  for (const p of sc.peds || []) {
    const [x, y] = rot([C - H + 6 + (p.pos ?? 0.5) * 68, C + H + 19], ARM_ROT[p.arm]);
    g += `<g class="ped" data-id="${p.id || ''}"><circle cx="${f(x)}" cy="${f(y)}" r="7" fill="#ff7675" stroke="#222" stroke-width="1.5"/><text x="${f(x)}" y="${f(y - 12)}" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">🚶</text></g>`;
  }
  // Trasy (przerywane strzałki) + pojazdy
  let paths = '', vehs = '';
  for (const v of sc.vehicles || []) {
    const d = round ? roundPath(v.from, v.to) : crossPath(v.from, v.to, v.kind === 'tram' ? C + H + 46 : v.kind === 'bus' || v.kind === 'truck' ? C + H + 40 : C + H + 30);
    const col = v.kind === 'tram' ? '#f1c40f' : v.color || COLORS[v.id] || '#e74c3c';
    paths += `<path id="${uid}-p-${v.id}" d="${d}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="7 6" opacity=".85" marker-end="url(#${uid}-arr)"/>`;
    vehs += `<g class="veh" data-id="${v.id}" data-path="${uid}-p-${v.id}">${vehicleShape(v)}${blinker(v)}</g>`;
  }
  const defs = `<defs><marker id="${uid}-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#fff"/></marker></defs>`;
  return `<svg class="scene" id="${uid}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${sc.caption || 'Schemat skrzyżowania'}">${defs}${g}<g class="paths">${paths}</g><g class="vehs">${vehs}</g></svg>`;
}

// Ustawia pojazdy w pozycji startowej (na początku trasy).
export function placeVehicles(svg) {
  svg.querySelectorAll('.veh').forEach((el) => {
    const p = svg.getElementById(el.dataset.path);
    if (!p) return;
    const len = p.getTotalLength();
    // ustaw pojazd tak, by stał przed skrzyżowaniem (początek trasy + 0)
    setPose(el, p, Math.min(4, len));
    el.style.opacity = 1;
  });
}

function setPose(el, path, l) {
  const len = path.getTotalLength();
  const a = path.getPointAtLength(Math.max(0, Math.min(len, l)));
  const b = path.getPointAtLength(Math.max(0, Math.min(len, l + 2)));
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
  el.setAttribute('transform', `translate(${f(a.x)} ${f(a.y)}) rotate(${f(ang)})`);
}

// Odtwarza przejazd w kolejności grup: order = [['A'], ['B','C'], ...]
export function playScene(svg, order, { speed = 1 } = {}) {
  let cancelled = false;
  placeVehicles(svg);
  const run = async () => {
    for (const group of order) {
      if (cancelled) return;
      await Promise.all(group.map((id) => new Promise((res) => {
        const el = svg.querySelector(`.veh[data-id="${id}"]`);
        if (!el) return res();
        const path = svg.getElementById(el.dataset.path);
        const len = path.getTotalLength();
        const dur = (1100 + len * 2.4) / speed;
        const t0 = performance.now();
        const step = (t) => {
          if (cancelled) return res();
          const k = Math.min(1, (t - t0) / dur);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          setPose(el, path, 4 + e * (len - 4));
          if (k < 1) requestAnimationFrame(step); else { el.style.opacity = 0.25; res(); }
        };
        requestAnimationFrame(step);
      })));
      await new Promise((r) => setTimeout(r, 250));
    }
  };
  const done = run();
  return { cancel: () => { cancelled = true; }, done };
}

// Gotowe scenariusze używane w podręczniku, mapach i pytaniach.
export const SCENES = {
  prawaReka: {
    caption: 'Skrzyżowanie równorzędne – reguła prawej ręki',
    vehicles: [{ id: 'A', from: 'S', to: 'N' }, { id: 'B', from: 'E', to: 'W' }],
    order: [['B'], ['A']],
    explain: 'Pojazd B nadjeżdża z prawej strony pojazdu A – ma pierwszeństwo. A czeka i jedzie po nim.',
  },
  lewoskret: {
    caption: 'Skręt w lewo – ustąp jadącym z przeciwka',
    vehicles: [{ id: 'A', from: 'S', to: 'W' }, { id: 'B', from: 'N', to: 'S' }],
    order: [['B'], ['A']],
    explain: 'Skręcając w lewo, ustępujesz pojazdom z kierunku przeciwnego jadącym na wprost lub skręcającym w prawo.',
  },
  trzyAuta: {
    caption: 'Trzy pojazdy na skrzyżowaniu równorzędnym',
    vehicles: [{ id: 'A', from: 'S', to: 'N' }, { id: 'B', from: 'W', to: 'E' }, { id: 'C', from: 'N', to: 'E' }],
    order: [['A'], ['B'], ['C']],
    explain: 'A nie ma nikogo z prawej (ramię E puste) – jedzie pierwszy. B miał A z prawej – jedzie drugi. C skręca w lewo i ma B z prawej – jedzie ostatni.',
  },
  podporzadkowana: {
    caption: 'Droga z pierwszeństwem (D-1) i podporządkowana (A-7)',
    prio: ['W', 'E'],
    signs: { S: 'A-7', N: 'A-7', W: 'D-1', E: 'D-1' },
    vehicles: [{ id: 'A', from: 'S', to: 'N' }, { id: 'B', from: 'W', to: 'E' }, { id: 'C', from: 'E', to: 'N' }],
    order: [['B', 'C'], ['A']],
    explain: 'B (prosto) i C (w prawo) jadą drogą z pierwszeństwem, ich tory się nie przecinają – jadą jednocześnie. A z drogi podporządkowanej (A-7) jedzie ostatni.',
  },
  stop: {
    caption: 'Znak STOP – zatrzymanie przed linią',
    prio: ['W', 'E'],
    signs: { S: 'B-20', W: 'D-1', E: 'D-1' },
    arms: ['S', 'W', 'E'],
    vehicles: [{ id: 'A', from: 'S', to: 'E' }, { id: 'B', from: 'E', to: 'W' }],
    order: [['B'], ['A']],
    explain: 'Przed znakiem STOP zatrzymujesz się zawsze – nawet gdy droga jest pusta. Potem ustępujesz B.',
  },
  tramwaj: {
    caption: 'Tramwaj na skrzyżowaniu równorzędnym',
    tram: ['S', 'N'],
    vehicles: [{ id: 'T', from: 'N', to: 'S', kind: 'tram' }, { id: 'A', from: 'E', to: 'W' }],
    order: [['T'], ['A']],
    explain: 'Na skrzyżowaniu równorzędnym pojazd szynowy ma pierwszeństwo przed pojazdami nieszynowymi – nawet gdy nadjeżdża z lewej.',
  },
  rondo: {
    type: 'round',
    caption: 'Rondo – wjazd, jazda w lewo (przeciwnie do wskazówek zegara) i zjazd',
    signs: { S: ['A-7', 'C-12'], W: ['A-7', 'C-12'], N: ['A-7', 'C-12'], E: ['A-7', 'C-12'] },
    vehicles: [{ id: 'A', from: 'S', to: 'W' }, { id: 'B', from: 'E', to: 'S' }],
    order: [['B'], ['A']],
    explain: 'Gdy wlot oznaczony jest A-7 i C-12, ustępujesz pojazdom jadącym po rondzie. B już krąży po rondzie – ma pierwszeństwo.',
  },
  uprzywilejowany: {
    caption: 'Pojazd uprzywilejowany – zjedź i przepuść',
    vehicles: [{ id: 'K', from: 'E', to: 'W', kind: 'amb' }, { id: 'A', from: 'S', to: 'N' }, { id: 'B', from: 'W', to: 'E' }],
    lights: { S: 'g', N: 'g', W: 'r', E: 'r' },
    order: [['K'], ['A'], ['B']],
    explain: 'Karetka z sygnałami świetlnymi i dźwiękowymi ma pierwszeństwo, nawet na czerwonym. A, mimo zielonego, musi ją przepuścić.',
  },
  sygnalizacja: {
    caption: 'Sygnalizacja świetlna z zieloną strzałką',
    lights: { S: 'r', N: 'r', W: 'g', E: 'g' },
    arrow: ['S'],
    vehicles: [{ id: 'A', from: 'S', to: 'E' }, { id: 'B', from: 'W', to: 'E' }],
    order: [['B'], ['A']],
    explain: 'A ma czerwone z zieloną strzałką: musi się zatrzymać i ustąpić pierwszeństwa B, który ma zielone. Dopiero potem skręca w prawo.',
  },
  piesi: {
    caption: 'Pieszy na przejściu i wchodzący na przejście',
    zebra: ['E'],
    peds: [{ arm: 'E', pos: 0.3 }],
    vehicles: [{ id: 'A', from: 'S', to: 'E' }],
    order: [['A']],
    explain: 'Skręcając, ustępujesz pierwszeństwa pieszemu przechodzącemu przez jezdnię drogi, na którą wjeżdżasz – i wchodzącemu na przejście.',
  },
};

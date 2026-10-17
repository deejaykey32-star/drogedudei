// Etap 1: plac manewrowy WORD (układ lokalny placu, metry).
import { angDiff } from './world.js';
import { pointInOBB, obbHit } from './engine.js';

const MOTO = ['AM', 'A1', 'A2', 'A'];
const HEAVY = ['C1', 'C', 'C+E', 'C1+E', 'D1', 'D', 'D+E'];

const PREP = {
  car: [
    ['Proszę sprawdzić działanie świateł STOP.', ['Włączę zapłon, wcisnę hamulec i sprawdzę odbicie świateł lub obejdę pojazd z obciążonym pedałem', 'Włączę światła drogowe i obejrzę przód', 'Włączę światła awaryjne']],
    ['Proszę wskazać zbiornik płynu hamulcowego i ocenić poziom.', ['Zbiornik z oznaczeniem MIN/MAX przy grodzi – poziom między MIN a MAX', 'Zbiornik z symbolem szyby – zbiornik spryskiwaczy', 'Wlew oleju na pokrywie silnika']],
    ['Proszę sprawdzić działanie sygnału dźwiękowego.', ['Krótko nacisnę klakson', 'Mignę światłami drogowymi', 'Włączę kierunkowskaz']],
    ['Proszę sprawdzić poziom płynu chłodniczego.', ['Na zimnym silniku – zbiornik wyrównawczy, poziom między MIN a MAX', 'Na gorącym silniku odkręcę korek chłodnicy', 'Sprawdzę bagnetem olejowym']],
    ['Proszę sprawdzić działanie świateł cofania.', ['Włączę zapłon, wrzucę wsteczny (przy wciśniętym sprzęgle) i sprawdzę tył pojazdu', 'Włączę światła mijania', 'Włączę tylne przeciwmgłowe']],
  ],
  heavy: [['Proszę sprawdzić ciśnienie w układzie hamulcowym.', ['Odczytam manometry: ciśnienie w obwodach w normie, kontrolki zgaszone', 'Sprawdzę poziom płynu spryskiwaczy', 'Nacisnę oponę butem']]],
  moto: [
    ['Proszę sprawdzić napięcie łańcucha napędowego.', ['Sprawdzę ugięcie dolnej części łańcucha – zgodnie z instrukcją (zwykle 2–3 cm)', 'Sprawdzę poziom oleju w silniku', 'Nacisnę sygnał dźwiękowy']],
    ['Proszę sprawdzić działanie światła hamowania (hamulec tylny).', ['Włączę zapłon, nacisnę pedał hamulca tylnego i sprawdzę światło stop', 'Włączę światło drogowe', 'Włączę kierunkowskaz lewy']],
    ['Proszę sprawdzić działanie sygnału dźwiękowego.', ['Krótko nacisnę przycisk klaksonu', 'Mignę światłem drogowym', 'Włączę światła awaryjne']],
  ],
};

function shuffleQ([q, opts]) {
  const idx = opts.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { q, opts: idx.map((i) => opts[i]), correct: idx.indexOf(0) };
}

export function createPlac(sim, onDone) {
  const cat = sim.cat, v = sim.v;
  const moto = MOTO.includes(cat);
  const withTrailer = !!v.trailer;
  const totalLen = v.len + (withTrailer ? v.trailer.len + 0.6 : 0);
  const tasks = moto
    ? [{ id: 'prep', n: 'Przygotowanie i sprawdzenie' }, { id: 'slalom', n: 'Slalom wolny' }, { id: 'osemka', n: 'Ósemka' }, { id: 'brake', n: 'Hamowanie w wyznaczonym miejscu' }]
    : [{ id: 'prep', n: 'Przygotowanie i sprawdzenie' }, ...(withTrailer ? [{ id: 'hitch', n: 'Sprzęganie' }] : []), { id: 'luk', n: 'Łuk – przód i tył' }, { id: 'hill', n: 'Ruszanie na wzniesieniu' }];
  tasks.forEach((t) => { t.tries = 0; t.status = 'todo'; });
  let cur = 0;
  let st = {};

  // --- geometria łuku ---
  const R = { B: 10, B1: 9, 'B+E': 12, C1: 13, 'C1+E': 15, C: 15, 'C+E': 18, D1: 13, D: 16, 'D+E': 17, T: 12 }[cat] || 10;
  const laneW = v.wid + (withTrailer ? 1.9 : 1.2);
  const y0 = 4 + totalLen + 1;
  const lane = [];
  { // prosta, łuk w prawo, prosta
    let s = 0;
    const push = (x, y) => { if (lane.length) s += Math.hypot(x - lane[lane.length - 1].x, y - lane[lane.length - 1].y); lane.push({ x, y, s }); };
    for (let y = y0; y >= -6; y -= 0.5) push(0, y);
    for (let a = Math.PI; a <= 1.5 * Math.PI + 1e-6; a += 0.02) push(R + R * Math.cos(a), -6 + R * Math.sin(a));
    for (let x = R + 0.5; x <= R + 10; x += 0.5) push(x, -6 - R);
  }
  const laneLen = lane[lane.length - 1].s;
  const startLine = totalLen + 1; // przód pojazdu startuje tuż przed tą linią
  const proj = (p) => {
    let best = null;
    for (let i = 0; i < lane.length - 1; i++) {
      const a = lane[i], b = lane[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
      let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2; t = Math.max(0, Math.min(1, t));
      const qx = a.x + dx * t, qy = a.y + dy * t, d = Math.hypot(p.x - qx, p.y - qy);
      if (!best || d < best.d) best = { d, s: a.s + t * (b.s - a.s) };
    }
    return best;
  };
  const HX = 30 + R; // pas wzniesienia
  const hillLine = -20;
  sim.slope = (b) => (!moto && b.x > HX - 4 && b.x < HX + 4 && b.y < -6 && b.y > -34 ? { grade: 0.09, up: -Math.PI / 2 } : null);

  // --- motocykl ---
  const cones = [];
  const slalomCones = [0, 1, 2, 3, 4, 5].map((k) => ({ x: 0, y: -8 - 6 * k }));
  const A8 = { x: 22, y: -12 }, B8 = { x: 22, y: -26 }, R8 = 7;
  const BX = 44;

  sim.zoom = Math.max(sim.zoom, moto ? 11 : v.len > 6 ? 7 : 10);

  function placeAtStart() {
    const p = lane.find((q) => q.s >= startLine - 0.3 - v.len / 2);
    sim.setPose(p.x, p.y, -Math.PI / 2);
  }

  function begin(i) {
    cur = i;
    const t = tasks[i];
    if (!t) return finish();
    t.status = 'active';
    st = {};
    sim.car.hand = false; sim.car.blink = null;
    switch (t.id) {
      case 'prep': {
        if (moto) sim.setPose(0, 6, -Math.PI / 2); else placeAtStart();
        const pool = moto ? PREP.moto : [...PREP.car, ...(HEAVY.includes(cat) ? PREP.heavy : [])];
        const q = shuffleQ(pool[Math.floor(Math.random() * pool.length)]);
        sim.msg('🎙️ Egzaminator: ' + q.q, '', true);
        sim.ask?.(q.q, q.opts, (k) => {
          if (k === q.correct) ok('Sprawdzenie wykonane prawidłowo.');
          else fail('Nieprawidłowe sprawdzenie elementu pojazdu.', true);
        });
        break;
      }
      case 'hitch': {
        // przyczepa stoi w strefie startu (tak, by po sprzęgnięciu zestaw mieścił się w strefie), pojazd 5 m przed nią
        const tr = sim.trailer;
        const rearY = y0 - 0.7;
        const hitchY = tr.kind === 'semi' ? rearY - tr.len + 1.2 : rearY - tr.len - 0.9;
        tr.h = -Math.PI / 2;
        tr.hitchPt = { x: 0, y: hitchY };
        sim.setPose(0, hitchY - 5 - v.len / 2, -Math.PI / 2, { trailerAttached: false });
        sim.msg('🎙️ Proszę cofnąć do przyczepy i ją sprzęgnąć (C). Wsteczny: R.', '', true);
        break;
      }
      case 'luk': {
        placeAtStart();
        st.phase = 'fwd';
        sim.msg('🎙️ Łuk: proszę jechać do przodu i zatrzymać się w strefie przed pachołkami, następnie cofnąć do strefy startu.', '', true);
        break;
      }
      case 'hill': {
        sim.setPose(HX, 8 - v.len / 2, -Math.PI / 2);
        st.phase = 'approach';
        sim.msg('🎙️ Proszę podjechać do linii na wzniesieniu, zatrzymać się, zaciągnąć hamulec postojowy (H) i ruszyć bez staczania.', '', true);
        break;
      }
      case 'slalom': sim.setPose(1.2, 6, -Math.PI / 2); st.sides = []; sim.msg('🎙️ Slalom: omijaj pachołki naprzemiennie, bez ich potrącenia.', '', true); break;
      case 'osemka': sim.setPose(A8.x + R8, A8.y + 2, -Math.PI / 2); st = { sa: 0, sb: 0, la: null, lb: null }; sim.msg('🎙️ Ósemka: objedź oba okręgi (jeden w lewo, drugi w prawo), nie wyjeżdżając poza tor.', '', true); break;
      case 'brake': sim.setPose(BX, 8, -Math.PI / 2); st.vmax = 0; sim.msg(`🎙️ Rozpędź się do min. ${cat === 'AM' ? 20 : 30} km/h przed linią i zatrzymaj się przodem w polu hamowania.`, '', true); break;
    }
  }
  function ok(text) {
    const t = tasks[cur];
    t.status = 'ok';
    sim.msg('✅ ' + (text || t.n + ' – zaliczone'), '', true);
    setTimeout(() => begin(cur + 1), 1600);
    st.locked = true;
  }
  function fail(text, noRetryPose) {
    const t = tasks[cur];
    t.tries++;
    sim.fault(`${t.n}: ${text}`, false);
    st.locked = true;
    if (t.tries >= 2) { t.status = 'fail'; sim.fault(`${t.n} – dwie nieudane próby`, true); return; }
    setTimeout(() => { sim.msg('🎙️ Druga próba.', '', true); begin(cur); }, 1800);
  }
  function finish() {
    sim.slope = null;
    onDone?.(tasks);
  }

  const stage = {
    bg: '#5f8b4f',
    lane, // (testy / autopilot)
    tasks,
    summary: () => tasks.map((t) => ({ n: t.n, status: t.status, tries: t.tries })),
    hud: () => ({ stage: 'Plac manewrowy', task: tasks[cur]?.n || '', limit: moto ? null : 20 }),
    update(sim, dt) {
      const t = tasks[cur];
      if (!t || st.locked || sim.ended) return;
      const c = sim.car;
      if (Math.abs(c.v) * 3.6 > 25) fail('Zbyt duża prędkość na placu.');
      switch (t.id) {
        case 'hitch': {
          const tr = sim.trailer, hp = sim.hitch();
          const d = Math.hypot(hp.x - tr.hitchPt.x, hp.y - tr.hitchPt.y);
          const aligned = Math.abs(angDiff(c.h, tr.h)) < 10 * Math.PI / 180;
          st.ready = d < 0.45 && aligned && Math.abs(c.v) < 0.4;
          if (st.ready && !st.told) { st.told = true; sim.msg('Zaczep w osi – naciśnij C, aby sprzęgnąć.'); }
          if (obbHit(sim.body(), sim.trailerBody()) && Math.abs(c.v) > 0.5) fail('Uderzenie w przyczepę.');
          if (d > 14) fail('Oddalenie się od przyczepy.');
          break;
        }
        case 'luk': {
          const corners = sim.allCorners();
          for (const p of corners) { const q = proj(p); if (q.d > laneW / 2 + 0.02 && q.s > 0.5 && q.s < laneLen - 0.3) return fail('Najechanie na linię ograniczającą pas.'); }
          const f = proj(sim.front()).s;
          const rearPt = sim.trailer?.attached ? (() => { const tb = sim.trailerBody(); return { x: tb.x - Math.cos(tb.h) * tb.len / 2, y: tb.y - Math.sin(tb.h) * tb.len / 2 }; })() : sim.rear();
          const r = proj(rearPt).s;
          if (st.phase === 'fwd') {
            if (f > laneLen) return fail('Przejechanie linii końcowej / potrącenie pachołka.');
            if (Math.abs(c.v) < 0.05 && f > laneLen - 1.6) { st.stopT = (st.stopT || 0) + dt; if (st.stopT > 0.6) { st.phase = 'back'; sim.msg('🎙️ Dobrze. Teraz proszę cofnąć do strefy startu.', '', true); } }
            else st.stopT = 0;
          } else {
            if (r < 0) return fail('Przejechanie linii startu tyłem pojazdu.');
            if (Math.abs(c.v) < 0.05 && r < 1.6 && c.gear === 'R') { st.stopT = (st.stopT || 0) + dt; if (st.stopT > 0.6) ok('Łuk wykonany prawidłowo.'); }
            else st.stopT = 0;
          }
          break;
        }
        case 'hill': {
          const fy = sim.front().y;
          if (Math.abs(sim.body().x - HX) > 2.5) return fail('Najechanie na linię.');
          if (st.phase === 'approach') {
            if (fy < hillLine - 1.2) return fail('Niezatrzymanie się przy linii na wzniesieniu.');
            if (Math.abs(c.v) < 0.05 && Math.abs(fy - hillLine) <= 1.0) { st.phase = 'stopped'; sim.msg('🎙️ Zaciągnij hamulec postojowy (H), potem ruszaj.', '', true); }
          } else if (st.phase === 'stopped') {
            if (c.hand) { st.phase = 'hand'; }
            else if (fy > hillLine + 1.3) return fail('Stoczenie się pojazdu przed zaciągnięciem hamulca.');
          } else if (st.phase === 'hand') {
            if (!c.hand) { st.phase = 'go'; st.y0 = fy; st.back = 0; }
          } else if (st.phase === 'go') {
            st.back = Math.max(st.back, fy - st.y0);
            if (st.back > 0.2) return fail('Stoczenie się pojazdu o więcej niż 20 cm.');
            if (fy < -38) ok('Ruszanie na wzniesieniu – zaliczone.');
          }
          break;
        }
        case 'slalom': {
          const b = sim.body();
          for (const cn of slalomCones) if (pointInOBB(cn, b, 0.25)) return fail('Potrącenie pachołka.');
          if (Math.abs(b.x) > 4.5) return fail('Wyjazd poza tor slalomu.');
          slalomCones.forEach((cn, k) => { if (st.sides[k] == null && b.y < cn.y) st.sides[k] = Math.sign(b.x - cn.x); });
          for (let k = 1; k < st.sides.length; k++) if (st.sides[k] === st.sides[k - 1]) return fail('Pominięcie pachołka (brak jazdy naprzemiennej).');
          if (b.y < -44) ok('Slalom – zaliczony.');
          break;
        }
        case 'osemka': {
          const b = sim.body();
          const inA = b.y > (A8.y + B8.y) / 2;
          const C0 = inA ? A8 : B8;
          const d = Math.hypot(b.x - C0.x, b.y - C0.y);
          if (st.moved && (d < R8 - 2.6 || d > R8 + 2.6)) return fail('Wyjazd poza tor ósemki.');
          if (d > 0) st.moved = st.moved || sim.dist > 3;
          const ang = Math.atan2(b.y - C0.y, b.x - C0.x);
          if (inA) { if (st.la != null) st.sa += angDiff(ang, st.la); st.la = ang; st.lb = null; }
          else { if (st.lb != null) st.sb += angDiff(ang, st.lb); st.lb = ang; st.la = null; }
          if (Math.abs(st.sa) > 5.2 && Math.abs(st.sb) > 5.2) {
            if (Math.sign(st.sa) === Math.sign(st.sb)) return fail('Oba okręgi w tym samym kierunku – to nie ósemka.');
            ok('Ósemka – zaliczona.');
          }
          break;
        }
        case 'brake': {
          const fy = sim.front().y;
          if (fy > -40) st.vmax = Math.max(st.vmax, Math.abs(c.v) * 3.6);
          if (fy < -60) return fail('Zatrzymanie za polem hamowania.');
          if (Math.abs(c.v) < 0.05 && fy < -40) {
            if (st.vmax < (cat === 'AM' ? 20 : 30) - 0.5) return fail(`Zbyt mała prędkość przed hamowaniem (${Math.round(st.vmax)} km/h).`);
            if (fy <= -52 && fy >= -60) ok('Hamowanie – zaliczone.');
            else return fail('Zatrzymanie przed polem hamowania.');
          }
          break;
        }
      }
    },
    objects() {
      if (moto) return { cones: [...slalomCones, A8, B8, { x: BX - 2.8, y: -52 }, { x: BX + 2.8, y: -52 }, { x: BX - 2.8, y: -60 }, { x: BX + 2.8, y: -60 }] };
      const e = lane[lane.length - 1];
      return { cones: [{ x: e.x + 0.6, y: e.y - laneW / 2 }, { x: e.x + 0.6, y: e.y + laneW / 2 }] };
    },
    key(code) {
      if (code === 'KeyC' && tasks[cur]?.id === 'hitch' && st.ready) { sim.trailer.attached = true; ok('Sprzęgnięto prawidłowo.'); }
    },
    drawWorld(g) {
      g.fillStyle = '#56595f'; g.fillRect(-14, -64, 92, y0 + 72);
      g.strokeStyle = '#f4f4f4'; g.lineWidth = 0.15;
      if (!moto) {
        // łuk
        for (const side of [-1, 1]) {
          g.beginPath();
          lane.forEach((p, i) => {
            const n = lane[Math.min(i + 1, lane.length - 1)], pr = lane[Math.max(i - 1, 0)];
            const dx = n.x - pr.x, dy = n.y - pr.y, L = Math.hypot(dx, dy) || 1;
            const x = p.x - (dy / L) * side * laneW / 2, y = p.y + (dx / L) * side * laneW / 2;
            i ? g.lineTo(x, y) : g.moveTo(x, y);
          });
          g.stroke();
        }
        const endP = lane[lane.length - 1];
        coneAt(g, endP.x + 0.6, endP.y - laneW / 2); coneAt(g, endP.x + 0.6, endP.y + laneW / 2);
        g.fillStyle = 'rgba(255,200,0,.18)'; g.fillRect(endP.x - 1.6, endP.y - laneW / 2, 1.6, laneW);
        g.fillStyle = 'rgba(80,200,255,.15)'; g.fillRect(-laneW / 2, lane[0].y - 1.6, laneW, 1.6);
        g.fillStyle = '#fff'; g.fillRect(-laneW / 2, lane[0].y - 0.1, laneW, 0.2);
        label(g, 'ŁUK', -laneW / 2 - 4, lane[0].y - 6);
        // wzniesienie
        const grd = g.createLinearGradient(0, -6, 0, -34); grd.addColorStop(0, '#56595f'); grd.addColorStop(0.5, '#6b6e75'); grd.addColorStop(1, '#56595f');
        g.fillStyle = grd; g.fillRect(HX - 3, -34, 6, 28);
        g.fillStyle = '#f4f4f4'; g.fillRect(HX - 3, -42, 0.15, 52); g.fillRect(HX + 2.85, -42, 0.15, 52);
        g.fillRect(HX - 3, hillLine - 0.1, 6, 0.2);
        label(g, 'WZNIESIENIE 9%', HX + 4, -22);
      } else {
        slalomCones.forEach((c) => coneAt(g, c.x, c.y));
        label(g, 'SLALOM', -4, 8);
        for (const C0 of [A8, B8]) { coneAt(g, C0.x, C0.y); g.beginPath(); g.arc(C0.x, C0.y, R8 + 2.4, 0, 7); g.stroke(); g.beginPath(); g.arc(C0.x, C0.y, R8 - 2.4, 0, 7); g.stroke(); }
        label(g, 'ÓSEMKA', A8.x + 8, A8.y);
        g.fillStyle = '#f4f4f4'; g.fillRect(BX - 2.5, -40.1, 5, 0.2);
        g.fillStyle = 'rgba(255,200,0,.25)'; g.fillRect(BX - 2.5, -60, 5, 8);
        coneAt(g, BX - 2.8, -52); coneAt(g, BX + 2.8, -52); coneAt(g, BX - 2.8, -60); coneAt(g, BX + 2.8, -60);
        label(g, 'HAMOWANIE', BX + 3.5, -46);
      }
      // przyczepa odpięta
      if (sim.trailer && !sim.trailer.attached) {
        const hp = sim.trailer.hitchPt;
        g.fillStyle = '#ffb300'; g.beginPath(); g.arc(hp.x, hp.y, 0.25, 0, 7); g.fill();
      }
      label(g, 'PLAC MANEWROWY – WORD KATOWICE, UL. FRANCUSKA', -12, 16);
    },
  };
  stage.begin = () => begin(0);
  return stage;
}

function coneAt(g, x, y) {
  g.fillStyle = '#ff6b00'; g.beginPath(); g.arc(x, y, 0.35, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 0.14, 0, 7); g.fill();
}
function label(g, t, x, y) {
  g.save(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = 'bold 1.2px sans-serif'; g.fillText(t, x, y); g.restore();
}

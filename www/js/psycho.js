// Trening psychotechniczny: refleks, reakcje wyboru, koordynacja, antycypacja, tachistoskop, tablica Schultego.
// To ćwiczenia orientacyjne – nie zastępują badania w pracowni psychologicznej.
import { $, esc, kurakSays, fmtDate } from './ui.js';
import * as store from './store.js';

const TESTS = {
  refleks: { icon: '⚡', n: 'Refleks (czas reakcji prostej)', d: 'Gdy lampa zaświeci na zielono – naciśnij jak najszybciej. 8 prób.', unit: 'ms', better: 'low' },
  wybor: { icon: '🎛️', n: 'Reakcje wyboru (reaktometr)', d: 'Czerwone – LEWA, zielone – PRAWA, żółte – NOGA (spacja). 20 bodźców, liczy się trafność i szybkość.', unit: '%', better: 'high' },
  koordynacja: { icon: '🎯', n: 'Koordynacja wzrokowo-ruchowa', d: 'Prowadź punkt po krętej drodze przez 30 s – palcem, myszą lub strzałkami.', unit: '%', better: 'high' },
  antycypacja: { icon: '🚗', n: 'Antycypacja (ocena prędkości)', d: 'Auto wjeżdża do tunelu. Naciśnij, gdy według ciebie dojedzie do mety. 6 prób.', unit: 'ms', better: 'low' },
  tachistoskop: { icon: '👁️', n: 'Tachistoskop (spostrzegawczość)', d: 'Scena pokaże się na 1,5 s. Potem odpowiedz, co na niej było. 5 prób.', unit: '%', better: 'high' },
  schulte: { icon: '🔢', n: 'Tablica Schultego (uwaga)', d: 'Klikaj liczby od 1 do 25 po kolei jak najszybciej.', unit: 's', better: 'low' },
};

function grade(id, v) {
  const g = {
    refleks: [[250, 'bardzo dobry'], [330, 'dobry'], [430, 'przeciętny'], [Infinity, 'do poprawy']],
    antycypacja: [[120, 'bardzo dobry'], [250, 'dobry'], [450, 'przeciętny'], [Infinity, 'do poprawy']],
    schulte: [[25, 'bardzo dobry'], [35, 'dobry'], [50, 'przeciętny'], [Infinity, 'do poprawy']],
  }[id];
  if (g) return g.find(([t]) => v <= t)[1];
  return v >= 90 ? 'bardzo dobry' : v >= 75 ? 'dobry' : v >= 55 ? 'przeciętny' : 'do poprawy';
}

export function psychoRoute(el, id) {
  if (id && TESTS[id]) return runTest(el, id);
  const s = store.get();
  el.innerHTML = `<h1>🧠 Psychotesty</h1><p class="lead">Ćwiczenia sprawności psychomotorycznej sprawdzanej w badaniach psychologicznych kierowców (zawodowi, taxi, Uber/Bolt, pojazdy uprzywilejowane, skierowani).</p>
  <div class="card">${kurakSays('Wyniki tutaj to trening, nie orzeczenie. Ale regularne ćwiczenia naprawdę skracają czas reakcji – i zmniejszają stres w gabinecie.')}</div>
  <div class="grid g2" style="margin-top:12px">${Object.entries(TESTS).map(([k, t]) => {
    const last = s.psycho[k]?.[0];
    return `<a class="card tile" href="#/psychotesty/${k}"><span class="tico">${t.icon}</span><div><h3>${t.n}</h3><p>${t.d}</p>${last ? `<p><span class="tag">ostatnio: ${last.score} ${t.unit} · ${grade(k, last.score)}</span></p>` : ''}</div></a>`;
  }).join('')}</div>
  <p class="muted" style="margin-top:14px">Widzenie zmierzchowe, wrażliwość na olśnienie oraz testy inteligencji i osobowości wykonuje się tylko w pracowni psychologicznej. Przeczytaj <a href="#/rozdzial/b-psycho">rozdział o badaniach psychotechnicznych</a>.</p>`;
}

function runTest(el, id) {
  const t = TESTS[id];
  const histHTML = () => {
    const hist = store.get().psycho[id] || [];
    return hist.length ? `<ul>${hist.slice(0, 8).map((h) => `<li>${fmtDate(h.date)} – <b>${h.score} ${t.unit}</b> (${grade(id, h.score)})</li>`).join('')}</ul>` : '<p class="muted">Brak wyników.</p>';
  };
  el.innerHTML = `<p class="muted" style="margin:0"><a href="#/psychotesty">🧠 Psychotesty</a></p><h1>${t.icon} ${t.n}</h1><p class="lead">${t.d}</p>
    <div class="ptest" id="pt"></div>
    <h2>Historia</h2><div class="card" id="hist">${histHTML()}</div>`;
  const box = $('#pt', el);
  const done = (score, detail = '') => {
    store.addPsycho(id, { score, detail });
    $('#hist', el).innerHTML = histHTML();
    box.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:40px;font-weight:800">${score} ${t.unit}</div><p>Ocena orientacyjna: <b>${grade(id, score)}</b></p><p class="muted">${esc(detail)}</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="again">🔁 Jeszcze raz</button><a class="btn" href="#/psychotesty">Inne testy</a></div></div>`;
    $('#again', box).onclick = () => runTest(el, id);
  };
  return ({ refleks, wybor, koordynacja, antycypacja, tachistoskop, schulte })[id](box, done);
}

function startScreen(box, cb) {
  box.innerHTML = `<div class="parena"><button class="btn primary" id="go" style="font-size:20px;padding:16px 30px">▶ Start</button></div>`;
  $('#go', box).onclick = cb;
}

function refleks(box, done) {
  let times = [], tId, state = 'idle', t0 = 0;
  startScreen(box, () => {
    box.innerHTML = `<div class="parena" id="ar" style="cursor:pointer"><div style="text-align:center"><div class="lamp" id="lamp"></div><p id="msg" class="muted">Czekaj na zielone… (klik / spacja)</p></div></div>`;
    const lamp = $('#lamp', box), msg = $('#msg', box);
    const arm = () => { state = 'wait'; lamp.style.background = '#552'; tId = setTimeout(() => { state = 'go'; lamp.style.background = '#22d36a'; t0 = performance.now(); }, 1200 + Math.random() * 2800); };
    const hit = () => {
      if (state === 'wait') { clearTimeout(tId); msg.textContent = 'Za wcześnie! Spróbuj jeszcze raz.'; lamp.style.background = '#c0392b'; setTimeout(arm, 900); return; }
      if (state !== 'go') return;
      const rt = Math.round(performance.now() - t0);
      times.push(rt); state = 'idle'; lamp.style.background = '#222';
      msg.textContent = `${rt} ms  (${times.length}/8)`;
      if (times.length >= 8) { off(); const avg = Math.round(times.reduce((a, b) => a + b) / times.length); done(avg, `najlepszy ${Math.min(...times)} ms, najgorszy ${Math.max(...times)} ms`); }
      else setTimeout(arm, 700);
    };
    const key = (e) => { if (e.code === 'Space') { e.preventDefault(); hit(); } };
    const off = () => removeEventListener('keydown', key);
    $('#ar', box).onpointerdown = hit;
    addEventListener('keydown', key);
    arm();
  });
  return () => clearTimeout(tId);
}

function wybor(box, done) {
  let n = 0, ok = 0, rts = [], cur = null, t0 = 0, to;
  let audio;
  const beep = () => { try { audio ||= new AudioContext(); const o = audio.createOscillator(); o.frequency.value = 880; o.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.15); } catch { /* brak dźwięku */ } };
  startScreen(box, () => {
    box.innerHTML = `<div class="parena" style="min-height:260px"><div style="display:flex;gap:40px"><div class="lamp" id="lL"></div><div class="lamp" id="lR"></div></div></div>
      <div class="grid g3" style="margin-top:10px"><button class="bigbtn" style="background:#c0392b;color:#fff" data-r="L">◀ LEWA (A)</button><button class="bigbtn" style="background:#d4a017;color:#000" data-r="N">⎵ NOGA (spacja)</button><button class="bigbtn" style="background:#27ae60;color:#fff" data-r="R">PRAWA (L) ▶</button></div>
      <p class="muted" id="st">0/20</p>`;
    const lL = $('#lL', box), lR = $('#lR', box);
    const next = () => {
      lL.style.background = lR.style.background = '#222';
      if (n >= 20) { off(); return done(Math.round((ok / 20) * 100), `średni czas poprawnej reakcji: ${rts.length ? Math.round(rts.reduce((a, b) => a + b) / rts.length) : '—'} ms`); }
      setTimeout(() => {
        const r = Math.random();
        cur = r < 0.38 ? 'L' : r < 0.76 ? 'R' : 'N';
        const lamp = Math.random() < 0.5 ? lL : lR;
        lamp.style.background = cur === 'L' ? '#ff3030' : cur === 'R' ? '#22d36a' : '#ffc400';
        if (cur === 'N') beep();
        t0 = performance.now();
        to = setTimeout(() => answer(null), 1500);
      }, 500 + Math.random() * 900);
    };
    const answer = (r) => {
      if (!cur) return;
      clearTimeout(to);
      if (r === cur) { ok++; rts.push(performance.now() - t0); }
      cur = null; n++;
      $('#st', box).textContent = `${n}/20 · trafne: ${ok}`;
      next();
    };
    box.onpointerdown = (e) => { const b = e.target.closest('[data-r]'); if (b) { e.preventDefault(); answer(b.dataset.r); } };
    const key = (e) => { const m = { KeyA: 'L', ArrowLeft: 'L', KeyL: 'R', ArrowRight: 'R', Space: 'N' }[e.code]; if (m) { e.preventDefault(); answer(m); } };
    const off = () => removeEventListener('keydown', key);
    addEventListener('keydown', key);
    next();
  });
  return () => clearTimeout(to);
}

function koordynacja(box, done) {
  let raf;
  startScreen(box, () => {
    box.innerHTML = `<div class="parena"><canvas id="cv" width="600" height="400"></canvas></div><p class="muted" id="st">30 s</p>`;
    const cv = $('#cv', box), g = cv.getContext('2d');
    let px = 300, inside = 0, frames = 0, keyDir = 0;
    const t0 = performance.now();
    const roadX = (y, t) => 300 + Math.sin((y + t * 0.12) / 70) * 120 + Math.sin((y + t * 0.12) / 31) * 40;
    const move = (e) => { const r = cv.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width) * 600; };
    cv.onpointermove = move; cv.onpointerdown = move;
    const key = (e) => { if (e.code === 'ArrowLeft') keyDir = -1; if (e.code === 'ArrowRight') keyDir = 1; };
    const keyUp = () => { keyDir = 0; };
    addEventListener('keydown', key); addEventListener('keyup', keyUp);
    const loop = (now) => {
      const t = now - t0;
      px = Math.max(0, Math.min(600, px + keyDir * 6));
      g.fillStyle = '#2f6b33'; g.fillRect(0, 0, 600, 400);
      g.fillStyle = '#555';
      for (let y = 0; y < 400; y += 4) { const x = roadX(400 - y, t); g.fillRect(x - 45, y, 90, 4); }
      g.strokeStyle = '#fff'; g.setLineDash([12, 12]); g.beginPath();
      for (let y = 0; y < 400; y += 4) { const x = roadX(400 - y, t); y ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.setLineDash([]);
      const cx = roadX(400 - 320, t);
      const ok = Math.abs(px - cx) < 45;
      frames++; if (ok) inside++;
      g.fillStyle = ok ? '#ffb300' : '#ff3b3b'; g.beginPath(); g.arc(px, 320, 12, 0, 7); g.fill();
      const left = Math.max(0, 30 - t / 1000);
      $('#st', box).textContent = `${left.toFixed(1)} s · na drodze: ${Math.round((inside / frames) * 100)}%`;
      if (left <= 0) { off(); return done(Math.round((inside / frames) * 100), 'odsetek czasu z punktem na drodze'); }
      raf = requestAnimationFrame(loop);
    };
    const off = () => { removeEventListener('keydown', key); removeEventListener('keyup', keyUp); };
    raf = requestAnimationFrame(loop);
  });
  return () => cancelAnimationFrame(raf);
}

function antycypacja(box, done) {
  let raf;
  const errs = [];
  startScreen(box, () => {
    box.innerHTML = `<div class="parena" style="cursor:pointer" id="ar"><canvas id="cv" width="700" height="220"></canvas></div><p class="muted" id="st">Próba 1/6 – naciśnij (klik/spacja), gdy auto dojedzie do mety</p>`;
    const cv = $('#cv', box), g = cv.getContext('2d');
    let trial = null;
    const start = () => {
      const v = 120 + Math.random() * 220; // px/s
      const tunnel = [250 + Math.random() * 80, 0];
      tunnel[1] = 640;
      trial = { v, tunnel, t0: performance.now(), arrive: (640 - 40) / v * 1000, pressed: false };
      loop(performance.now());
    };
    const loop = (now) => {
      if (!trial) return;
      const t = now - trial.t0;
      const x = 40 + (trial.v * t) / 1000;
      g.fillStyle = '#20262f'; g.fillRect(0, 0, 700, 220);
      g.fillStyle = '#444'; g.fillRect(0, 90, 700, 60);
      g.fillStyle = '#e74c3c'; if (x < trial.tunnel[0]) g.fillRect(x - 30, 100, 60, 40);
      g.fillStyle = '#0d1016'; g.fillRect(trial.tunnel[0], 70, trial.tunnel[1] - trial.tunnel[0] + 20, 100);
      g.fillStyle = '#fff'; g.fillRect(640, 60, 6, 120); g.font = '16px sans-serif'; g.fillText('META', 620, 50);
      if (t > trial.arrive + 1500 && !trial.pressed) { record(1500); return; }
      raf = requestAnimationFrame(loop);
    };
    const record = (err) => {
      errs.push(Math.round(err));
      trial = null;
      $('#st', box).textContent = `Błąd: ${Math.round(err)} ms · próba ${errs.length}/6`;
      if (errs.length >= 6) { off(); return done(Math.round(errs.reduce((a, b) => a + b) / errs.length), `średni błąd; błędy: ${errs.join(', ')} ms`); }
      setTimeout(start, 1200);
    };
    const hit = () => { if (!trial || trial.pressed) return; trial.pressed = true; const t = performance.now() - trial.t0; record(Math.abs(t - trial.arrive)); };
    const key = (e) => { if (e.code === 'Space') { e.preventDefault(); hit(); } };
    const off = () => removeEventListener('keydown', key);
    addEventListener('keydown', key);
    $('#ar', box).onpointerdown = hit;
    start();
  });
  return () => cancelAnimationFrame(raf);
}

function tachistoskop(box, done) {
  let round = 0, good = 0;
  const ICONS = { 'pieszych': '🚶', 'samochodów': '🚗', 'rowerzystów': '🚲', 'znaków': '⚠️' };
  startScreen(box, () => {
    const play = () => {
      if (round >= 5) return done(Math.round((good / 5) * 100), `${good}/5 poprawnych`);
      const counts = Object.fromEntries(Object.keys(ICONS).map((k) => [k, Math.floor(Math.random() * 4) + (k === 'samochodów' ? 1 : 0)]));
      const items = Object.entries(counts).flatMap(([k, n]) => Array.from({ length: n }, () => ICONS[k]));
      box.innerHTML = `<div class="parena" style="position:relative;min-height:300px;background:#3d6b3a">${items.map((i) => `<span style="position:absolute;left:${5 + Math.random() * 85}%;top:${5 + Math.random() * 80}%;font-size:34px">${i}</span>`).join('')}</div>`;
      setTimeout(() => {
        const key = Object.keys(ICONS)[Math.floor(Math.random() * 4)];
        const right = counts[key];
        const opts = [...new Set([right, Math.max(0, right - 1), right + 1, right + 2])].slice(0, 4).sort((a, b) => a - b);
        box.innerHTML = `<div class="card qcard"><p class="qtext">Ile było ${key} ${ICONS[key]}?</p><div class="answers" style="grid-template-columns:repeat(${opts.length},1fr)">${opts.map((o) => `<button class="ans" style="text-align:center;font-size:22px" data-v="${o}">${o}</button>`).join('')}</div></div>`;
        box.onclick = (e) => {
          const b = e.target.closest('[data-v]');
          if (!b) return;
          box.onclick = null;
          const ok = Number(b.dataset.v) === right;
          if (ok) good++;
          b.classList.add(ok ? 'ok' : 'bad');
          round++;
          setTimeout(play, 700);
        };
      }, 1500);
    };
    play();
  });
}

function schulte(box, done) {
  startScreen(box, () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let next = 1;
    const t0 = performance.now();
    box.innerHTML = `<div class="parena"><div class="schulte">${nums.map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div></div><p class="muted" id="st">Szukaj: 1</p>`;
    box.onclick = (e) => {
      const b = e.target.closest('[data-n]');
      if (!b) return;
      if (Number(b.dataset.n) !== next) { b.style.background = '#7a1f1f'; setTimeout(() => { b.style.background = ''; }, 200); return; }
      b.classList.add('done');
      next++;
      $('#st', box).textContent = next <= 25 ? `Szukaj: ${next}` : '';
      if (next > 25) done(Math.round((performance.now() - t0) / 100) / 10, 'czas przejścia 1→25');
    };
  });
}

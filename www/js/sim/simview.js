// Widok: Symulator egzaminu praktycznego – WORD Katowice (ul. Francuska 78).
import { $, $$, esc, kurakSays, toast } from '../ui.js';
import * as store from '../store.js';
import { speak, stopSpeaking } from '../native.js';
import { FLEET, SIM_CATS, briefing } from './vehicles.js';
import { Sim } from './engine.js';
import { createPlac } from './plac.js';
import { createRoad } from './road.js';
import { loadWorld } from './world.js';

let WORLD = null;
const PREF_KEY = 'drogedudei.sim';
const prefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs(), ...p })); } catch { /* brak */ } };

export function simRoute(el, catArg) {
  const pf = prefs();
  let cat = SIM_CATS.includes(catArg) ? catArg : SIM_CATS.includes(store.get().profile.cat) ? store.get().profile.cat : 'B';
  let modelIdx = pf.model?.[cat] ?? 0;
  let view = pf.view || 'top';
  let withPlac = pf.withPlac ?? true;

  const setup = () => {
    const models = FLEET[cat];
    const m = models[Math.min(modelIdx, models.length - 1)];
    const br = briefing(cat);
    el.innerHTML = `<h1>🚦 Symulator egzaminu – WORD Katowice</h1>
    <p class="lead">Plac manewrowy i jazda po prawdziwych ulicach wokół WORD przy ul. Francuskiej 78 (dane mapy © OpenStreetMap): sygnalizacja, ronda Fieldorfa „Nila” i Policji, przejścia z pieszymi, STOP, parkowanie i hamowanie przy pachołku. Polecenia egzaminatora czyta lektor.</p>
    <div class="card">${kurakSays('Najpierw wybierz kategorię i pojazd – takie, jakie stoją w WORD Katowice. Przeczytaj odprawę, a potem: lusterko, kierunkowskaz, manewr!')}</div>
    <h2>1. Kategoria</h2>
    <div class="veh-pick" id="cats">${SIM_CATS.map((k) => `<button class="${k === cat ? 'sel' : ''}" data-cat="${k}"><span>${FLEET[k][0].icon}</span>${k}${FLEET[k][0].word ? '' : '<br><small class="muted">poglądowy</small>'}</button>`).join('')}</div>
    <h2>2. Pojazd egzaminacyjny</h2>
    <div class="grid g2" id="models">${models.map((x, i) => `<button class="card tile" data-m="${i}" style="text-align:left;cursor:pointer;${i === modelIdx ? 'border-color:var(--accent);border-width:2px' : ''}"><span class="tico">${x.icon}</span><div><h3>${esc(x.name)}</h3><p>${esc(x.note || '')}</p><p>${x.word ? '<span class="tag ok">flota WORD Katowice</span>' : '<span class="tag">brak w WORD Katowice – pojazd poglądowy</span>'} <span class="tag">${x.len} × ${x.wid} m${x.trailer ? ` + ${x.trailer.len} m` : ''}</span></p></div></button>`).join('')}</div>
    <p class="muted" style="font-size:13px">Lista pojazdów wg strony WORD Katowice („Pojazdy egzaminacyjne WORD”). Flota może się zmienić – sprawdź przed egzaminem na word.katowice.pl.</p>
    <h2>3. Na co być gotowym – kat. ${esc(cat)}</h2>
    <div class="grid g2">
      <div class="card"><h3 style="margin-top:0">🚧 Plac manewrowy</h3><ul>${br.plac.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3 style="margin-top:0">🏙️ Ruch drogowy (okolice WORD)</h3><ul>${br.road.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3 style="margin-top:0">⛔ Błędy przerywające</h3><ul>${br.errors.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3 style="margin-top:0">🎮 Sterowanie</h3>
        <p><span class="kbd">↑</span>/<span class="kbd">W</span> gaz · <span class="kbd">↓</span>/<span class="kbd">S</span>/<span class="kbd">spacja</span> hamulec · <span class="kbd">←</span><span class="kbd">→</span> kierownica<br>
        <span class="kbd">Q</span>/<span class="kbd">E</span> kierunkowskaz lewy/prawy · <span class="kbd">F</span> awaryjne · <span class="kbd">R</span> bieg D/R · <span class="kbd">H</span> ręczny<br>
        <span class="kbd">C</span> sprzęganie · <span class="kbd">O</span> drzwi (autobus) · <span class="kbd">V</span> widok z góry / zza kierownicy · <span class="kbd">Z</span>/<span class="kbd">X</span> rozglądanie się · <span class="kbd">+</span>/<span class="kbd">−</span> zoom</p>
        <p class="muted">Na telefonie: przyciski na ekranie.</p></div>
    </div>
    <h2>4. Start</h2>
    <div class="card">
      <div class="row"><b>Widok:</b><button class="btn ${view === 'top' ? 'primary' : ''}" data-view="top">🗺️ Z góry</button><button class="btn ${view === 'cab' ? 'primary' : ''}" data-view="cab">🧑‍✈️ Zza kierownicy (3D, wnętrze ${esc(m.name.split(' ')[0])})</button></div>
      <label class="check" style="border:0"><input type="checkbox" id="withPlac" ${withPlac ? 'checked' : ''}><span>Zacznij od placu manewrowego (jak na egzaminie)</span></label>
      <div class="row"><button class="btn primary" id="go" style="font-size:18px">▶ Rozpocznij egzamin</button><button class="btn" id="demo">🐓 Jazda wzorcowa z Kurakiem (demo)</button></div>
      <p class="muted" style="font-size:13px">W trybie demo Kurak sam przejeżdża trasę zgodnie z przepisami: zatrzymuje się na czerwonym i przed STOP, przepuszcza pieszych, sygnalizuje skręty i hamuje przy pachołku. Możesz przełączać widoki.</p>
    </div>
    ${(store.get().sim || []).length ? `<h2>Twoje przejazdy</h2><div class="card"><ul>${store.get().sim.slice(0, 6).map((r) => `<li>${new Date(r.date).toLocaleDateString('pl-PL')} · kat. ${esc(r.cat)} · ${esc(r.model || '')} · <b>${esc(r.result)}</b>${r.reason ? ` – ${esc(r.reason)}` : ''}</li>`).join('')}</ul></div>` : ''}`;
    $('#cats', el).onclick = (e) => { const b = e.target.closest('[data-cat]'); if (b) { cat = b.dataset.cat; modelIdx = prefs().model?.[cat] ?? 0; setup(); } };
    $('#models', el).onclick = (e) => { const b = e.target.closest('[data-m]'); if (b) { modelIdx = Number(b.dataset.m); savePrefs({ model: { ...(prefs().model || {}), [cat]: modelIdx } }); setup(); } };
    el.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => { view = b.dataset.view; savePrefs({ view }); setup(); }; });
    $('#withPlac', el).onchange = (e) => { withPlac = e.target.checked; savePrefs({ withPlac }); };
    $('#go', el).onclick = () => run(m);
    $('#demo', el).onclick = () => run(m, true);
  };

  let sim = null, cockpit = null, cleanupFns = [];
  const cleanup = () => { sim?.stop(); cockpit?.dispose(); cockpit = null; cleanupFns.forEach((f) => f()); cleanupFns = []; stopSpeaking(); document.body.style.overflow = ''; };

  const run = async (model, demo = false) => {
    el.innerHTML = `<div class="row spread" style="margin-bottom:8px"><h1 style="font-size:20px;margin:0">${model.icon} Kat. ${esc(cat)} – ${esc(model.name)}</h1>
      <div class="row"><button class="btn" id="vBtn">🎥 Widok</button><button class="btn" id="fsBtn">⛶</button><button class="btn red" id="stopBtn">✕ Przerwij</button></div></div>
      <div class="sim-wrap" id="wrap"><canvas id="cv" aria-label="Symulator jazdy"></canvas>
        <div class="sim-hud" id="hud"></div><div class="sim-msg" id="msg" hidden></div>
        <button class="sim-exit" id="exitFs" aria-label="Zamknij pełny ekran">⤡</button>
        <div class="sim-ctrl touch-only" id="ctrl">
          <div class="grp"><button data-t="left" aria-label="Kierownica w lewo">⟲</button><button data-t="right" aria-label="Kierownica w prawo">⟳</button></div>
          <div class="grp"><button class="pedal" data-t="brake" aria-label="Hamulec">⏹</button><button class="pedal" data-t="gas" aria-label="Gaz">⏫</button></div>
          <div class="grp side"><button data-k="KeyQ" aria-label="Kierunkowskaz lewy">◀</button><button data-k="KeyE" aria-label="Kierunkowskaz prawy">▶</button><button data-k="KeyF" aria-label="Światła awaryjne">⚠</button><button data-k="KeyR" aria-label="Bieg D/R">R/D</button><button data-k="KeyH" aria-label="Hamulec ręczny">(P)</button>${model.trailer ? '<button data-k="KeyC" aria-label="Sprzęgnij">C</button>' : ''}${model.kind === 'bus' ? '<button data-k="KeyO" aria-label="Drzwi">🚪</button>' : ''}<button data-k="KeyV" aria-label="Zmień widok">🎥</button></div>
        </div></div>
      <p class="muted" style="font-size:13px;margin-top:6px">Dane mapy © OpenStreetMap contributors (ODbL). Symulacja edukacyjna – nie odwzorowuje dokładnie organizacji ruchu i tras egzaminacyjnych WORD.</p>`;
    const cv = $('#cv', el), wrap = $('#wrap', el);
    const msgEl = $('#msg', el), hudEl = $('#hud', el);
    let msgT;
    const voice = store.get().profile.voice;
    sim = new Sim(cv, cat, {
      model,
      speak: (t) => voice && speak(t),
      onMsg: (t, cls) => { msgEl.hidden = false; msgEl.textContent = t; msgEl.className = 'sim-msg ' + (cls || ''); clearTimeout(msgT); msgT = setTimeout(() => { msgEl.hidden = true; }, cls === 'err' ? 6000 : 4200); },
      onHUD: (h) => {
        hudEl.innerHTML = `<span class="pill">⏱️ ${h.kmh} km/h</span>${h.limit ? `<span class="pill">🚫 ${h.limit}</span>` : ''}${h.nextLimit ? `<span class="pill">⚠️ limit ${h.nextLimit}</span>` : ''}<span class="pill">⚙️ ${h.gear}</span>
          ${h.blink ? `<span class="pill">${h.blink === 'L' ? '◀ lewy' : h.blink === 'R' ? 'prawy ▶' : '⚠ awaryjne'}</span>` : ''}${h.hand ? '<span class="pill">(P) ręczny</span>' : ''}${h.doors ? '<span class="pill">🚪 otwarte</span>' : ''}
          <span class="pill">📍 ${esc(h.stage)}${h.street ? ' · ul. ' + esc(h.street) : ''}</span>${h.task ? `<span class="pill">🎯 ${esc(h.task)}</span>` : ''}
          ${h.light ? `<span class="pill">🚦 ${{ g: '🟢', y: '🟡', r: '🔴', ry: '🔴🟡' }[h.light]} ${h.lightDist} m</span>` : ''}${h.progress != null ? `<span class="pill">🏁 ${h.progress}%</span>` : ''}<span class="pill">⚠️ ${h.faults}</span>`;
      },
      ask: (q, opts, cb) => {
        const box = document.createElement('div');
        box.className = 'card';
        box.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:min(92%,560px);z-index:5';
        box.innerHTML = `<p class="qtext" style="margin-top:0">🎙️ ${esc(q)}</p><div class="answers">${opts.map((o, i) => `<button class="ans" data-i="${i}"><b>${'ABC'[i]}</b>${esc(o)}</button>`).join('')}</div>`;
        wrap.append(box);
        box.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; box.remove(); cb(Number(b.dataset.i)); };
      },
      onEnd: (r) => result(r, model),
    });
    const stageTo = async (stage) => {
      sim.stage = stage;
      if (cockpit) { cockpit.dispose(); cockpit = null; sim.cockpit = null; setView(true); }
    };
    const setView = (cab) => {
      if (cab && !cockpit) {
        import('./cockpit.js').then(({ Cockpit }) => {
          cockpit = new Cockpit(wrap, sim, sim.stage?.route ? WORLD : null);
          // HUD/komunikaty nad sceną 3D
          wrap.append(hudEl, msgEl, $('#ctrl', el), $('#exitFs', el));
          sim.cockpit = cockpit; cv.style.visibility = 'hidden';
        }).catch((e) => { console.error(e); toast('Widok 3D niedostępny na tym urządzeniu'); });
      } else if (!cab && cockpit) { cockpit.dispose(); cockpit = null; sim.cockpit = null; cv.style.visibility = ''; }
      view = cab ? 'cab' : 'top';
    };
    const resize = () => { sim.resize(); cockpit?.resize(); };
    addEventListener('resize', resize); cleanupFns.push(() => removeEventListener('resize', resize));
    sim.resize();
    window.__sim = sim; // do testów i debugowania

    // klawiatura
    const kd = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      sim.keys.add(e.code);
      if (e.code === 'KeyQ') sim.toggleBlink('L');
      if (e.code === 'KeyE') sim.toggleBlink('R');
      if (e.code === 'KeyF') sim.toggleBlink('H');
      if (e.code === 'KeyR') sim.toggleGear();
      if (e.code === 'KeyH') sim.car.hand = !sim.car.hand;
      if (e.code === 'KeyV') setView(view !== 'cab');
      if (e.code === 'Equal' || e.code === 'NumpadAdd') sim.zoom = Math.min(16, sim.zoom * 1.15);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') sim.zoom = Math.max(2.5, sim.zoom / 1.15);
      if (e.code === 'KeyN') sim.northUp = !sim.northUp;
      sim.stage?.key?.(e.code);
    };
    const ku = (e) => sim.keys.delete(e.code);
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    cleanupFns.push(() => { removeEventListener('keydown', kd); removeEventListener('keyup', ku); });
    // rozglądanie się (Z/X)
    const lookLoop = setInterval(() => {
      if (!cockpit) return;
      const t = (sim.keys.has('KeyZ') ? -1.2 : 0) + (sim.keys.has('KeyX') ? 1.2 : 0);
      cockpit.look += (t - cockpit.look) * 0.25;
    }, 30);
    cleanupFns.push(() => clearInterval(lookLoop));
    // dotyk
    const ctrl = $('#ctrl', el);
    ctrl.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      if (b.dataset.t) { sim.touch[b.dataset.t] = 1; b.classList.add('on'); b.setPointerCapture(e.pointerId); }
      if (b.dataset.k) kd({ code: b.dataset.k, preventDefault() {}, repeat: false }), sim.keys.delete(b.dataset.k);
    });
    const up = (e) => { const b = e.target.closest('button'); if (b?.dataset.t) { sim.touch[b.dataset.t] = 0; b.classList.remove('on'); } };
    ctrl.addEventListener('pointerup', up); ctrl.addEventListener('pointercancel', up);
    $('#vBtn', el).onclick = () => setView(view !== 'cab');
    $('#fsBtn', el).onclick = $('#exitFs', el).onclick = () => { wrap.classList.toggle('full'); document.body.style.overflow = wrap.classList.contains('full') ? 'hidden' : ''; setTimeout(resize, 50); };
    $('#stopBtn', el).onclick = () => { if (confirm('Przerwać egzamin?')) { sim.fault('Egzamin przerwany przez zdającego', true); } };

    // etapy
    const startRoad = async () => {
      if (!WORLD) { sim.msg('Ładowanie mapy Katowic…'); WORLD = await loadWorld(); }
      await stageTo(createRoad(sim, WORLD, () => {}));
    };
    if (demo) {
      await startRoad();
      const { Autopilot } = await import('./autopilot.js');
      sim.autopilot = new Autopilot(sim);
      sim.demo = true;
      $('#ctrl', el).hidden = true;
    } else if (withPlac) {
      const plac = createPlac(sim, async (tasks) => {
        if (tasks.some((t) => t.status === 'fail')) return;
        sim.msg('✅ Plac zaliczony. Teraz jazda w ruchu drogowym.', '', true);
        setTimeout(startRoad, 1500);
      });
      await stageTo(plac);
      plac.begin();
    } else await startRoad();
    sim.start();
    if (view === 'cab') setView(true);
  };

  const result = (r, model) => {
    const ok = r.result === 'pozytywny';
    const wasDemo = !!sim?.demo;
    if (!wasDemo) store.addSim({ cat, model: model.name, result: r.result, reason: r.reason, faults: r.faults.map((f) => f.msg) });
    cleanup();
    el.innerHTML = `<h1>${ok ? '✅ Wynik pozytywny' : '❌ Wynik negatywny'}</h1>
      <div class="card">${kurakSays(ok ? 'Ko-ko-gratulacje! Tak samo spokojnie pojedziesz na egzaminie. Powtórz trasę w drugim widoku.' : `Egzamin przerwany: ${r.reason || 'błędy w zadaniach'}. Nie przejmuj się – każdy błąd tutaj to jeden mniej na prawdziwym egzaminie.`, { mood: ok ? 'happy' : 'sad' })}</div>
      <div class="grid g2" style="margin-top:12px">
        <div class="card"><h3 style="margin-top:0">Podsumowanie</h3><p>Kategoria <b>${esc(cat)}</b> · ${esc(model.name)}<br>Czas: ${Math.floor(r.time / 60)} min ${Math.round(r.time % 60)} s · dystans ${(r.dist / 1000).toFixed(2)} km</p>
          ${r.tasks.length ? `<ul>${r.tasks.map((t) => `<li>${t.status === 'ok' ? '✅' : t.status === 'fail' ? '❌' : '⏸️'} ${esc(t.n)}${t.tries ? ` (nieudane próby: ${t.tries})` : ''}</li>`).join('')}</ul>` : ''}</div>
        <div class="card"><h3 style="margin-top:0">Uwagi egzaminatora (${r.faults.length})</h3>${r.faults.length ? `<ul>${r.faults.map((f) => `<li>${f.crit ? '⛔' : '⚠️'} ${esc(f.msg)} <span class="muted">(${Math.floor(f.t / 60)}:${String(Math.floor(f.t % 60)).padStart(2, '0')})</span></li>`).join('')}</ul>` : '<p>Brak uwag – świetna jazda!</p>'}</div>
      </div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="again">🔁 Jeszcze raz</button><a class="btn" href="#/rozdzial/p-miasto">📖 Parkowanie i koperta</a><a class="btn" href="#/rozdzial/p-egzamin">📖 Egzamin praktyczny</a></div>`;
    $('#again', el).onclick = setup;
    if (!wasDemo) toast(ok ? '+60 XP' : '+20 XP');
  };

  setup();
  return cleanup;
}

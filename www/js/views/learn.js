// Podręcznik, rozdział, atlas znaków, fiszki, mapy, kategorie.
import { $, $$, esc, md, renderBlocks, bindScenes, bindSignCards, signCard, kurakSays, toast, sceneFigure } from '../ui.js';
import * as store from '../store.js';
import { PARTS, CHAPTERS, chapterById, CATEGORIES } from '../content/book.js';
import { questionsFor } from '../content/questions.js';
import { SIGNS, MARKINGS, SIGN_GROUPS, signSVG } from '../signs.js';
import { SCENES } from '../scenes.js';
import { speak, stopSpeaking } from '../native.js';

export function book(el) {
  const s = store.get();
  const cat = s.profile.cat;
  el.innerHTML = `<h1>📚 Podręcznik</h1><p class="lead">Kompletny kurs jak w książce: ${CHAPTERS.length} rozdziałów z ilustracjami, schematami skrzyżowań i ćwiczeniami. Rozdziały dla Twojej kategorii (${esc(cat)}) są wyróżnione.</p>
  ${PARTS.map((p) => {
    const done = p.chapters.filter((c) => s.chapters[c.id]?.read).length;
    return `<h2>${p.icon} ${esc(p.title)} <span class="tag">${done}/${p.chapters.length}</span></h2><p class="muted" style="margin-top:-4px">${esc(p.desc)}</p>
    <div class="grid g2">${p.chapters.map((c, i) => {
      const st = s.chapters[c.id] || {};
      const mine = c.cats.includes('all') || c.cats.includes(cat);
      return `<a class="card tile" href="#/rozdzial/${c.id}" style="${mine ? '' : 'opacity:.6'}"><span class="tico">${c.icon}</span><div style="flex:1"><h3>${i + 1}. ${esc(c.title)}</h3>
        <p>${st.read ? '✅ przeczytany' : 'do przeczytania'}${st.best != null ? ` · ćwiczenia: ${st.best}%` : ''}${c.cats.includes('all') ? '' : ` · kat. ${c.cats.join(', ')}`}</p></div></a>`;
    }).join('')}</div>`;
  }).join('')}`;
}

export function chapter(el, id) {
  const c = chapterById(id) || CHAPTERS[0];
  const idx = CHAPTERS.indexOf(CHAPTERS.find((x) => x.id === c.id));
  const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
  const nq = questionsFor(c.id).length;
  const part = PARTS.find((p) => p.id === c.part);
  const read = store.get().chapters[c.id]?.read;
  el.innerHTML = `<article class="chapter">
    <p class="muted" style="margin:0"><a href="#/podrecznik">📚 Podręcznik</a> › ${esc(part.title)}</p>
    <h1>${c.icon} ${esc(c.title)}</h1>
    <p class="lead">${md(c.lead)}</p>
    <div class="row"><button class="btn" id="readAloud">🔊 Czytaj rozdział</button>${nq ? `<a class="btn" href="#/quiz/rozdzial/${c.id}">🧩 Ćwiczenia (${nq})</a>` : ''}</div>
    ${renderBlocks(c.blocks)}
    <div class="card" style="margin-top:24px">${kurakSays(read ? 'Ten rozdział masz już za sobą. Zrób ćwiczenia – utrwalisz wiedzę na dłużej!' : 'Przeczytane? Zaznacz rozdział i od razu sprawdź się w ćwiczeniach.')}
      <div class="row" style="margin-top:12px">${read ? '<span class="tag ok">✔ Przeczytany</span>' : '<button class="btn primary" id="markRead">✔ Przeczytane (+10 XP)</button>'}
      ${nq ? `<a class="btn" href="#/quiz/rozdzial/${c.id}">🧩 Ćwiczenia do rozdziału</a>` : ''}</div></div>
    <div class="row spread" style="margin-top:16px">${prev ? `<a class="btn ghost" href="#/rozdzial/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn ghost" href="#/rozdzial/${next.id}">${esc(next.title)} →</a>` : ''}</div>
  </article>`;
  const ct = $('#catTable', el);
  if (ct) ct.innerHTML = categoriesTable();
  bindScenes(el);
  bindSignCards(el);
  $('#markRead', el)?.addEventListener('click', () => { store.markRead(c.id); toast('+10 XP · rozdział zaliczony'); chapter(el, c.id); });
  let reading = false;
  $('#readAloud', el).onclick = () => {
    if (reading) { stopSpeaking(); reading = false; return; }
    reading = true;
    const text = [c.title, c.lead, ...$$('p, li, dt, dd, td', el).slice(0, 80).map((n) => n.textContent)].join('. ');
    speak(text.slice(0, 3800));
  };
  return () => stopSpeaking();
}

function categoriesTable() {
  return `<div class="tbl-wrap"><table><thead><tr><th>Kat.</th><th>Wiek</th><th>Pojazdy</th><th>Szkolenie</th><th>Badania</th></tr></thead><tbody>
  ${CATEGORIES.map((c) => `<tr><td><b>${c.icon} ${c.k}</b></td><td>${esc(c.age)}</td><td>${esc(c.what)}</td><td>${esc(c.course)}</td><td>${esc(c.med)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function categories(el) {
  const cur = store.get().profile.cat;
  el.innerHTML = `<h1>🪪 Kategorie prawa jazdy</h1><p class="lead">Wiek, uprawnienia, szkolenie i zadania na placu manewrowym. Wybierz swoją – egzamin próbny i symulator dopasują się do niej.</p>
  ${categoriesTable()}
  <h2>Zadania egzaminacyjne na placu</h2>
  <div class="grid g2">${CATEGORIES.map((c) => `<div class="card"><div class="row spread"><h3 style="margin:0">${c.icon} Kategoria ${c.k}</h3>${c.k === cur ? '<span class="tag ok">Twoja</span>' : `<button class="btn" data-cat="${c.k}">Wybierz</button>`}</div>
    <ul>${c.plac.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><a class="btn" href="#/symulator/${encodeURIComponent(c.k)}">🚦 Symulator – kat. ${c.k}</a></div>`).join('')}</div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    store.setProfile({ cat: b.dataset.cat });
    toast(`Kategoria: ${b.dataset.cat}`);
    categories(el);
  });
}

export function signs(el, group = 'A') {
  el.innerHTML = `<h1>🚸 Atlas znaków</h1><p class="lead">Kliknij znak, aby zobaczyć opis i posłuchać lektora. Ilustracje są stylizowane – wierne kształtem, kolorem i znaczeniem.</p>
  <div class="row" id="grp">${SIGN_GROUPS.map((g) => `<button class="btn ${g.g === group ? 'primary' : ''}" data-g="${g.g}">${g.n}</button>`).join('')}</div>
  <div id="sg"></div>`;
  const draw = (g) => {
    const info = SIGN_GROUPS.find((x) => x.g === g);
    const list = g === 'P' ? MARKINGS.map((m) => m.c) : SIGNS.filter((s) => s.g === g).map((s) => s.c);
    $('#sg', el).innerHTML = `<div class="callout tip">${esc(info.d)}</div><div class="signs">${list.map((c) => signCard(c, 96)).join('')}</div>
      <div class="row"><a class="btn" href="#/fiszki/${g}">🃏 Fiszki z tej grupy</a></div>`;
    $$('#grp .btn', el).forEach((b) => b.classList.toggle('primary', b.dataset.g === g));
  };
  $('#grp', el).onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) { location.hash = `#/znaki/${b.dataset.g}`; } };
  draw(SIGN_GROUPS.some((g) => g.g === group) ? group : 'A');
  bindSignCards(el);
}

export function flash(el, group = 'all') {
  const pool = (group === 'all' ? SIGNS : SIGNS.filter((s) => s.g === group)).slice();
  const srs = store.get().srs;
  pool.sort((a, b) => (srs['sign:' + a.c]?.box || 0) - (srs['sign:' + b.c]?.box || 0) || Math.random() - 0.5);
  let i = 0, known = 0, seen = 0;
  el.innerHTML = `<h1>🃏 Fiszki znaków</h1><p class="lead">Spójrz na znak, przypomnij sobie nazwę i znaczenie, odwróć kartę. Znaki „jeszcze nie” wracają częściej.</p>
    <div class="row" style="margin-bottom:10px">${['all', 'A', 'B', 'C', 'D', 'S'].map((g) => `<a class="btn ${g === group ? 'primary' : ''}" href="#/fiszki/${g}">${g === 'all' ? 'Wszystkie' : g}</a>`).join('')}</div>
    <div class="card qcard" id="fc" style="text-align:center"></div>`;
  const show = (flipped = false) => {
    const s = pool[i % pool.length];
    $('#fc', el).innerHTML = `<div class="muted">Karta ${seen + 1} · znam: ${known}</div><div style="margin:12px 0">${signSVG(s.c, 180)}</div>
      ${flipped ? `<h2 style="margin:6px 0">${esc(s.c)} – ${esc(s.n)}</h2><p>${esc(s.m)}</p>
        <div class="row" style="justify-content:center"><button class="btn red" data-k="0">🔁 Jeszcze nie</button><button class="btn primary" data-k="1">✔ Umiem</button></div>`
      : '<button class="btn primary" data-flip>Odwróć kartę</button>'}`;
    if (flipped && store.get().profile.voice) speak(s.n);
  };
  $('#fc', el).onclick = (e) => {
    if (e.target.closest('[data-flip]')) return show(true);
    const k = e.target.closest('[data-k]');
    if (!k) return;
    const ok = k.dataset.k === '1';
    store.answer('sign:' + pool[i % pool.length].c, ok);
    if (ok) known++;
    seen++; i++;
    if (seen === 10) { store.addXP(5, 'flash'); toast('Krąg: fiszki zaliczone ✔'); }
    show(false);
  };
  show(false);
}

const WORDS = [
  ['Katowice (ul. Francuska 78)', 50.2432, 19.0253, true], ['Warszawa', 52.2297, 21.0122], ['Kraków', 50.0647, 19.945], ['Wrocław', 51.1079, 17.0385], ['Poznań', 52.4064, 16.9252], ['Gdańsk', 54.352, 18.6466], ['Łódź', 51.7592, 19.456], ['Szczecin', 53.4285, 14.5528], ['Lublin', 51.2465, 22.5684], ['Białystok', 53.1325, 23.1688], ['Rzeszów', 50.0412, 21.9991], ['Kielce', 50.8661, 20.6286], ['Olsztyn', 53.7784, 20.4801], ['Opole', 50.6751, 17.9213], ['Bydgoszcz', 53.1235, 18.0084], ['Toruń', 53.0138, 18.5984], ['Zielona Góra', 51.9356, 15.5062], ['Gorzów Wlkp.', 52.7368, 15.2288], ['Bielsko-Biała', 49.8224, 19.0584], ['Częstochowa', 50.8118, 19.1203], ['Rybnik', 50.0971, 18.5463], ['Koszalin', 54.1944, 16.1722], ['Słupsk', 54.4641, 17.0287], ['Elbląg', 54.1561, 19.4045], ['Tarnów', 50.0121, 20.9858], ['Nowy Sącz', 49.6218, 20.697], ['Radom', 51.4027, 21.1471], ['Płock', 52.5468, 19.7064], ['Kalisz', 51.7611, 18.091], ['Konin', 52.223, 18.2511], ['Legnica', 51.207, 16.1553], ['Wałbrzych', 50.7714, 16.2843], ['Jelenia Góra', 50.9044, 15.7194], ['Piotrków Tryb.', 51.4052, 19.703], ['Skierniewice', 51.9547, 20.1583], ['Sieradz', 51.5955, 18.7306], ['Siedlce', 52.1676, 22.2902], ['Ostrołęka', 53.0846, 21.5686], ['Ciechanów', 52.8812, 20.62], ['Łomża', 53.1781, 22.059], ['Suwałki', 54.1118, 22.9309], ['Chełm', 51.1431, 23.4716], ['Zamość', 50.7231, 23.252], ['Biała Podlaska', 52.0325, 23.1149], ['Krosno', 49.6887, 21.7706], ['Przemyśl', 49.7838, 22.7678], ['Tarnobrzeg', 50.573, 21.6794], ['Włocławek', 52.6483, 19.0677], ['Leszno', 51.8406, 16.5749], ['Piła', 53.151, 16.738],
];

export function maps(el) {
  el.innerHTML = `<h1>🗺️ Mapy i skrzyżowania</h1><p class="lead">Interaktywne schematy z animacją przejazdu oraz mapa ośrodków egzaminacyjnych (WORD).</p>
  <div class="card">${kurakSays('Najpierw sam odpowiedz, kto jedzie pierwszy – dopiero potem kliknij „Odtwórz przejazd”.')}</div>
  <h2>Schematy skrzyżowań</h2>
  <div class="grid g2">${Object.keys(SCENES).map((k) => sceneFigure(k)).join('')}</div>
  <h2>Ośrodki egzaminacyjne WORD</h2>
  <p class="muted">Katowice – dokładna lokalizacja; pozostałe miasta oznaczone orientacyjnie (centrum miasta) – sprawdź adres na stronie swojego WORD. Pod mapą: trasa symulatora.</p>
  <div id="wordMap" role="application" aria-label="Mapa ośrodków WORD"></div>
  <div class="row" style="margin-top:10px"><button class="btn" id="locate">📍 Najbliższy WORD</button><a class="btn primary" href="#/symulator">🚦 Symulator jazdy – Katowice</a></div>
  <p class="muted" style="font-size:13px">Mapa © OpenStreetMap contributors.</p>`;
  bindScenes(el);
  let map;
  const init = () => {
    if (!window.L) return setTimeout(init, 100);
    map = L.map($('#wordMap', el)).setView([52.0, 19.3], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    for (const [n, la, lo, exact] of WORDS) {
      L.circleMarker([la, lo], { radius: exact ? 10 : 6, color: exact ? '#e1172b' : '#1d5bbf', fillOpacity: 0.85 }).addTo(map)
        .bindPopup(`<b>WORD ${esc(n)}</b>${exact ? '<br><a href="#/symulator">Symulator trasy egzaminacyjnej ▶</a>' : '<br><small>lokalizacja orientacyjna</small>'}`);
    }
  };
  init();
  $('#locate', el).onclick = () => {
    if (!navigator.geolocation) return toast('Brak geolokalizacji');
    navigator.geolocation.getCurrentPosition((p) => {
      const { latitude: a, longitude: b } = p.coords;
      const best = WORDS.map((w) => [w, Math.hypot(w[1] - a, (w[2] - b) * Math.cos((a * Math.PI) / 180))]).sort((x, y) => x[1] - y[1])[0][0];
      map?.setView([best[1], best[2]], 11);
      toast(`Najbliżej: WORD ${best[0]}`);
    }, () => toast('Nie udało się ustalić położenia'));
  };
  return () => map?.remove();
}

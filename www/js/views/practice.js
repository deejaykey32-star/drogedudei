// Praktyka: checklisty placu, ćwiczenia kolejności czynności, dziennik jazd. Zdrowie: badania, kalkulator terminów.
import { $, $$, esc, kurakSays, toast, fmtDate } from '../ui.js';
import * as store from '../store.js';
import { CATEGORIES, PARTS } from '../content/book.js';
import { shuffle } from '../content/questions.js';

const ORDERS = [
  { t: 'Przygotowanie do jazdy', s: ['Ustaw fotel (odległość i oparcie)', 'Ustaw zagłówek', 'Ustaw lusterka', 'Zapnij pas bezpieczeństwa', 'Sprawdź luz i hamulec postojowy', 'Uruchom silnik'] },
  { t: 'Zmiana pasa ruchu', s: ['Spójrz w lusterko wsteczne', 'Spójrz w lusterko boczne', 'Włącz kierunkowskaz', 'Sprawdź martwe pole (rzut oka przez ramię)', 'Płynnie zmień pas', 'Wyłącz kierunkowskaz'] },
  { t: 'Pierwsza pomoc – nieprzytomny poszkodowany', s: ['Oceń bezpieczeństwo miejsca', 'Sprawdź przytomność', 'Udrożnij drogi oddechowe', 'Oceń oddech (do 10 s)', 'Wezwij pomoc – 112', 'Rozpocznij RKO 30:2 lub ułóż w pozycji bocznej'] },
  { t: 'Ruszanie na wzniesieniu', s: ['Zaciągnij hamulec postojowy', 'Wciśnij sprzęgło i wrzuć 1. bieg', 'Dodaj gazu', 'Puść sprzęgło do punktu złapania', 'Zwolnij hamulec postojowy', 'Płynnie ruszaj'] },
  { t: 'Awaria na autostradzie', s: ['Zjedź na pas awaryjny', 'Włącz światła awaryjne', 'Załóż kamizelkę odblaskową', 'Wyprowadź pasażerów za barierę', 'Ustaw trójkąt ok. 100 m za pojazdem', 'Wezwij pomoc'] },
  { t: 'Parkowanie równoległe (koperta)', s: ['Włącz kierunkowskaz i zatrzymaj się obok auta przed miejscem', 'Wrzuć wsteczny i obejrzyj się', 'Cofaj ze skrętem w stronę krawężnika', 'Wyprostuj koła przy ok. 45°', 'Skręć w przeciwną stronę, gdy przód minie auto przed tobą', 'Wyrównaj i ustaw równe odstępy'] },
];

export function practice(el) {
  const s = store.get();
  const cat = CATEGORIES.find((c) => c.k === s.profile.cat) || CATEGORIES[5];
  const checks = s.practice.checks;
  const items = [...cat.plac, 'Parkowanie prostopadłe', 'Parkowanie równoległe (koperta)', 'Zawracanie na skrzyżowaniu / „na trzy razy”', 'Rondo z kilkoma pasami', 'Skrzyżowanie z sygnalizacją i zieloną strzałką', 'Przejazd przez przejście z pieszymi', 'Hamowanie do zatrzymania w wyznaczonym miejscu', 'Jazda po zmroku', 'Jazda drogą ekspresową / autostradą'];
  const log = s.practice.log;
  const hours = log.reduce((a, r) => a + Number(r.h || 0), 0);
  el.innerHTML = `<h1>🚗 Plac i jazdy</h1><p class="lead">Lista umiejętności dla kat. <b>${esc(cat.k)}</b>, ćwiczenia kolejności czynności i dziennik jazd z instruktorem.</p>
  <div class="card">${kurakSays('Odhaczaj zadanie dopiero wtedy, gdy zrobisz je 3 razy z rzędu bez błędu. Uczciwie – egzaminator nie będzie miał litości!')}</div>
  <div class="row" style="margin-top:12px"><a class="btn primary" href="#/symulator/${encodeURIComponent(cat.k)}">🚦 Ćwicz w symulatorze (Katowice)</a><a class="btn" href="#/rozdzial/p-plac">📖 Rozdział: plac manewrowy</a><a class="btn" href="#/rozdzial/p-miasto">📖 Parkowanie i koperta</a></div>
  <h2>✅ Umiejętności (${items.filter((i) => checks[cat.k + ':' + i]).length}/${items.length})</h2>
  <div class="card" id="chk">${items.map((i) => `<label class="check"><input type="checkbox" data-k="${esc(cat.k + ':' + i)}" ${checks[cat.k + ':' + i] ? 'checked' : ''}><span>${esc(i)}</span></label>`).join('')}</div>
  <h2>🔢 Ułóż w kolejności</h2>
  <div class="grid g2" id="orders">${ORDERS.map((o, k) => `<div class="card" data-o="${k}"></div>`).join('')}</div>
  <h2>📒 Dziennik jazd <span class="tag">${hours.toFixed(1)} h</span></h2>
  <div class="card"><div class="grid g3">
    <label class="f">Data<input type="date" id="lDate" value="${store.today()}"></label>
    <label class="f">Godziny<input type="number" id="lH" min="0.5" max="8" step="0.5" value="2"></label>
    <label class="f">Co ćwiczone<input id="lWhat" placeholder="np. rondo, koperta, łuk" maxlength="80"></label></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="lAdd">+ Dodaj jazdę</button></div>
    <ul id="lList">${log.map((r, k) => `<li>${esc(fmtDate(r.d))} · ${r.h} h · ${esc(r.w)} <button class="btn ghost" data-del="${k}" aria-label="Usuń">✕</button></li>`).join('')}</ul>
    <p class="muted">Kurs kat. B obejmuje min. 30 h jazd. Dodatkowe godziny przed egzaminem to najlepsza inwestycja.</p></div>`;

  $('#chk', el).onchange = (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    s.practice.checks[k] = e.target.checked;
    store.save();
    if (e.target.checked) store.addXP(5, 'practice');
  };
  $$('#orders [data-o]', el).forEach((box) => orderExercise(box, ORDERS[Number(box.dataset.o)]));
  $('#lAdd', el).onclick = () => {
    s.practice.log.unshift({ d: $('#lDate', el).value || store.today(), h: Number($('#lH', el).value) || 1, w: $('#lWhat', el).value.trim() || 'jazda' });
    store.addXP(5, 'log');
    practice(el);
  };
  $('#lList', el).onclick = (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    s.practice.log.splice(Number(b.dataset.del), 1);
    store.save();
    practice(el);
  };
}

function orderExercise(box, o) {
  let cur = shuffle(o.s);
  const draw = (checked) => {
    box.innerHTML = `<h3 style="margin-top:0">${esc(o.t)}</h3><ol class="order-list">${cur.map((x, i) => {
      const st = checked ? (x === o.s[i] ? 'style="border-color:var(--ok)"' : 'style="border-color:var(--bad)"') : '';
      return `<li ${st}><span class="num">${i + 1}</span><span class="grow">${esc(x)}</span><button data-up="${i}" aria-label="W górę" ${i === 0 ? 'disabled' : ''}>▲</button><button data-dn="${i}" aria-label="W dół" ${i === cur.length - 1 ? 'disabled' : ''}>▼</button></li>`;
    }).join('')}</ol><div class="row"><button class="btn primary" data-check>Sprawdź</button><button class="btn" data-mix>Wymieszaj</button></div>`;
  };
  box.onclick = (e) => {
    const u = e.target.closest('[data-up]'), d = e.target.closest('[data-dn]');
    if (u) { const i = Number(u.dataset.up); [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; draw(false); }
    if (d) { const i = Number(d.dataset.dn); [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]]; draw(false); }
    if (e.target.closest('[data-mix]')) { cur = shuffle(o.s); draw(false); }
    if (e.target.closest('[data-check]')) {
      const ok = cur.every((x, i) => x === o.s[i]);
      draw(true);
      toast(ok ? '✅ Idealnie! +5 XP' : '❌ Jeszcze nie – zielone są na swoim miejscu');
      if (ok) store.addXP(5, 'order');
    }
  };
  draw(false);
}

export function health(el) {
  const part = PARTS.find((p) => p.id === 'zdrowie');
  el.innerHTML = `<h1>🩺 Lekarz, kierowcy zawodowi, taxi i Uber</h1>
  <p class="lead">Kto i kiedy musi się badać, jak przygotować się do badań lekarskich i psychotechnicznych, wymagania dla taksówkarzy i kierowców aplikacji (Uber, Bolt, FreeNow) oraz porady zdrowotne.</p>
  <div class="card">${kurakSays('Kierowcy zawodowi, taksówkarze i kierowcy z aplikacji: badania lekarskie i psychologiczne co 5 lat, a po 60. urodzinach co 30 miesięcy. Policz poniżej, kiedy masz kolejne!')}</div>
  <div class="grid g2" style="margin-top:12px">${part.chapters.map((c) => `<a class="card tile" href="#/rozdzial/${c.id}"><span class="tico">${c.icon}</span><div><h3>${esc(c.title)}</h3><p>${esc(c.lead)}</p></div></a>`).join('')}
    <a class="card tile" href="#/psychotesty"><span class="tico">🧠</span><div><h3>Trening psychotestów</h3><p>6 testów jak w pracowni psychologii transportu.</p></div></a></div>
  <h2>🗓️ Kalkulator terminu badań</h2>
  <div class="card"><div class="grid g3">
    <label class="f">Data urodzenia<input type="date" id="hBirth"></label>
    <label class="f">Data ostatniego badania<input type="date" id="hLast"></label>
    <label class="f">Rodzaj pracy<select id="hKind"><option value="zaw">Kierowca zawodowy C/D</option><option value="taxi">Taxi / przewóz osób (Uber, Bolt, FreeNow)</option><option value="upr">Pojazd uprzywilejowany / wartości pieniężne</option><option value="instr">Instruktor / egzaminator</option></select></label></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="hCalc">Oblicz</button></div><div id="hOut"></div></div>
  <h2>🧾 Lista do zabrania na badania</h2>
  <div class="card">${['Dowód osobisty', 'Okulary / soczewki i ich parametry', 'Dokumentacja chorób przewlekłych (cukrzyca, nadciśnienie, padaczka, choroby serca)', 'Lista przyjmowanych leków', 'Skierowanie od pracodawcy (badania z medycyny pracy) lub od starosty', 'Poprzednie orzeczenia lekarskie i psychologiczne', 'Wyspanie się i brak alkoholu dobę wcześniej'].map((x) => `<label class="check"><input type="checkbox"><span>${x}</span></label>`).join('')}</div>`;
  $('#hCalc', el).onclick = () => {
    const b = $('#hBirth', el).value, l = $('#hLast', el).value;
    if (!b || !l) return toast('Uzupełnij obie daty');
    const last = new Date(l);
    const age = (last - new Date(b)) / (365.25 * 864e5);
    const months = age >= 60 ? 30 : 60;
    const next = new Date(last); next.setMonth(next.getMonth() + months);
    const n60 = new Date(b); n60.setFullYear(n60.getFullYear() + 60);
    const nextAdj = age < 60 && next > n60 ? next : next;
    const days = Math.ceil((nextAdj - new Date()) / 864e5);
    $('#hOut', el).innerHTML = `<div class="explain">Kolejne badania lekarskie i psychologiczne: <b>${fmtDate(nextAdj)}</b> (${months === 30 ? 'co 30 miesięcy – po 60. r.ż.' : 'co 5 lat'}).
      ${days < 0 ? '<br>⚠️ Termin minął – nie wykonuj przewozów do czasu nowych orzeczeń!' : days < 60 ? `<br>⏰ Zostało ${days} dni – umów wizytę.` : `<br>Zostało ${days} dni.`}
      ${age < 60 && next > n60 ? `<br>Uwaga: 60. urodziny (${fmtDate(n60)}) wypadają przed terminem – orzeczenie może mieć wtedy krótszą ważność, decyduje lekarz/psycholog.` : ''}</div>`;
  };
}

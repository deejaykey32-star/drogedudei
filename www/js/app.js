// DrogEduDei – router, nawigacja, liczenie czasu nauki, synchronizacja z widżetem.
import { $, $$, esc } from './ui.js';
import * as store from './store.js';
import { kurakSVG } from './kurak.js';
import { pushWidget, pullWidgetAnswers, onResume, setSystemBars } from './native.js';
import { QUESTIONS } from './content/questions.js';

const NAV = [
  ['START', [['#/', '🏠', 'Pulpit'], ['#/krag', '⭕', 'Krąg 20 minut'], ['#/plan', '📅', 'Plan do egzaminu']]],
  ['TEORIA', [['#/podrecznik', '📚', 'Podręcznik'], ['#/znaki', '🚸', 'Atlas znaków'], ['#/fiszki', '🃏', 'Fiszki znaków'], ['#/mapy', '🗺️', 'Mapy i skrzyżowania']]],
  ['ĆWICZENIA', [['#/trening', '🧩', 'Trening pytań'], ['#/egzamin', '📝', 'Egzamin próbny'], ['#/powtorki', '🔁', 'Powtórki błędów']]],
  ['PRAKTYKA', [['#/symulator', '🚦', 'Symulator egzaminu – Katowice'], ['#/praktyka', '🚗', 'Plac i jazdy'], ['#/kategorie', '🪪', 'Kategorie']]],
  ['ZDROWIE', [['#/psychotesty', '🧠', 'Psychotesty'], ['#/zdrowie', '🩺', 'Lekarz, zawodowi, taxi/Uber']]],
  ['', [['#/ustawienia', '⚙️', 'Ustawienia i postęp'], ['#/android', '📱', 'Aplikacja na Androida']]],
];
const BOTTOM = [['#/', '🏠', 'Pulpit'], ['#/podrecznik', '📚', 'Teoria'], ['#/trening', '🧩', 'Ćwicz'], ['#/symulator', '🚦', 'Jazda'], ['#/psychotesty', '🧠', 'Testy']];

const ROUTES = {
  '': () => import('./views/home.js').then((m) => m.dashboard),
  krag: () => import('./views/home.js').then((m) => m.circle),
  plan: () => import('./views/home.js').then((m) => m.plan),
  ustawienia: () => import('./views/home.js').then((m) => m.settings),
  android: () => import('./views/home.js').then((m) => m.android),
  podrecznik: () => import('./views/learn.js').then((m) => m.book),
  rozdzial: () => import('./views/learn.js').then((m) => m.chapter),
  znaki: () => import('./views/learn.js').then((m) => m.signs),
  fiszki: () => import('./views/learn.js').then((m) => m.flash),
  mapy: () => import('./views/learn.js').then((m) => m.maps),
  kategorie: () => import('./views/learn.js').then((m) => m.categories),
  trening: () => import('./views/quiz.js').then((m) => m.training),
  quiz: () => import('./views/quiz.js').then((m) => m.quizRoute),
  egzamin: () => import('./views/quiz.js').then((m) => m.exam),
  powtorki: () => import('./views/quiz.js').then((m) => m.review),
  praktyka: () => import('./views/practice.js').then((m) => m.practice),
  zdrowie: () => import('./views/practice.js').then((m) => m.health),
  psychotesty: () => import('./psycho.js').then((m) => m.psychoRoute),
  symulator: () => import('./sim/simview.js').then((m) => m.simRoute),
};

let cleanup = null;

function renderNav() {
  const hash = location.hash || '#/';
  const base = '#/' + (hash.slice(2).split('/')[0] || '');
  const act = (h) => (h === base || (h === '#/podrecznik' && base === '#/rozdzial') ? 'active' : '');
  $('#sidebar').innerHTML = NAV.map(([g, items]) => `${g ? `<h4>${g}</h4>` : '<hr style="border-color:var(--line)">'}${items.map(([h, i, t]) => `<a href="${h}" class="${act(h)}"><span class="ico">${i}</span>${t}</a>`).join('')}`).join('');
  $('#bottombar').innerHTML = BOTTOM.map(([h, i, t]) => `<a href="${h}" class="${act(h)}"><span>${i}</span>${t}</a>`).join('');
}

function renderStats() {
  const s = store.get();
  const d = store.day();
  $('#topStats').innerHTML = `<span class="pill" title="Kategoria">🪪 ${esc(s.profile.cat)}</span>
    <span class="pill" title="Seria dni">🔥 ${s.streak.count}</span>
    <span class="pill hide-sm" title="XP">⭐ ${s.xp}</span>
    <span class="pill hide-sm" title="Minuty dziś">⏱️ ${Math.floor(d.sec / 60)}/${s.profile.dailyGoal}</span>`;
}

async function route() {
  const hash = location.hash || '#/';
  const [name, ...args] = hash.slice(2).split('/').map(decodeURIComponent);
  const loader = ROUTES[name] ?? ROUTES[''];
  closeMenu();
  renderNav();
  cleanup?.();
  cleanup = null;
  const main = $('#main');
  const view = document.createElement('div');
  view.className = 'view';
  try {
    const fn = await loader();
    main.replaceChildren(view);
    cleanup = (await fn(view, ...args)) || null;
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card"><h2>Ups…</h2><p>Nie udało się wczytać widoku.</p><pre class="muted" style="white-space:pre-wrap">${esc(e.message)}</pre></div>`;
  }
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function closeMenu() {
  $('#sidebar').classList.remove('open');
  $('#scrim').classList.remove('show');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
}

function applyTheme() {
  const t = store.get().profile.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = t;
  setSystemBars(t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches));
}

// Liczenie aktywnego czasu nauki (gdy karta widoczna i użytkownik był aktywny w ostatniej minucie).
let lastInput = Date.now();
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!document.hidden && Date.now() - lastInput < 60000) store.addSeconds(15);
}, 15000);

// Widżet Androida: seria, minuty, pytania dnia (TAK/NIE).
function widgetPayload() {
  const s = store.get();
  const d = store.day();
  // Widżet nie pokazuje obrazków – tylko pytania bez znaku/sceny („Czy ten znak…” nie miałoby sensu).
  const tn = QUESTIONS.filter((q) => q.t === 'tn' && !q.img && !/(ten|tego|tym) znak/i.test(q.q));
  const seed = Number(store.today().replace(/-/g, ''));
  const qs = Array.from({ length: 12 }, (_, i) => tn[(seed * 7 + i * 13) % tn.length]).map((q) => ({ q: q.q, c: q.c, e: q.e }));
  return { streak: s.streak.count, xp: s.xp, min: Math.floor(d.sec / 60), goal: s.profile.dailyGoal, cat: s.profile.cat, date: store.today(), questions: qs };
}

async function syncWidget() {
  const r = await pullWidgetAnswers();
  if (r && r.correct > 0) store.addXP(r.correct * 3, 'widget');
  pushWidget(widgetPayload());
}

store.onChange(() => { renderStats(); applyTheme(); });

$('#menuBtn').addEventListener('click', () => {
  const open = !$('#sidebar').classList.contains('open');
  $('#sidebar').classList.toggle('open', open);
  $('#scrim').classList.toggle('show', open);
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});
$('#scrim').addEventListener('click', closeMenu);
$('#brandIco').innerHTML = kurakSVG(30);

addEventListener('hashchange', route);
applyTheme();
renderStats();
route();
syncWidget();
onResume(syncWidget);
setInterval(syncWidget, 120000);

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.Capacitor) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

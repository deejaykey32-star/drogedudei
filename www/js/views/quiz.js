// Trening, ćwiczenia rozdziałów, powtórki błędów, egzamin próbny (32 pytania, 74 pkt, próg 68).
import { $, $$, esc, md, imgHTML, bindScenes, kurakSays, toast } from '../ui.js';
import * as store from '../store.js';
import { QUESTIONS, questionsFor, signQuestion, shuffle } from '../content/questions.js';
import { CHAPTERS, chapterById } from '../content/book.js';
import { SIGNS, signSVG } from '../signs.js';
import { SCENES, playScene } from '../scenes.js';
import { speak, stopSpeaking } from '../native.js';

const allById = () => {
  const m = new Map(QUESTIONS.map((q) => [q.id, q]));
  for (const s of SIGNS) { const q = signQuestion(s, 'abc'); m.set('sign:' + s.c, q); }
  return m;
};

function forCat(q, cat) { return q.cats.includes('all') || q.cats.includes(cat); }

export function training(el) {
  const s = store.get();
  const cat = s.profile.cat;
  el.innerHTML = `<h1>🧩 Trening pytań</h1><p class="lead">Ćwicz w swoim tempie: z wyjaśnieniem po każdej odpowiedzi. Błędne pytania wracają na końcu serii i trafiają do powtórek.</p>
  <div class="grid g2">
    <a class="card tile" href="#/quiz/losowe"><span class="tico">🎲</span><div><h3>10 losowych pytań</h3><p>Mieszanka z całego podręcznika (kat. ${esc(cat)})</p></div></a>
    <a class="card tile" href="#/quiz/znaki"><span class="tico">🚸</span><div><h3>Znaki – rozpoznawanie</h3><p>Znaczenie znaku, wskaż znak, prawda/fałsz</p></div></a>
    <a class="card tile" href="#/quiz/skrzyzowania"><span class="tico">🔀</span><div><h3>Skrzyżowania – kto pierwszy?</h3><p>Pytania ze schematami i animacją</p></div></a>
    <a class="card tile" href="#/quiz/kategoria"><span class="tico">🪪</span><div><h3>Pytania specjalistyczne kat. ${esc(cat)}</h3><p>Pytania A/B/C dla Twojej kategorii</p></div></a>
    <a class="card tile" href="#/powtorki"><span class="tico">🔁</span><div><h3>Powtórki błędów</h3><p>${store.dueIds().length} do powtórki dziś</p></div></a>
    <a class="card tile" href="#/egzamin"><span class="tico">📝</span><div><h3>Egzamin próbny</h3><p>32 pytania na czas</p></div></a>
  </div>
  <h2>Według rozdziałów</h2>
  <div class="grid g2">${CHAPTERS.filter((c) => questionsFor(c.id).length).map((c) => `<a class="card tile" href="#/quiz/rozdzial/${c.id}"><span class="tico">${c.icon}</span><div><h3>${esc(c.title)}</h3><p>${questionsFor(c.id).length} pytań${s.chapters[c.id]?.best != null ? ` · najlepszy wynik ${s.chapters[c.id].best}%` : ''}</p></div></a>`).join('')}</div>`;
}

export function quizRoute(el, mode = 'losowe', arg) {
  const cat = store.get().profile.cat;
  let qs, title, chId;
  if (mode === 'rozdzial') {
    chId = arg;
    qs = shuffle(questionsFor(arg)).slice(0, 15);
    title = chapterById(arg)?.title || 'Rozdział';
  } else if (mode === 'znaki') {
    qs = shuffle(SIGNS).slice(0, 12).map((s, i) => signQuestion(s, ['abc', 'pick', 'tn'][i % 3]));
    title = 'Znaki drogowe';
  } else if (mode === 'skrzyzowania') {
    qs = shuffle(QUESTIONS.filter((q) => q.img?.scene));
    title = 'Skrzyżowania';
  } else if (mode === 'kategoria') {
    const own = QUESTIONS.filter((q) => q.t === 'abc' && q.cats.includes(cat));
    qs = shuffle(own.length >= 6 ? own : QUESTIONS.filter((q) => q.t === 'abc' && forCat(q, cat))).slice(0, 12);
    title = `Pytania specjalistyczne – kat. ${cat}`;
  } else {
    qs = shuffle(QUESTIONS.filter((q) => forCat(q, cat))).slice(0, 10);
    title = '10 losowych pytań';
  }
  return runQuiz(el, qs, { title, chId });
}

export function review(el) {
  const ids = store.dueIds();
  const map = allById();
  const qs = ids.map((id) => map.get(id)).filter(Boolean);
  if (!qs.length) {
    el.innerHTML = `<h1>🔁 Powtórki błędów</h1><div class="card">${kurakSays('Brak pytań do powtórki na dziś. Ko-ko-gratulacje! Zrób trening, a błędy pojawią się tu same.')}</div>
      <div class="row" style="margin-top:12px"><a class="btn primary" href="#/quiz/losowe">🎲 10 losowych pytań</a></div>`;
    store.addXP(1, 'review');
    return;
  }
  return runQuiz(el, shuffle(qs).slice(0, 15), { title: 'Powtórki błędów', task: 'review' });
}

// Renderowanie pojedynczego pytania (wspólne dla treningu i egzaminu).
function qHTML(q) {
  const img = q.img ? `<div class="qimg">${imgHTML(q.img, 150)}</div>` : '';
  let ans;
  if (q.t === 'tn') ans = `<div class="answers tn"><button class="ans" data-i="1">TAK</button><button class="ans" data-i="0">NIE</button></div>`;
  else if (q.t === 'pick') ans = `<div class="answers picks">${q.a.map((c, i) => `<button class="ans pick" data-i="${i}" aria-label="Znak ${i + 1}">${signSVG(c, 92)}</button>`).join('')}</div>`;
  else ans = `<div class="answers">${q.a.map((a, i) => `<button class="ans" data-i="${i}"><b>${'ABC'[i]}</b>${esc(a)}</button>`).join('')}</div>`;
  return `<p class="qtext">${esc(q.q)}</p>${img}${ans}`;
}
const isCorrect = (q, i) => (q.t === 'tn' ? (i === 1) === q.c : i === q.c);
const correctIdx = (q) => (q.t === 'tn' ? (q.c ? 1 : 0) : q.c);

function runQuiz(el, questions, { title, chId, task }) {
  const queue = questions.slice();
  const retried = new Set();
  let pos = 0, good = 0, firstTry = 0, total = questions.length;
  const draw = () => {
    if (pos >= queue.length) return finish();
    const q = queue[pos];
    el.innerHTML = `<div class="quiz-top"><a class="btn ghost" href="#/trening">✕</a><div class="progress"><i style="width:${(pos / queue.length) * 100}%"></i></div><span class="tag">${pos + 1}/${queue.length}</span></div>
      <h1 style="font-size:20px">${esc(title)}</h1>
      <div class="card qcard">${qHTML(q)}<div id="ex"></div></div>`;
    bindScenes(el);
    if (store.get().profile.voice && q.t !== 'pick') { /* lektor na żądanie: przytrzymaj pytanie */ }
    $('.qtext', el).onclick = () => speak(q.q + (q.a && q.t === 'abc' ? '. ' + q.a.map((a, i) => 'ABC'[i] + ': ' + a).join('. ') : ''));
    $('.answers', el).onclick = (e) => {
      const b = e.target.closest('.ans');
      if (!b || b.disabled) return;
      const i = Number(b.dataset.i);
      const ok = isCorrect(q, i);
      $$('.ans', el).forEach((x) => { x.disabled = true; if (Number(x.dataset.i) === correctIdx(q)) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      if (ok) { good++; if (!retried.has(q.id)) firstTry++; }
      else if (!retried.has(q.id)) { retried.add(q.id); queue.push(q); }
      store.answer(q.id, ok);
      const sc = q.img?.scene;
      $('#ex', el).innerHTML = `<div class="explain">${ok ? '✅ <b>Dobrze!</b>' : '❌ <b>Źle.</b>'} ${md(q.e)}</div>
        <div class="row" style="margin-top:12px">${sc ? '<button class="btn" id="play">▶ Pokaż przejazd</button>' : ''}<button class="btn primary" id="nx">Dalej →</button></div>`;
      if (sc) $('#play', el).onclick = () => playScene($('.qimg svg', el), SCENES[sc].order);
      $('#nx', el).onclick = () => { pos++; draw(); };
      $('#nx', el).focus();
    };
  };
  const finish = () => {
    const pct = Math.round((firstTry / total) * 100);
    if (chId) store.chapterScore(chId, pct);
    if (task) store.addXP(3, task);
    store.addXP(pct >= 90 ? 15 : 5, 'quiz');
    const stars = pct === 100 ? '★★★' : pct >= 75 ? '★★☆' : pct >= 50 ? '★☆☆' : '☆☆☆';
    el.innerHTML = `<h1>${esc(title)} – wynik</h1><div class="card" style="text-align:center"><div style="font-size:44px;color:var(--accent)">${stars}</div>
      <div class="big" style="font-size:34px;font-weight:800">${pct}%</div><p class="muted">poprawnie za pierwszym razem: ${firstTry}/${total}</p></div>
      <div class="card" style="margin-top:12px">${kurakSays(pct >= 90 ? 'Ko-ko-kapitalnie! Tak trzymaj.' : pct >= 60 ? 'Nieźle! Błędne pytania wrócą w powtórkach.' : 'Spokojnie – przeczytaj jeszcze raz rozdział i spróbuj ponownie.', { mood: pct >= 60 ? 'happy' : 'sad' })}</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="again">🔁 Jeszcze raz</button>${chId ? `<a class="btn" href="#/rozdzial/${chId}">📖 Wróć do rozdziału</a>` : ''}<a class="btn" href="#/trening">Trening</a></div>`;
    $('#again', el).onclick = () => runQuiz(el, shuffle(questions), { title, chId, task });
  };
  draw();
  return () => stopSpeaking();
}

// ---------- Egzamin próbny ----------
function buildExam(cat) {
  const pick = (pool, n, w, used) => {
    const byW = shuffle(pool.filter((q) => q.w === w && !used.has(q.id)));
    const rest = shuffle(pool.filter((q) => !used.has(q.id)));
    const out = [];
    for (const q of [...byW, ...rest]) { if (out.length >= n) break; if (!used.has(q.id)) { used.add(q.id); out.push({ ...q, pts: w }); } }
    return out;
  };
  const used = new Set();
  const tnPool = QUESTIONS.filter((q) => q.t === 'tn' && forCat(q, cat)).concat(SIGNS.filter((s) => s.g !== 'S').map((s) => signQuestion(s, 'tn')));
  const spec = QUESTIONS.filter((q) => q.t === 'abc' && q.cats.includes(cat));
  const abcPool = spec.concat(QUESTIONS.filter((q) => q.t === 'abc' && forCat(q, cat) && !q.cats.includes(cat)));
  const basic = [...pick(tnPool, 10, 3, used), ...pick(tnPool, 6, 2, used), ...pick(tnPool, 4, 1, used)];
  const special = [...pick(abcPool, 6, 3, used), ...pick(abcPool, 4, 2, used), ...pick(abcPool, 2, 1, used)];
  return [...basic.map((q) => ({ ...q, time: 35 })), ...special.map((q) => ({ ...q, time: 50 }))];
}

export function exam(el) {
  const cat = store.get().profile.cat;
  el.innerHTML = `<h1>📝 Egzamin próbny – kat. ${esc(cat)}</h1>
  <div class="card">${kurakSays('Jak na prawdziwym egzaminie: 20 pytań podstawowych (TAK/NIE, 35 s każde) i 12 specjalistycznych (A/B/C, 50 s). Bez podpowiedzi – wyniki zobaczysz na końcu. Próg: 68 z 74 punktów.')}</div>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="start">▶ Rozpocznij egzamin</button><a class="btn" href="#/kategorie">Zmień kategorię</a></div>`;
  let timer;
  $('#start', el).onclick = () => {
    const qs = buildExam(cat);
    const answers = new Array(qs.length).fill(null);
    let i = 0, left = 0;
    const next = () => {
      clearInterval(timer);
      if (i >= qs.length) return finish();
      const q = qs[i];
      left = q.time;
      el.innerHTML = `<div class="quiz-top"><div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div><span class="tag">${i < 20 ? 'Podstawowe' : 'Specjalistyczne'} ${i + 1}/32</span><span class="tag">${q.pts} pkt</span><span class="timer" id="tm">${left}s</span></div>
        <div class="card qcard">${qHTML(q)}<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn primary" id="nx" disabled>Następne pytanie →</button></div></div>`;
      bindScenes(el);
      $('.answers', el).onclick = (e) => {
        const b = e.target.closest('.ans');
        if (!b) return;
        $$('.ans', el).forEach((x) => x.classList.remove('ok'));
        b.classList.add('ok');
        b.style.borderColor = 'var(--info)';
        $$('.ans', el).forEach((x) => { if (x !== b) x.style.borderColor = ''; });
        answers[i] = Number(b.dataset.i);
        $('#nx', el).disabled = false;
      };
      $('#nx', el).onclick = () => { i++; next(); };
      timer = setInterval(() => {
        left--;
        const t = $('#tm', el);
        if (t) { t.textContent = left + 's'; t.classList.toggle('low', left <= 5); }
        if (left <= 0) { i++; next(); }
      }, 1000);
    };
    const finish = () => {
      clearInterval(timer);
      let score = 0;
      qs.forEach((q, k) => { const ok = answers[k] != null && isCorrect(q, answers[k]); if (ok) score += q.pts; store.answer(q.id, ok); });
      const pass = score >= 68;
      store.addExam({ cat, score, max: 74, pass });
      el.innerHTML = `<h1>${pass ? '✅ Wynik pozytywny' : '❌ Wynik negatywny'}</h1>
        <div class="card" style="text-align:center"><div style="font-size:40px;font-weight:800">${score} / 74</div><p class="muted">Próg zaliczenia: 68 pkt</p></div>
        <div class="card" style="margin-top:12px">${kurakSays(pass ? 'Zdane! Teraz zrób to jeszcze kilka razy – na egzaminie stres odejmuje parę punktów.' : 'Tym razem się nie udało. Przejrzyj błędy poniżej – wszystkie trafiły do powtórek.', { mood: pass ? 'happy' : 'sad' })}</div>
        <h2>Przegląd odpowiedzi</h2>
        ${qs.map((q, k) => {
          const ok = answers[k] != null && isCorrect(q, answers[k]);
          const ansTxt = (v) => (v == null ? 'brak odpowiedzi' : q.t === 'tn' ? (v === 1 ? 'TAK' : 'NIE') : q.t === 'pick' ? q.a[v] : `${'ABC'[v]}. ${q.a[v]}`);
          return `<div class="card"><div class="row spread"><b>${k + 1}. ${esc(q.q)}</b><span class="tag ${ok ? 'ok' : 'bad'}">${ok ? '+' + q.pts : '0'} pkt</span></div>
            ${q.img?.sign ? `<div style="margin:6px 0">${signSVG(q.img.sign, 70)}</div>` : ''}
            <p class="muted" style="margin:6px 0">Twoja: ${esc(ansTxt(answers[k]))} · Poprawna: ${esc(ansTxt(correctIdx(q)))}</p><p style="margin:0">${md(q.e)}</p></div>`;
        }).join('')}
        <div class="row" style="margin-top:12px"><a class="btn primary" href="#/egzamin">🔁 Nowy egzamin</a><a class="btn" href="#/powtorki">🔁 Powtórki</a></div>`;
    };
    next();
  };
  return () => clearInterval(timer);
}

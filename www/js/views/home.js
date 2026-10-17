// Pulpit, krąg 20 minut, plan do egzaminu, ustawienia, strona aplikacji Android.
import { $, esc, md, kurakSays, toast, fmtDate } from '../ui.js';
import * as store from '../store.js';
import { kurakSVG, KURAK_TIPS } from '../kurak.js';
import { CHAPTERS, PARTS, CATEGORIES } from '../content/book.js';
import { QUESTIONS } from '../content/questions.js';
import { isNative, pushWidget } from '../native.js';

const nextChapter = () => CHAPTERS.find((c) => !store.get().chapters[c.id]?.read) || CHAPTERS[0];

function milestones(s) {
  const read = CHAPTERS.filter((c) => s.chapters[c.id]?.read).length;
  const passed = s.exams.filter((e) => e.pass).length;
  const simOk = s.sim.filter((r) => r.result === 'pozytywny').length;
  return [
    ['Teoria', read >= CHAPTERS.length * 0.5],
    ['Znaki', (s.days && Object.values(s.days).some((d) => d.done.flash)) || false],
    ['Pytania', Object.keys(s.srs).length >= 80],
    ['Egzamin próbny', passed >= 3],
    ['Symulator', simOk >= 1],
    ['Gotowy!', passed >= 5 && simOk >= 2],
  ];
}

export function apkCardHtml({ compact = false } = {}) {
  const native = isNative();
  if (native) {
    return `
    <div class="card apk-card" style="margin-top:16px">
      <div class="apk-head">
        <span class="apk-av">${kurakSVG(64)}</span>
        <div class="grow">
          <h2>🐓 Jesteś w aplikacji DrogEduDei na Androida!</h2>
          <p class="muted" style="margin:4px 0 0">Wszystkie moduły, lektor Google TTS i symulator Katowic działają natywnie w telefonie.</p>
        </div>
        <button class="btn primary" id="btnSyncWidget">🔄 Zsynchronizuj widżet teraz</button>
      </div>
      <div class="card" style="margin-top:12px;background:var(--card2)">
        <h3 style="margin-top:0">📱 Jak dodać widżet Kuraka na pulpit telefonu?</h3>
        <ol class="apk-steps" style="padding-left:18px">
          <li>Wyjdź na <strong>ekran główny</strong> telefonu (pulpit).</li>
          <li><strong>Przytrzymaj palec</strong> na pustym miejscu ekranu, aż pojawi się menu.</li>
          <li>Wybierz opcję <strong>Widżety</strong>.</li>
          <li>Odszukaj <strong>DrogEduDei</strong> na liście aplikacji.</li>
          <li>Przytrzymaj i upuść widżet na pulpit. Możesz dopasować jego rozmiar (np. 4×2 kafelki).</li>
          <li>Pytanie dnia TAK/NIE rotuje na pulpicie co 15 minut – odpowiadasz bez otwierania aplikacji i zdobywasz punkty XP!</li>
        </ol>
      </div>
    </div>`;
  }

  const host = typeof location !== 'undefined' && location.origin ? location.origin : 'https://drogedudei.pages.dev';
  const apkPath = 'download/DrogEduDei.apk';
  const fullApkUrl = `${host}/${apkPath}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=4&data=${encodeURIComponent(fullApkUrl)}`;

  return `
  <div class="card apk-card" style="margin-top:16px">
    <div class="apk-head">
      <span class="apk-av">${kurakSVG(64)}</span>
      <div class="grow">
        <h2>📱 DrogEduDei na Androida</h2>
        <p class="muted" style="margin:4px 0 0">Natywna aplikacja: lektor Google TTS, widżet na pulpit telefonu, symulator WORD Katowice i pełny tryb offline · <strong>APK 5.7 MB</strong></p>
      </div>
      <a class="btn primary big" href="${apkPath}" download="DrogEduDei.apk">⬇ Pobierz APK · 5.7 MB</a>
    </div>
    ${compact ? `
      <div class="row" style="margin-top:12px;justify-content:space-between">
        <span class="muted small">Zawiera interaktywny widżet na pulpit z pytaniem dnia TAK/NIE i serią dni.</span>
        <a class="btn ghost small" href="#/android">📱 Zobacz kod QR i widżet ›</a>
      </div>
    ` : `
      <div class="apk-body">
        <div class="apk-qr-box center">
          <img class="apk-qr" src="${qrUrl}" alt="Kod QR do pobrania DrogEduDei.apk" width="160" height="160">
          <div class="muted small" style="margin-top:6px">Zeskanuj aparatem telefonu<br>(pobierz bezpośrednio na telefon)</div>
        </div>
        <ol class="apk-steps">
          <li><strong>Pobierz APK:</strong> Kliknij przycisk <em>Pobierz APK</em> lub zeskanuj kod QR aparatem telefonu.</li>
          <li><strong>Zezwól na instalację:</strong> Otwórz pobrany plik na telefonie. W razie pytania zaznacz <em>Ustawienia → Zezwalaj z tego źródła</em>.</li>
          <li><strong>Uruchom aplikację:</strong> Zainstaluj DrogEduDei – pełna baza pytań, znaki i symulator działają offline.</li>
          <li><strong>Dodaj widżet na pulpit:</strong> Przytrzymaj palec na wolnym miejscu ekranu głównego telefonu → <em>Widżety</em> → <em>DrogEduDei</em>.</li>
          <li><strong>Ćwicz z pulpitu:</strong> Pytanie dnia rotuje co 15 minut. Odpowiadasz TAK/NIE bez wchodzenia do aplikacji, zbierasz punkty XP, a przycisk <em>Ćwicz z Kurakiem 🚦</em> przenosi Cię wprost do nauki!</li>
        </ol>
      </div>
    `}
  </div>`;
}

export function dashboard(el) {
  const s = store.get();
  const d = store.day();
  const read = CHAPTERS.filter((c) => s.chapters[c.id]?.read).length;
  const ms = milestones(s);
  const pct = Math.round((ms.filter((m) => m[1]).length / ms.length) * 100);
  const tip = KURAK_TIPS[(new Date().getDate() + s.streak.count) % KURAK_TIPS.length];
  const nc = nextChapter();
  const daysToExam = s.profile.examDate ? Math.ceil((new Date(s.profile.examDate) - new Date()) / 864e5) : null;
  const tn = QUESTIONS.filter((q) => q.t === 'tn' && !q.img);
  const qd = tn[Number(store.today().replace(/-/g, '')) % tn.length];
  const lastExam = s.exams[0];

  el.innerHTML = `
  <h1>🐓 Witaj${s.profile.name ? ', ' + esc(s.profile.name) : ''} w Drog<b style="color:var(--accent2)">Edu</b>Dei!</h1>
  <p class="lead">Przepisy, znaki, egzamin, plac i jazda po Katowicach – codziennie po 20 minut, aż do zdanego egzaminu.</p>
  <div class="card">${kurakSays(tip)}</div>

  <div class="grid g5" style="margin-top:12px">
    <div class="card stat"><div class="ico">🪪</div><div class="big">${esc(s.profile.cat)}</div><small>kategoria</small></div>
    <div class="card stat"><div class="ico">🔥</div><div class="big">${s.streak.count}</div><small>dni z rzędu</small></div>
    <div class="card stat"><div class="ico">⏱️</div><div class="big">${Math.floor(d.sec / 60)}</div><small>minut dziś / ${s.profile.dailyGoal}</small></div>
    <div class="card stat"><div class="ico">📖</div><div class="big">${read}/${CHAPTERS.length}</div><small>rozdziałów</small></div>
    <div class="card stat"><div class="ico">⭐</div><div class="big">${s.xp}</div><small>XP</small></div>
    <div class="card stat"><div class="ico">📅</div><div class="big">${daysToExam != null ? Math.max(0, daysToExam) : '—'}</div><small>dni do egzaminu</small></div>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="row spread"><h3 style="margin:0">Twoja droga do prawa jazdy</h3><b>${pct}%</b></div>
    <div class="progress" style="margin-top:8px"><i style="width:${pct}%"></i></div>
    <div class="path-levels">${ms.map(([n, ok]) => `<span class="${ok ? 'on' : ''}">${ok ? '✔ ' : ''}${n}</span>`).join('')}</div>
  </div>

  <div class="grid g2" style="margin-top:12px">
    <a class="card tile" href="#/rozdzial/${nc.id}"><span class="tico">${nc.icon}</span><div><h3>Podręcznik – kontynuuj</h3><p>${esc(nc.title)}</p></div></a>
    <a class="card tile" href="#/symulator"><span class="tico">🚦</span><div><h3>Symulator egzaminu – Katowice</h3><p>Plac + trasa wokół WORD (ul. Francuska): sygnalizacja, ronda, koperta, parkowanie. Pojazd dla każdej kategorii.</p></div></a>
    <a class="card tile" href="#/egzamin"><span class="tico">📝</span><div><h3>Egzamin próbny (kat. ${esc(s.profile.cat)})</h3><p>${lastExam ? `Ostatnio: ${lastExam.score}/${lastExam.max} pkt – ${lastExam.pass ? 'zdany ✅' : 'niezdany ❌'}` : '32 pytania, 25 minut, próg 68/74 pkt.'}</p></div></a>
    <a class="card tile" href="#/psychotesty"><span class="tico">🧠</span><div><h3>Psychotesty</h3><p>Refleks, koordynacja, antycypacja, tachistoskop – trening przed badaniem.</p></div></a>
  </div>

  <h2>⭕ Dzisiejszy krąg 20 minut</h2>
  <div class="card">${circleList(d)}<div class="row" style="margin-top:12px"><a class="btn primary" href="#/krag">Zacznij dzisiejszy krąg ▶</a></div></div>

  <h2>❓ Pytanie dnia</h2>
  <div class="card" id="qday"><p class="qtext" style="margin-top:0">${esc(qd.q)}</p>
    <div class="answers tn"><button class="ans" data-a="1">TAK</button><button class="ans" data-a="0">NIE</button></div><div id="qdayEx"></div></div>

  <h2>📱 DrogEduDei na telefon (Android)</h2>
  ${apkCardHtml({ compact: true })}

  <h2>Wskazówki Kuraka</h2>
  <div class="grid g2">
    ${[
      ['⭕', '20 minut dziennie', 'Krótko, ale codziennie: powtórka, znaki, rozdział, pytania, psychotest. Regularność wygrywa z intensywnością.'],
      ['🔁', 'Powtórki w odstępach', 'Błędne odpowiedzi wracają po 1, 2, 4, 8 i 16 dniach – aż zapamiętasz.'],
      ['🗺️', 'Myśl obrazem', 'Skrzyżowania ucz się na schematach z animacją – zobacz, kto jedzie pierwszy, zamiast wkuwać.'],
      ['🗣️', 'Mów na głos', 'Komentuj jazdę na głos: „lusterko, kierunkowskaz, pieszy z prawej”. Tak robią instruktorzy.'],
      ['🚦', 'Trasa egzaminacyjna', 'Przejedź w symulatorze okolice WORD Katowice – egzamin przestaje być niespodzianką.'],
      ['🩺', 'Zdrowie kierowcy', 'Zawodowi, taxi i Uber: badania co 5 lat, po 60. r.ż. co 30 miesięcy. Wyśpij się przed psychotestami.'],
    ].map(([i, t, x]) => `<div class="card tile"><span class="tico">${i}</span><div><h3>${t}</h3><p>${x}</p></div></div>`).join('')}
  </div>
  <p class="muted" style="margin-top:20px;font-size:13px">DrogEduDei to materiał edukacyjny. Pytania są autorskie, wzorowane na formie egzaminu. Przepisy zmieniają się – ostateczną wykładnią są aktualne ustawy i rozporządzenia oraz oficjalna baza pytań egzaminacyjnych.</p>`;

  $('#qday', el).addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const ok = (b.dataset.a === '1') === qd.c;
    el.querySelectorAll('#qday .ans').forEach((x) => { x.disabled = true; if ((x.dataset.a === '1') === qd.c) x.classList.add('ok'); });
    if (!ok) b.classList.add('bad');
    store.answer(qd.id, ok);
    $('#qdayEx', el).innerHTML = `<div class="explain">${ok ? '✅ Dobrze!' : '❌ Niestety.'} ${md(qd.e)}</div>`;
  });
}

function circleList(d) {
  const nc = nextChapter();
  const items = [
    ['🔁', 'Powtórka błędów', '3 min', '#/powtorki', d.done.review],
    ['🃏', 'Fiszki znaków', '4 min', '#/fiszki', d.done.flash],
    ['📖', `Rozdział: ${nc.title}`, '5 min', `#/rozdzial/${nc.id}`, d.done.read],
    ['🧩', '10 pytań treningowych', '5 min', '#/quiz/losowe', (d.done.q || 0) >= 10],
    ['🧠', 'Jeden psychotest', '3 min', '#/psychotesty', d.done.psycho],
  ];
  return `<div>${items.map(([i, t, m, h, ok]) => `<a class="check" href="${h}" style="text-decoration:none;color:inherit"><span style="font-size:20px">${ok ? '✅' : i}</span><span style="flex:1">${esc(t)}</span><span class="tag">${m}</span></a>`).join('')}</div>`;
}

export function circle(el) {
  const d = store.day();
  el.innerHTML = `<h1>⭕ Krąg 20 minut</h1><p class="lead">Pięć krótkich kroków. Każdy otwiera właściwe ćwiczenie – po wykonaniu wróć tutaj, a krok się zaznaczy.</p>
  <div class="card">${kurakSays('Kolejność ma sens: najpierw powtórka tego, co uciekło, potem nowe rzeczy, na koniec rozgrzewka mózgu przed jazdą.')}</div>
  <div class="card" style="margin-top:12px">${circleList(d)}</div>`;
}

export function plan(el) {
  const s = store.get();
  const exam = s.profile.examDate ? new Date(s.profile.examDate) : null;
  const weeks = exam ? Math.max(1, Math.ceil((exam - new Date()) / (7 * 864e5))) : 8;
  const cat = s.profile.cat;
  const chs = CHAPTERS.filter((c) => c.cats.includes('all') || c.cats.includes(cat));
  const per = Math.ceil(chs.length / Math.max(1, weeks - 1));
  const rows = [];
  for (let w = 0; w < weeks; w++) {
    const part = chs.slice(w * per, (w + 1) * per);
    const extra = w === weeks - 1 ? ['3× egzamin próbny', 'Symulator Katowice – wynik pozytywny 2×', 'Powtórka błędów do zera'] : w >= weeks / 2 ? ['1× egzamin próbny', 'Symulator – plac i trasa', '2× psychotest'] : ['Fiszki znaków codziennie', '30 pytań treningowych'];
    rows.push(`<div class="card"><h3 style="margin-top:0">Tydzień ${w + 1}${exam ? ` <span class="tag">${fmtDate(new Date(Date.now() + w * 7 * 864e5))}</span>` : ''}</h3>
      <ul>${part.map((c) => `<li><a href="#/rozdzial/${c.id}">${c.icon} ${esc(c.title)}</a> ${s.chapters[c.id]?.read ? '✅' : ''}</li>`).join('')}${extra.map((x) => `<li>${x}</li>`).join('')}</ul></div>`);
  }
  el.innerHTML = `<h1>📅 Plan do egzaminu</h1>
  <p class="lead">${exam ? `Egzamin: <b>${fmtDate(exam)}</b> – zostało ${weeks} tyg.` : 'Ustaw datę egzaminu w <a href="#/ustawienia">Ustawieniach</a>, a plan dopasuje się do terminu. Domyślnie: 8 tygodni.'} Kategoria: <b>${esc(cat)}</b>.</p>
  <div class="grid g2">${rows.join('')}</div>`;
}

export function settings(el) {
  const s = store.get();
  const p = s.profile;
  el.innerHTML = `<h1>⚙️ Ustawienia i postęp</h1>
  <div class="card grid g2">
    <label class="f">Imię (opcjonalnie)<input id="sName" value="${esc(p.name)}" maxlength="30"></label>
    <label class="f">Kategoria prawa jazdy<select id="sCat">${CATEGORIES.map((c) => `<option ${c.k === p.cat ? 'selected' : ''}>${c.k}</option>`).join('')}</select></label>
    <label class="f">Data egzaminu<input id="sDate" type="date" value="${esc(p.examDate)}"></label>
    <label class="f">Dzienny cel (minuty)<input id="sGoal" type="number" min="5" max="120" value="${p.dailyGoal}"></label>
    <label class="f">Motyw<select id="sTheme"><option value="auto">systemowy</option><option value="dark">ciemny</option><option value="light">jasny</option></select></label>
    <label class="f">Lektor (Kurak czyta na głos)<select id="sVoice"><option value="1">włączony</option><option value="0">wyłączony</option></select></label>
  </div>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="sSave">Zapisz</button></div>

  <h2>📱 Aplikacja na Androida i Widżet</h2>
  ${apkCardHtml({ compact: true })}

  <h2>Historia</h2>
  <div class="card"><h3 style="margin-top:0">Egzaminy próbne</h3>${s.exams.length ? `<ul>${s.exams.slice(0, 10).map((e) => `<li>${fmtDate(e.date)} · kat. ${esc(e.cat)} · ${e.score}/${e.max} ${e.pass ? '✅' : '❌'}</li>`).join('')}</ul>` : '<p class="muted">Brak.</p>'}</div>
  <div class="card"><h3 style="margin-top:0">Symulator jazdy</h3>${s.sim.length ? `<ul>${s.sim.slice(0, 10).map((e) => `<li>${fmtDate(e.date)} · kat. ${esc(e.cat)} · ${esc(e.result)} ${e.faults?.length ? `(${e.faults.length} uwag)` : ''}</li>`).join('')}</ul>` : '<p class="muted">Brak.</p>'}</div>

  <h2>Kopia zapasowa</h2>
  <div class="row"><button class="btn" id="sExport">⬇ Eksportuj postęp</button><label class="btn">⬆ Importuj<input type="file" id="sImport" accept="application/json" hidden></label><button class="btn red" id="sReset">Wyzeruj postęp</button></div>`;

  $('#sTheme', el).value = p.theme;
  $('#sVoice', el).value = p.voice ? '1' : '0';
  $('#sSave', el).onclick = () => {
    store.setProfile({ name: $('#sName', el).value.trim(), cat: $('#sCat', el).value, examDate: $('#sDate', el).value, dailyGoal: Math.max(5, Number($('#sGoal', el).value) || 20), theme: $('#sTheme', el).value, voice: $('#sVoice', el).value === '1' });
    toast('Zapisano ✔');
  };
  $('#sExport', el).onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' }));
    a.download = `drogedudei-postep-${store.today()}.json`;
    a.click();
  };
  $('#sImport', el).onchange = async (e) => {
    try { store.importJSON(await e.target.files[0].text()); toast('Zaimportowano ✔'); settings(el); } catch { toast('Nieprawidłowy plik'); }
  };
  $('#sReset', el).onclick = () => { if (confirm('Na pewno wyzerować cały postęp?')) { store.reset(); settings(el); } };
}

export async function android(el) {
  const s = store.get();
  el.innerHTML = `<h1>📱 DrogEduDei na Androida</h1>
  <div class="card">${kurakSays(isNative() ? 'Jesteś w natywnej aplikacji DrogEduDei! Dodaj widżet na ekran główny telefonu, aby codziennie powtarzać przepisy i utrzymać serię.' : 'Pobierz plik APK, zainstaluj aplikację i umieść widżet Kuraka na pulpicie telefonu. Pytanie dnia i punkty XP czekają!')}</div>

  ${apkCardHtml({ compact: false })}

  <h2>🧩 Podgląd widżetu na pulpicie telefonu</h2>
  <div class="card" style="max-width:440px;margin:12px auto;background:#111827;border:1.5dp solid #2C3A52;border-radius:24px;padding:14px;box-shadow:0 12px 36px rgba(0,0,0,.5)">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex:none">${kurakSVG(38)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:bold;color:#F3F4F6">Kurak · DrogEduDei</div>
        <div style="font-size:11px;color:#9CA3AF">Kierowco! Znasz odpowiedź?</div>
      </div>
      <span style="font-size:10px;font-weight:bold;background:#1E293B;color:#FDE68A;border:1px solid #F59E0B;padding:3px 8px;border-radius:12px">🚦 Kat. ${esc(s.profile.cat)}</span>
      <span style="font-size:14px;background:#1E293B;padding:4px 8px;border-radius:50%;color:#E2E8F0">🔁</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin:10px 0;background:#1A2333;padding:10px;border-radius:14px">
      <div style="font-size:26px;width:44px;height:44px;display:grid;place-items:center;background:#151E2E;border:1.5px solid #F59E0B;border-radius:12px;flex:none">🛑</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:bold;color:#FFF">Czy przed znakiem STOP przy pustej drodze możesz tylko zwolnić?</div>
        <div id="mockFeedback" style="display:none;font-size:11px;color:#E2E8F0;margin-top:4px">❌ Błąd (poprawnie: NIE). Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe!</div>
      </div>
    </div>
    <div id="mockAnswers" style="display:flex;gap:8px">
      <button class="btn" id="mockYes" style="flex:1;background:#15803D;color:#fff;border-radius:12px;min-height:38px">TAK ✔</button>
      <button class="btn" id="mockNo" style="flex:1;background:#B91C1C;color:#fff;border-radius:12px;min-height:38px">NIE ✖</button>
    </div>
    <button class="btn" id="mockNext" style="display:none;width:100%;background:#D97706;color:#1F2937;font-weight:bold;border-radius:12px;min-height:38px;margin-top:6px">Następne pytanie 🔁</button>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:11px;color:#94A3B8">
      <span>🔥 ${s.streak.count} dni · ⏱️ 0/20 min · ⭐ ${s.xp} XP</span>
      <a href="#/trening" style="background:#D97706;color:#fff;padding:4px 10px;border-radius:10px;text-decoration:none;font-weight:bold">Ćwicz z Kurakiem 🚦</a>
    </div>
  </div>

  <h2>Zalety wersji natywnej</h2>
  <div class="grid g3" style="margin-top:12px">
    <div class="card"><h3 style="margin-top:0">🤖 Pełny tryb offline</h3><p class="muted">Cała mapa Katowic (WORD), 36 rozdziałów podręcznika, atlas znaków i setki pytań działają bez połączenia z internetem.</p></div>
    <div class="card"><h3 style="margin-top:0">🗣️ Lektor Google (TTS)</h3><p class="muted">Kurak czyta polecenia egzaminatora, treść pytań i rozdziałów korzystając z natywnego głosu polskiego lektora w telefonie.</p></div>
    <div class="card"><h3 style="margin-top:0">🧩 Widżet na pulpit</h3><p class="muted">Pytanie dnia czeka bezpośrednio na pulpicie telefonu. Odpowiadasz od razu i zdobywasz punkty XP!</p></div>
  </div>`;

  const btnSync = $('#btnSyncWidget', el);
  if (btnSync) {
    btnSync.onclick = async () => {
      btnSync.disabled = true;
      btnSync.textContent = 'Synchronizuję…';
      try {
        const tn = QUESTIONS.filter((q) => q.t === 'tn' && !q.img && !/ (ten|tego|tym) znak/i.test(q.q));
        const seed = Number(store.today().replace(/-/g, ''));
        const qs = Array.from({ length: 12 }, (_, i) => tn[(seed * 7 + i * 13) % tn.length]).map((q) => ({ q: q.q, c: q.c, e: q.e }));
        await pushWidget({ streak: s.streak.count, xp: s.xp, min: Math.floor(store.day().sec / 60), goal: s.profile.dailyGoal, cat: s.profile.cat, date: store.today(), questions: qs });
        if (window.Capacitor?.Plugins?.WidgetBridge?.refreshWidget) {
          await window.Capacitor.Plugins.WidgetBridge.refreshWidget();
        }
        toast('Widżet zsynchronizowany pomyślnie! ✔');
      } catch (e) {
        toast('Nie udało się zsynchronizować widżetu');
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = '🔄 Zsynchronizuj widżet teraz';
      }
    };
  }

  // Interaktywny mock widżetu na stronie
  const mockYes = $('#mockYes', el);
  const mockNo = $('#mockNo', el);
  const mockNext = $('#mockNext', el);
  const mockFeedback = $('#mockFeedback', el);
  const mockAnswers = $('#mockAnswers', el);

  if (mockYes && mockNo && mockNext) {
    const handleAnswer = (userYes) => {
      mockAnswers.style.display = 'none';
      mockFeedback.style.display = 'block';
      mockFeedback.innerHTML = userYes 
        ? '❌ Błąd (poprawnie: NIE). Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe!' 
        : '✅ Dobrze! +3 XP. Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe.';
      mockNext.style.display = 'block';
    };
    mockYes.onclick = () => handleAnswer(true);
    mockNo.onclick = () => handleAnswer(false);
    mockNext.onclick = () => {
      mockAnswers.style.display = 'flex';
      mockFeedback.style.display = 'none';
      mockNext.style.display = 'none';
    };
  }
}

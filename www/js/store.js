// Stan użytkownika: postęp, seria dni, XP, powtórki (system Leitnera), wyniki testów.
const KEY = 'drogedudei.v1';
const today = () => new Date().toLocaleDateString('sv-SE'); // RRRR-MM-DD w strefie lokalnej

const DEFAULT = {
  profile: { name: '', cat: 'B', examDate: '', dailyGoal: 20, theme: 'auto', voice: true },
  xp: 0,
  streak: { count: 0, last: '' },
  days: {},          // { 'RRRR-MM-DD': { sec, xp, done:{} } }
  chapters: {},      // { id: { read:true, best:0..100 } }
  srs: {},           // { qid: { box:1..5, due:'RRRR-MM-DD', wrong:n } }
  exams: [],         // [{ date, cat, score, max, pass }]
  psycho: {},        // { testId: [{ date, score, detail }] }
  practice: { checks: {}, log: [] },
  sim: [],           // [{ date, cat, result, faults:[...] }]
  widget: { lastSync: 0 },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const s = JSON.parse(raw);
    return { ...structuredClone(DEFAULT), ...s, profile: { ...DEFAULT.profile, ...s.profile }, practice: { ...DEFAULT.practice, ...s.practice } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* tryb prywatny */ }
  listeners.forEach((f) => f(state));
}

export const get = () => state;
export const onChange = (f) => listeners.add(f);

export function day(d = today()) {
  state.days[d] ||= { sec: 0, xp: 0, done: {} };
  return state.days[d];
}

function touchStreak() {
  const t = today();
  if (state.streak.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yest = y.toLocaleDateString('sv-SE');
  state.streak.count = state.streak.last === yest ? state.streak.count + 1 : 1;
  state.streak.last = t;
}

export function addXP(n, task) {
  state.xp += n;
  const d = day();
  d.xp += n;
  if (task) d.done[task] = (d.done[task] || 0) + 1;
  touchStreak();
  save();
}

export function addSeconds(s) {
  day().sec += s;
  save();
}

export function markRead(chId) {
  state.chapters[chId] = { ...(state.chapters[chId] || {}), read: true };
  addXP(10, 'read');
}

export function chapterScore(chId, pct) {
  const c = state.chapters[chId] || {};
  state.chapters[chId] = { ...c, best: Math.max(c.best || 0, pct) };
  save();
}

// Powtórki w odstępach: box 1→1 dzień, 2→2, 3→4, 4→8, 5→16
const INTERVAL = [0, 1, 2, 4, 8, 16];
export function answer(qid, ok) {
  const r = state.srs[qid] || { box: 0, wrong: 0 };
  if (ok) r.box = Math.min(5, r.box + 1); else { r.box = 1; r.wrong++; }
  const due = new Date(); due.setDate(due.getDate() + (ok ? INTERVAL[r.box] : 0));
  r.due = due.toLocaleDateString('sv-SE');
  state.srs[qid] = r;
  addXP(ok ? 2 : 0, 'q');
}

export function dueIds() {
  const t = today();
  return Object.entries(state.srs).filter(([, r]) => r.due <= t && r.box < 5 && r.wrong > 0).map(([id]) => id);
}

export function addExam(e) { state.exams.unshift({ date: new Date().toISOString(), ...e }); state.exams = state.exams.slice(0, 50); addXP(e.pass ? 50 : 15, 'exam'); }
export function addPsycho(id, r) { (state.psycho[id] ||= []).unshift({ date: new Date().toISOString(), ...r }); state.psycho[id] = state.psycho[id].slice(0, 30); addXP(8, 'psycho'); }
export function addSim(r) { state.sim.unshift({ date: new Date().toISOString(), ...r }); state.sim = state.sim.slice(0, 30); addXP(r.result === 'pozytywny' ? 60 : 20, 'sim'); }

export function setProfile(p) { state.profile = { ...state.profile, ...p }; save(); }
export function reset() { state = structuredClone(DEFAULT); save(); }
export function exportJSON() { return JSON.stringify(state, null, 1); }
export function importJSON(txt) { state = { ...structuredClone(DEFAULT), ...JSON.parse(txt) }; save(); }

export { today };

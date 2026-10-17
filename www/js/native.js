// Most do natywnej aplikacji Android (Capacitor). W przeglądarce – zamienniki webowe.
const Cap = () => window.Capacitor;
const plugin = () => Cap()?.Plugins?.WidgetBridge;

export const isNative = () => !!Cap()?.isNativePlatform?.();

// Lektor: natywny TTS Androida lub Web Speech API.
export function speak(text) {
  const p = plugin();
  if (isNative() && p) return p.speak({ text }).catch(() => {});
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pl-PL';
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith('pl'));
  if (v) u.voice = v;
  u.rate = 1.02;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  const p = plugin();
  if (isNative() && p) return p.stop().catch(() => {});
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// Widżet: przekazanie stanu (seria, XP, minuty, pytania dnia) do SharedPreferences.
export async function pushWidget(payload) {
  const p = plugin();
  if (!isNative() || !p) return;
  try { await p.setState({ json: JSON.stringify(payload) }); } catch { /* brak widżetu */ }
}

// Odpowiedzi udzielone w widżecie (do doliczenia XP w aplikacji).
export async function pullWidgetAnswers() {
  const p = plugin();
  if (!isNative() || !p) return null;
  try { return await p.consumeAnswers(); } catch { return null; }
}

export function onResume(cb) {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cb(); });
  // Capacitor wysyła zdarzenie „resume” na document po powrocie aktywności (np. z widżetu).
  document.addEventListener('resume', cb);
}

// Kolor ikon paska stanu/nawigacji (Android 15+ rysuje aplikację pod paskami systemowymi).
let barsDark = null;
export function setSystemBars(dark) {
  const p = plugin();
  if (!isNative() || !p?.setSystemBars || barsDark === dark) return;
  barsDark = dark;
  p.setSystemBars({ dark }).catch(() => {});
}

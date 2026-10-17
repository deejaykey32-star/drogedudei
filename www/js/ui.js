// Wspólne helpery UI.
import { signSVG, markingSVG, getSign } from './signs.js';
import { sceneSVG, SCENES, playScene, placeVehicles } from './scenes.js';
import { kurakSVG } from './kurak.js';
import { speak } from './native.js';
import { get } from './store.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

export function kurakSays(text, { mood = 'happy', size = 76 } = {}) {
  return `<div class="kurak-box"><span data-say="${esc(text)}">${kurakSVG(size, mood)}</span>
    <div class="bubble"><b class="who">🐓 KURAK</b>${md(text)}</div></div>`;
}

// Klik w Kuraka = lektor czyta jego wypowiedź.
document.addEventListener('click', (e) => {
  const k = e.target.closest('[data-say]');
  if (k && get().profile.voice) speak(k.dataset.say);
});

export function imgHTML(img, size = 130) {
  if (!img) return '';
  if (img.sign) return signSVG(img.sign, size);
  if (img.mark) return markingSVG(img.mark, size);
  if (img.signs) return img.signs.map((c) => signSVG(c, size * 0.8)).join('');
  if (img.scene) return sceneSVG(SCENES[img.scene]);
  return '';
}

export function sceneFigure(name) {
  const sc = SCENES[name];
  if (!sc) return '';
  return `<figure class="figure" data-scene="${name}">${sceneSVG(sc)}
    <figcaption><b>${esc(sc.caption)}</b><br>${esc(sc.explain)}</figcaption>
    <div class="row" style="margin-top:8px"><button class="btn" data-play="${name}">▶ Odtwórz przejazd</button></div></figure>`;
}

export function bindScenes(root) {
  $$('figure[data-scene]', root).forEach((fig) => {
    const svg = $('svg.scene', fig);
    requestAnimationFrame(() => placeVehicles(svg));
  });
  $$('.qimg svg.scene', root).forEach((svg) => requestAnimationFrame(() => placeVehicles(svg)));
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]');
    if (!b) return;
    const fig = b.closest('figure');
    const svg = $('svg.scene', fig);
    svg._anim?.cancel();
    svg._anim = playScene(svg, SCENES[b.dataset.play].order);
  });
}

export function signCard(code, size = 90) {
  const s = getSign(code);
  return `<div class="sign-card" data-sign="${code}" tabindex="0" role="button" aria-label="${esc(code + ' ' + s?.n)}">${signSVG(code, size)}<div class="code">${code}</div><div class="name">${esc(s?.n)}</div></div>`;
}

export function renderBlocks(blocks) {
  return blocks.map(([t, a, b]) => {
    switch (t) {
      case 'h': return `<h2>${md(a)}</h2>`;
      case 'p': return `<p>${md(a)}</p>`;
      case 'ul': return `<ul>${a.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${a.map((x) => `<li>${md(x)}</li>`).join('')}</ol>`;
      case 'tip': return `<div class="callout tip">💡 ${md(a)}</div>`;
      case 'warn': return `<div class="callout warn">⚠️ ${md(a)}</div>`;
      case 'signs': return `<div class="signs">${a.map((c) => signCard(c)).join('')}</div>`;
      case 'marks': return `<div class="signs">${a.map((c) => signCard(c)).join('')}</div>`;
      case 'scene': return sceneFigure(a);
      case 'svg': return `<figure class="figure">${a}</figure>`;
      case 'def': return `<dl class="defs">${a.map(([k, v]) => `<dt>${md(k)}</dt><dd>${md(v)}</dd>`).join('')}</dl>`;
      case 'table': return `<div class="tbl-wrap"><table><thead><tr>${a.map((x) => `<th>${md(x)}</th>`).join('')}</tr></thead><tbody>${b.map((r) => `<tr>${r.map((x) => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'categories': return '<div id="catTable"></div>';
      default: return '';
    }
  }).join('');
}

// Okienko ze szczegółami znaku.
export function bindSignCards(root) {
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-sign]');
    if (!c) return;
    const s = getSign(c.dataset.sign);
    if (!s) return;
    const dlg = document.createElement('dialog');
    dlg.className = 'card';
    dlg.style.cssText = 'max-width:420px;border:1px solid var(--line);color:var(--text);background:var(--card)';
    dlg.innerHTML = `<div style="text-align:center">${signSVG(s.c, 160)}</div><h2 style="margin-top:6px">${esc(s.c)} – ${esc(s.n)}</h2><p>${esc(s.m)}</p>
      <div class="row"><button class="btn" data-speak>🔊 Przeczytaj</button><button class="btn primary" data-close>Zamknij</button></div>`;
    document.body.append(dlg);
    dlg.showModal();
    dlg.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-close]') || ev.target === dlg) dlg.close();
      if (ev.target.closest('[data-speak]')) speak(`${s.n}. ${s.m}`);
    });
    dlg.addEventListener('close', () => dlg.remove());
  });
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

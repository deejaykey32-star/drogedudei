// Jazda wzorcowa „z Kurakiem”: autopilot przejeżdża trasę egzaminacyjną zgodnie z przepisami.
// Steruje przez sim.autoSteer i sim.autoPedal. Zadania parkowania w trybie demo są pomijane (pokazane w podręczniku).
import { lightState } from './road.js';
import { toLocal, obbHit } from './engine.js';
import { pointAt, angDiff } from './world.js';

export class Autopilot {
  constructor(sim) { this.sim = sim; this.stopUntil = 0; }

  control() {
    const s = this.sim, st = s.stage;
    if (!st?.route) return;
    const R = st.route(), P = R.pts, c = s.car, b = s.body();
    const v = Math.abs(c.v);
    // kierownica: pure pursuit od osi tylnej
    const look = R.s + 3.2 + v * 0.4;
    let tp = P[P.length - 1];
    for (let k = R.idx; k < P.length; k++) if (P[k].s >= look) { tp = P[k]; break; }
    const a = angDiff(Math.atan2(tp.y - c.y, tp.x - c.x), c.h);
    const ld = Math.max(2, Math.hypot(tp.x - c.x, tp.y - c.y));
    s.autoSteer = Math.atan((2 * s.wb * Math.sin(a)) / ld);
    // prędkość docelowa
    const hud = st.hud(s);
    let vt = ((hud.limit || 50) - 4) / 3.6;
    const ahead = pointAt(P, Math.min(R.total, R.s + 25));
    const turn = Math.abs(angDiff(ahead.dir, pointAt(P, R.s).dir));
    if (turn > 0.35) vt = Math.min(vt, (turn > 1 ? 11 : 16) / 3.6);
    if (R.pts[Math.min(R.idx + 1, P.length - 1)].e.r.rb) vt = Math.min(vt, 20 / 3.6);
    const nl = R.limits.find((l) => l.s > R.s && l.s - R.s < 60);
    if (nl) vt = Math.min(vt, Math.sqrt((nl.ms / 3.6) ** 2 + 2 * 2 * Math.max(0, nl.s - R.s - 5)));
    const fS = R.s + s.v.len / 2;
    let stopAt = Infinity;
    for (const sg of R.signals) {
      const d = sg.stopS - fS;
      if (d < -1 || d > 60) continue;
      const ls = lightState(sg.off, pointAt(P, sg.stopS).dir, s.time);
      if (ls === 'g') continue;
      if (ls === 'y' && d < (v * v) / (2 * 3) ) continue; // za blisko, by bezpiecznie stanąć
      stopAt = Math.min(stopAt, d - 0.8);
    }
    for (const sp of R.stops) {
      const d = sp.stopS - fS;
      if (sp.done || d < -1 || d > 50) continue;
      if (!this.stopped?.has(sp) ) { stopAt = Math.min(stopAt, d - 0.5); if (v < 0.05 && d < 2) { (this.stopped ||= new Set()).add(sp); this.stopUntil = s.time + 1.5; } }
    }
    for (const cr of R.crossings) {
      const d = cr.s - fS;
      if (d < -1 || d > 45) continue;
      const busy = cr.peds.some((p) => { const lat = (p.x - p.ax) * p.nx + (p.y - p.ay) * p.ny; return lat * p.side > -p.half; });
      if (busy) stopAt = Math.min(stopAt, d - 4);
    }
    // pojazdy na naszym torze (korytarz wzdłuż trasy)
    const objs = st.objects?.().cars || [];
    const near = objs.filter((o) => Math.hypot(o.x - b.x, o.y - b.y) < 45);
    if (near.length) {
      for (let d = 1; d < 10 + v * 1.8; d += 1.5) {
        const p = pointAt(P, fS + d);
        const box = { x: p.x, y: p.y, h: p.dir, len: 2, wid: s.v.wid + 0.4 };
        if (near.some((o) => obbHit(box, o))) { stopAt = Math.min(stopAt, d - 2.5); break; }
      }
      // pojazdy poprzeczne: przewidywanie toru na 3 s – ustąp, jeśli wjadą na nasz korytarz
      const cross = near.filter((o) => (o.v || 0) > 0.5 && Math.abs(angDiff(o.h, b.h)) > 0.5);
      if (cross.length) {
        const mine = [];
        for (let d = 0; d < 14; d += 2) { const p = pointAt(P, fS + d); mine.push({ x: p.x, y: p.y, h: p.dir, len: 2.2, wid: s.v.wid + 0.6, d }); }
        for (const o of cross) {
          for (let t = 0; t <= 3; t += 0.5) {
            const ob = { ...o, x: o.x + Math.cos(o.h) * o.v * t, y: o.y + Math.sin(o.h) * o.v * t };
            const hit = mine.find((m) => obbHit(m, ob));
            if (hit) { stopAt = Math.min(stopAt, hit.d - 3); break; }
          }
        }
      }
    }
    // zadanie: hamowanie przy pachołku
    const brakeTask = st.tasks.find((t) => t.kind === 'hamowanie' && t.status === 'active');
    if (brakeTask) {
      const fl = toLocal(s.front(), { ...brakeTask.at(0, 0), h: brakeTask.dir });
      if (Math.abs(fl.y) < 15) stopAt = Math.min(stopAt, brakeTask.coneAlong - fl.x);
    }
    for (const t of st.tasks) if (t.kind !== 'hamowanie' && t.status !== 'ok') { t.status = 'ok'; t.demo = true; }
    if (s.time < this.stopUntil) stopAt = Math.min(stopAt, 0);
    if (stopAt < Infinity) vt = Math.min(vt, Math.sqrt(2 * 2.2 * Math.max(0, stopAt)));
    if (R.s > R.total - 30) vt = Math.min(vt, Math.sqrt(2 * 1.5 * Math.max(0, R.total - 22 - R.s)));
    const gas = v < vt - 0.3 ? Math.min(1, (vt - v) / 2) : 0;
    const brake = v > vt + 0.4 || (vt < 0.2 && v > 0) ? 1 : 0;
    s.autoPedal = { gas: gas ? 1 : 0, brake };
    // kierunkowskazy
    const m = R.maneuvers.find((q) => q.s > R.s - 2 && q.s - R.s < 32);
    if (m && c.blink !== m.need) s.toggleBlink(m.need);
    if (!m && c.blink && Math.abs(s.autoSteer) < 0.03) c.blink = null;
  }
}

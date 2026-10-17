// Rdzeń symulatora: fizyka pojazdu (model rowerowy + przyczepa), sterowanie, kamera, rendering, rejestr błędów.
import { VEHICLES, drawVehicle, drawTrailer } from './vehicles.js';
import { angDiff } from './world.js';

const DEG = Math.PI / 180;

export class Sim {
  constructor(canvas, cat, { model, onHUD, onMsg, onEnd, speak, ask }) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.cat = cat;
    this.v = model || VEHICLES[cat];
    this.onHUD = onHUD; this.onMsg = onMsg; this.onEnd = onEnd; this.speak = speak; this.ask = ask;
    this.keys = new Set();
    this.touch = { gas: 0, brake: 0, left: 0, right: 0 };
    this.zoom = this.v.kind === 'bus' || this.v.kind === 'truck' || this.v.trailer ? 5.5 : 7;
    this.northUp = false;
    this.faults = [];
    this.time = 0;
    this.dist = 0;
    this.running = false;
    this.ended = false;
    this.slope = null; // (x,y) => {grade, uphill dir} – tylko na placu
    this.car = { x: 0, y: 0, h: -Math.PI / 2, v: 0, steer: 0, gear: 'D', hand: false, blink: null, doors: false, braking: false };
    this.trailer = this.v.trailer ? { ...this.v.trailer, h: this.car.h, attached: true } : null;
    this.stage = null; // obiekt etapu: plac lub miasto
  }

  // ---- geometria pojazdu (stan = oś tylna) ----
  get wb() { return this.v.L; }
  fwd(h = this.car.h) { return [Math.cos(h), Math.sin(h)]; }
  body() {
    const [fx, fy] = this.fwd();
    return { x: this.car.x + fx * this.wb / 2, y: this.car.y + fy * this.wb / 2, h: this.car.h, len: this.v.len, wid: this.v.wid };
  }
  front() { const b = this.body(); const [fx, fy] = this.fwd(); return { x: b.x + fx * b.len / 2, y: b.y + fy * b.len / 2 }; }
  rear() { const b = this.body(); const [fx, fy] = this.fwd(); return { x: b.x - fx * b.len / 2, y: b.y - fy * b.len / 2 }; }
  hitch() {
    const [fx, fy] = this.fwd();
    const ro = (this.v.len - this.wb) / 2;
    const back = this.trailer?.kind === 'semi' ? -0.4 : ro + 0.45;
    return { x: this.car.x - fx * back, y: this.car.y - fy * back };
  }
  trailerBody() {
    const t = this.trailer;
    if (!t) return null;
    const hp = t.attached ? this.hitch() : t.hitchPt;
    const tf = [Math.cos(t.h), Math.sin(t.h)];
    const frontOff = t.kind === 'semi' ? 1.2 : -0.9; // naczepa wchodzi nad ciągnik; przyczepa ma dyszel
    const fx = hp.x + tf[0] * frontOff, fy = hp.y + tf[1] * frontOff;
    return { x: fx - tf[0] * t.len / 2, y: fy - tf[1] * t.len / 2, h: t.h, len: t.len, wid: t.wid };
  }
  setPose(x, y, h, { trailerAttached = true } = {}) {
    const [fx, fy] = this.fwd(h);
    // x,y – środek nadwozia → oś tylna
    this.car.x = x - fx * this.wb / 2; this.car.y = y - fy * this.wb / 2; this.car.h = h;
    this.car.v = 0; this.car.steer = 0; this.car.gear = 'D';
    if (this.trailer) { this.trailer.h = h; this.trailer.attached = trailerAttached; }
  }
  corners(b = this.body()) {
    const c = Math.cos(b.h), s = Math.sin(b.h), L = b.len / 2, W = b.wid / 2;
    return [[L, -W], [L, W], [-L, W], [-L, -W]].map(([a, d]) => ({ x: b.x + a * c - d * s, y: b.y + a * s + d * c }));
  }
  allCorners() {
    const tb = this.trailerBody();
    return tb && this.trailer.attached ? this.corners().concat(this.corners(tb)) : this.corners();
  }

  // ---- błędy ----
  fault(msg, crit = false) {
    if (this.ended) return;
    const last = this.faults[this.faults.length - 1];
    if (last && last.msg === msg && this.time - last.t < 6) return;
    this.faults.push({ t: this.time, msg, crit });
    this.msg((crit ? '⛔ ' : '⚠️ ') + msg, crit ? 'err' : '');
    if (crit && !this.demo) this.end('negatywny', msg);
  }
  msg(text, cls = '', say = false) {
    this.onMsg?.(text, cls);
    if (say) this.speak?.(text.replace(/[⛔⚠️✅🎙️]/g, ''));
  }
  end(result, reason = '') {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    setTimeout(() => this.onEnd?.({ result, reason, faults: this.faults, time: this.time, dist: this.dist, tasks: this.stage?.summary?.() || [] }), 900);
  }

  // ---- wejście ----
  input() {
    const k = this.keys;
    const gas = k.has('ArrowUp') || k.has('KeyW') || this.touch.gas;
    const brake = k.has('ArrowDown') || k.has('KeyS') || k.has('Space') || this.touch.brake;
    const left = k.has('ArrowLeft') || k.has('KeyA') || this.touch.left;
    const right = k.has('ArrowRight') || k.has('KeyD') || this.touch.right;
    if (this.autoPedal) return { gas: this.autoPedal.gas, brake: this.autoPedal.brake, steer: 0 };
    return { gas: gas ? 1 : 0, brake: brake ? 1 : 0, steer: (right ? 1 : 0) - (left ? 1 : 0) };
  }
  toggleGear() {
    if (Math.abs(this.car.v) > 0.3) return this.msg('Zmiana kierunku jazdy tylko po zatrzymaniu.');
    if (this.v.reverse === false) return this.msg('Ten pojazd nie ma biegu wstecznego – przepchnij go nogami (na egzaminie manewry wykonujesz do przodu).');
    this.car.gear = this.car.gear === 'D' ? 'R' : 'D';
  }
  toggleBlink(dir) { this.car.blink = this.car.blink === dir ? null : dir; this.blinkHeading = this.car.h; }

  // ---- fizyka ----
  step(dt) {
    const c = this.car, v = this.v;
    const inp = this.input();
    const maxSteer = v.steer * DEG;
    const steerRate = (v.kind === 'bus' || v.kind === 'truck' ? 1.2 : 1.8) * dt;
    const target = this.autoSteer != null ? Math.max(-maxSteer, Math.min(maxSteer, this.autoSteer)) : inp.steer * maxSteer;
    c.steer += Math.max(-steerRate, Math.min(steerRate, target - c.steer));
    if (!inp.steer && Math.abs(c.v) > 0.5) c.steer *= 1 - Math.min(1, dt * 1.8 * Math.min(1, Math.abs(c.v) / 6));
    const dir = c.gear === 'R' ? -1 : 1;
    let a = 0;
    const vmax = (c.gear === 'R' ? 12 : v.vmax) / 3.6;
    if (inp.gas && !c.hand) a += v.acc * dir * (1 - Math.min(1, Math.abs(c.v) / vmax));
    if (inp.gas && c.hand) this.msg('Zwolnij hamulec postojowy (H).');
    // opory toczenia
    a -= Math.sign(c.v) * (0.25 + 0.0009 * c.v * c.v);
    // wzniesienie (plac)
    const sl = this.slope?.(this.body());
    if (sl) a -= sl.grade * 9.81 * Math.cos(angDiff(c.h, sl.up));
    // hamulec
    if (inp.brake || c.hand) {
      const b = (inp.brake ? v.brake : 0) + (c.hand ? 9 : 0);
      if (Math.abs(c.v) < b * dt && Math.abs(a) < b) { c.v = 0; a = 0; }
      else a -= Math.sign(c.v || a) * b;
    }
    c.braking = !!inp.brake;
    const nv = c.v + a * dt;
    // bez gazu nie zmieniamy kierunku jazdy (poza staczaniem na wzniesieniu)
    if (!sl && !inp.gas && Math.sign(nv) !== Math.sign(c.v) && c.v !== 0) c.v = 0; else c.v = nv;
    if (!inp.gas && !sl && Math.abs(c.v) < 0.05) c.v = 0;
    const ds = c.v * dt;
    c.x += Math.cos(c.h) * ds;
    c.y += Math.sin(c.h) * ds;
    c.h += (ds / this.wb) * Math.tan(c.steer);
    this.dist += Math.abs(ds);
    // przyczepa
    const t = this.trailer;
    if (t && t.attached) {
      t.h += (ds / t.Lt) * Math.sin(angDiff(c.h, t.h));
      if (Math.abs(angDiff(c.h, t.h)) > 80 * DEG) this.fault('Złożenie zestawu (przyczepa pod zbyt dużym kątem)', true);
    }
    // auto-wyłączanie kierunkowskazu po skręcie
    if (c.blink && c.blink !== 'H' && this.blinkHeading != null && Math.abs(angDiff(c.h, this.blinkHeading)) > 70 * DEG && Math.abs(c.steer) < 5 * DEG) c.blink = null;
    if (c.doors && Math.abs(c.v) > 0.3) this.fault('Jazda z otwartymi drzwiami', true);
  }

  // ---- pętla ----
  start() {
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.tick(dt);
      this.render();
      this.hud();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  tick(dt) {
    this.autopilot?.control();
    this.time += dt;
    this.step(dt);
    this.stage?.update(this, dt);
  }

  hud() {
    const c = this.car;
    this.onHUD?.({ kmh: Math.round(Math.abs(c.v) * 3.6), gear: c.gear, blink: c.blink, hand: c.hand, doors: c.doors, faults: this.faults.length, ...(this.stage?.hud?.(this) || {}) });
  }

  // ---- rendering ----
  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.round(r.width * dpr);
    this.cv.height = Math.round(r.height * dpr);
    this.dpr = dpr;
  }
  camera(g) {
    const b = this.body();
    const W = this.cv.width, H = this.cv.height;
    const s = this.zoom * this.dpr;
    const [fx, fy] = this.fwd();
    const ahead = Math.min(18, Math.abs(this.car.v) * 1.2) * (this.car.v < 0 ? -0.5 : 1);
    const cx = b.x + fx * ahead, cy = b.y + fy * ahead;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.translate(W / 2, H * (this.northUp ? 0.5 : 0.62));
    g.scale(s, s);
    if (!this.northUp) g.rotate(-this.car.h - Math.PI / 2);
    g.translate(-cx, -cy);
    this.view = { cx, cy, r: Math.hypot(W, H) / s / 1.6 };
  }
  render() {
    if (this.cockpit) { this.cockpit.render(); return; }
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = this.stage?.bg || '#6f9a5c';
    g.fillRect(0, 0, this.cv.width, this.cv.height);
    this.camera(g);
    this.stage?.drawWorld?.(g, this);
    if (this.trailer) {
      const tb = this.trailerBody();
      g.save(); g.translate(tb.x, tb.y); g.rotate(tb.h); drawTrailer(g, this.trailer); g.restore();
    }
    const b = this.body();
    g.save(); g.translate(b.x, b.y); g.rotate(b.h); drawVehicle(g, this.v, this.car); g.restore();
    this.stage?.drawOver?.(g, this);
    g.setTransform(1, 0, 0, 1, 0, 0);
    this.stage?.drawScreen?.(g, this);
  }
}

// Test przecięcia prostokątów (SAT).
export function obbHit(a, b) {
  const ca = cornersOf(a), cb = cornersOf(b);
  for (const r of [a, b]) {
    for (const ang of [r.h, r.h + Math.PI / 2]) {
      const ax = Math.cos(ang), ay = Math.sin(ang);
      const pa = ca.map((p) => p.x * ax + p.y * ay), pb = cb.map((p) => p.x * ax + p.y * ay);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}
export function cornersOf(b) {
  const c = Math.cos(b.h), s = Math.sin(b.h), L = b.len / 2, W = b.wid / 2;
  return [[L, -W], [L, W], [-L, W], [-L, -W]].map(([a, d]) => ({ x: b.x + a * c - d * s, y: b.y + a * s + d * c }));
}
export function pointInOBB(p, b, pad = 0) {
  const dx = p.x - b.x, dy = p.y - b.y, c = Math.cos(b.h), s = Math.sin(b.h);
  const lx = dx * c + dy * s, ly = -dx * s + dy * c;
  return Math.abs(lx) <= b.len / 2 + pad && Math.abs(ly) <= b.wid / 2 + pad;
}
export function toLocal(p, o) {
  const dx = p.x - o.x, dy = p.y - o.y, c = Math.cos(o.h), s = Math.sin(o.h);
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}

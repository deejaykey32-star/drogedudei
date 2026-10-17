// Widok z miejsca kierowcy (3D, three.js) + wnętrze pojazdu z floty WORD Katowice + lusterka.
// Podłoże: tekstura rysowana tym samym rendererem 2D co widok z góry (drogi, linie, zebry, strefy zadań).
import * as THREE from '../../vendor/three/three.module.min.js';
import { signSVG } from '../signs.js';

const TEX = 1024, SPAN = 200; // tekstura 1024 px na 200 m
const P = (x, y, z = 0) => new THREE.Vector3(x, z, y); // (x,y świata, wysokość)

export class Cockpit {
  constructor(wrap, sim, W) {
    this.sim = sim; this.W = W;
    this.gl = document.createElement('canvas');
    this.ov = document.createElement('canvas');
    for (const c of [this.gl, this.ov]) { c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; wrap.append(c); }
    this.ov.style.pointerEvents = 'none';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.gl, antialias: true });
    this.renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#a9d3f5');
    this.scene.fog = new THREE.Fog('#c4dff5', 45, 175);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#55704a', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(60, 120, -40); this.scene.add(sun);
    this.look = 0;
    this.buildGround();
    if (W) { this.buildBuildings(); this.buildTrees(); }
    this.buildPlayer();
    this.pools = { cars: [], peds: [], cones: [], lights: [], signs: [] };
    this.sigTex = new Map();
    const v = sim.v;
    this.cam = new THREE.PerspectiveCamera(v.cockpit === 'bus' || v.cockpit === 'truck' ? 72 : 68, 1, 0.1, 1500);
    this.mirrors = this.mirrorDefs().map((m) => ({ ...m, cam: new THREE.PerspectiveCamera(m.fov, m.w / m.h, 0.3, 400) }));
    this.mirrors.forEach((m) => {
      m.cam.layers.enable(1);
      m.rt = new THREE.WebGLRenderTarget(256, 128);
      m.rt.texture.colorSpace = THREE.SRGBColorSpace;
      m.rt.texture.repeat.x = -1; m.rt.texture.offset.x = 1; // odbicie lustrzane
      m.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: m.rt.texture }));
    });
    this.hudScene = new THREE.Scene();
    this.mirrors.forEach((m) => this.hudScene.add(m.quad));
    this.hudCam = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    this.texT = -1;
    this.doubleSide(this.scene);
    this.resize();
  }

  // ---------- świat ----------
  buildGround() {
    this.tc = document.createElement('canvas'); this.tc.width = this.tc.height = TEX;
    this.tg = this.tc.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.tc);
    this.tex.anisotropy = 8;
    this.tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(SPAN, SPAN); geo.rotateX(-Math.PI / 2);
    this.ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: this.tex }));
    this.scene.add(this.ground);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: this.sim.stage?.bg || '#6f9a5c' }));
    far.position.y = -0.05; this.scene.add(far);
    this.far = far;
  }
  paintGround(cx, cy) {
    const g = this.tg, s = this.sim;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = s.stage?.bg || '#6f9a5c'; g.fillRect(0, 0, TEX, TEX);
    g.translate(TEX / 2, TEX / 2); g.scale(TEX / SPAN, TEX / SPAN); g.translate(-cx, -cy);
    const keep = s.view;
    s.view = { cx, cy, r: SPAN * 0.75 };
    s.stage?.drawWorld?.(g, s);
    s.view = keep;
    this.tex.needsUpdate = true;
    this.ground.position.set(cx, 0, cy);
    this.texC = { x: cx, y: cy };
  }
  buildBuildings() {
    const pos = [], nor = [];
    const h = (i) => 7 + ((i * 2654435761) % 1000) / 1000 * 22;
    this.W.areas.forEach((a, i) => {
      if (a.k !== 'b' || a.p.length < 4) return;
      const shape = new THREE.Shape(a.p.map(([x, y]) => new THREE.Vector2(x, -y)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h(i), bevelEnabled: false }).rotateX(-Math.PI / 2).toNonIndexed();
      pos.push(geo.attributes.position.array); nor.push(geo.attributes.normal.array);
      geo.dispose();
    });
    const merged = new THREE.BufferGeometry();
    const cat = (arrs) => { const n = arrs.reduce((a, b) => a + b.length, 0); const out = new Float32Array(n); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
    merged.setAttribute('position', new THREE.BufferAttribute(cat(pos), 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(cat(nor), 3));
    this.scene.add(new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ color: '#d9cbb8', side: THREE.DoubleSide })));
  }
  buildTrees() {
    const pts = [];
    const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; };
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const a of this.W.areas) {
      if (a.k !== 'f' && a.k !== 'g') continue;
      const xs = a.p.map((p) => p[0]), ys = a.p.map((p) => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const area = (x1 - x0) * (y1 - y0);
      const n = Math.min(a.k === 'f' ? 60 : 8, Math.floor(area / (a.k === 'f' ? 120 : 600)));
      for (let k = 0; k < n && pts.length < 1400; k++) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); if (inPoly(x, y, a.p)) pts.push([x, y, 0.7 + rnd() * 0.7]); }
    }
    const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 7, 7), new THREE.MeshLambertMaterial({ color: '#3f7a3a' }), pts.length);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.3, 2.2, 5), new THREE.MeshLambertMaterial({ color: '#6b4b2a' }), pts.length);
    const m = new THREE.Matrix4();
    pts.forEach(([x, y, s], i) => {
      m.compose(P(x, y, 1.1 * s), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); trunk.setMatrixAt(i, m);
      m.compose(P(x, y, (2.2 + 3.5) * s), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); crown.setMatrixAt(i, m);
    });
    this.scene.add(crown, trunk);
  }
  buildPlayer() {
    const v = this.sim.v;
    const hgt = { car: 1.48, van: 1.95, truck: 3.3, bus: 3.0, tractor: 2.7, moto: 1.2 }[v.cockpit] || 1.5;
    this.player = new THREE.Mesh(new THREE.BoxGeometry(v.len, hgt, v.wid), new THREE.MeshLambertMaterial({ color: v.color }));
    this.player.layers.set(1);
    this.scene.add(this.player);
    if (v.trailer) {
      const t = v.trailer;
      const th = t.kind === 'semi' ? 3.6 : t.kind === 'farm' ? 1.6 : 1.9;
      this.trailerMesh = new THREE.Mesh(new THREE.BoxGeometry(t.len, th, t.wid), new THREE.MeshLambertMaterial({ color: t.color }));
      this.trailerMesh.userData.h = th;
      this.trailerMesh.layers.enableAll();
      this.scene.add(this.trailerMesh);
    }
    this.playerH = hgt;
  }

  // Lusterka renderujemy z odbitą macierzą projekcji – materiały muszą być dwustronne.
  doubleSide(root) { root.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.side = THREE.DoubleSide; }); }); }

  // ---------- obiekty dynamiczne (pule) ----------
  pool(name, make, n) {
    const p = this.pools[name];
    while (p.length < n) { const o = make(); o.layers.enableAll(); o.traverse((c) => c.layers.enableAll()); this.doubleSide(o); this.scene.add(o); p.push(o); }
    p.forEach((o, i) => { o.visible = i < n; });
    return p;
  }
  makeCar() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1), new THREE.MeshLambertMaterial({ color: '#888' }));
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), new THREE.MeshLambertMaterial({ color: '#203040' }));
    body.name = 'body'; cab.name = 'cab';
    g.add(body, cab);
    return g;
  }
  updateObjects() {
    const o = this.sim.stage?.objects?.() || {};
    const cars = o.cars || [];
    this.pool('cars', () => this.makeCar(), cars.length).forEach((g, i) => {
      const c = cars[i]; if (!c) return;
      const tall = c.kind === 'bus' || c.kind === 'truck' ? 3 : c.kind === 'van' ? 2 : 1.45;
      g.position.set(c.x, 0, c.y); g.rotation.y = -c.h;
      const body = g.getObjectByName('body'), cab = g.getObjectByName('cab');
      body.scale.set(c.len, tall * (c.kind === 'car' ? 0.55 : 1), c.wid); body.position.y = (tall * (c.kind === 'car' ? 0.55 : 1)) / 2 + 0.25;
      body.material.color.set(c.color || '#888');
      cab.visible = c.kind === 'car';
      cab.scale.set(c.len * 0.5, 0.55, c.wid * 0.9); cab.position.set(-c.len * 0.05, tall * 0.55 + 0.52, 0);
    });
    const peds = o.peds || [];
    this.pool('peds', () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 1.2, 8), new THREE.MeshLambertMaterial({ color: '#c0392b' })); b.position.y = 0.95; const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshLambertMaterial({ color: '#f1c27d' })); hd.position.y = 1.7; const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.2), new THREE.MeshLambertMaterial({ color: '#2d3436' })); l.position.y = 0.35; g.add(b, hd, l); return g; }, peds.length)
      .forEach((g, i) => { if (peds[i]) g.position.set(peds[i].x, 0, peds[i].y); });
    const cones = o.cones || [];
    this.pool('cones', () => new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 12).translate(0, 0.375, 0), new THREE.MeshLambertMaterial({ color: '#ff6b00' })), cones.length)
      .forEach((m, i) => { if (cones[i]) m.position.set(cones[i].x, 0, cones[i].y); });
    const lights = o.lights || [];
    this.pool('lights', () => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3), new THREE.MeshLambertMaterial({ color: '#555' })); pole.position.y = 1.5;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.3), new THREE.MeshLambertMaterial({ color: '#111' })); box.position.y = 3.3;
      g.add(pole, box);
      ['r', 'y', 'g'].forEach((k, j) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: '#222' })); s.position.set(0, 3.62 - j * 0.32, 0.17); s.name = k; g.add(s); });
      return g;
    }, lights.length).forEach((g, i) => {
      const l = lights[i]; if (!l) return;
      g.position.set(l.x, 0, l.y); g.rotation.y = -l.h - Math.PI / 2;
      const on = { r: l.state === 'r' || l.state === 'ry', y: l.state === 'y' || l.state === 'ry', g: l.state === 'g' };
      g.getObjectByName('r').material.color.set(on.r ? '#ff3030' : '#3a1010');
      g.getObjectByName('y').material.color.set(on.y ? '#ffc400' : '#3a3010');
      g.getObjectByName('g').material.color.set(on.g ? '#22ff7a' : '#0e3420');
    });
    const signs = o.signs || [];
    this.pool('signs', () => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), new THREE.MeshLambertMaterial({ color: '#888' })); pole.position.y = 1.1;
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })); plate.position.y = 2.4; plate.name = 'plate';
      g.add(pole, plate); return g;
    }, signs.length).forEach((g, i) => {
      const s = signs[i]; if (!s) return;
      g.position.set(s.x, 0, s.y); g.rotation.y = -s.h - Math.PI / 2;
      const key = s.code + (s.num || '');
      const plate = g.getObjectByName('plate');
      if (plate.userData.key !== key) { plate.material.map = this.signTexture(s.code, s.num); plate.material.needsUpdate = true; plate.userData.key = key; }
    });
  }
  signTexture(code, num) {
    const key = code + (num || '');
    if (this.sigTex.has(key)) return this.sigTex.get(key);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const g = c.getContext('2d');
    if (code === 'B-33') {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = '#d0021b'; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
      g.fillStyle = '#111'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), 64, 68);
      t.needsUpdate = true;
    } else {
      const img = new Image();
      img.onload = () => { g.drawImage(img, 0, 0, 128, 128); t.needsUpdate = true; };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(signSVG(code, 128).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    }
    this.sigTex.set(key, t);
    return t;
  }

  // ---------- kamery ----------
  eye() {
    const s = this.sim, v = s.v, b = s.body();
    const fx = Math.cos(b.h), fy = Math.sin(b.h), lx = Math.sin(b.h), ly = -Math.cos(b.h); // lewa strona
    const fwdOff = { car: 0.25, van: 1.35, truck: 1.0, bus: v.fwdSeat ?? 0.9, tractor: 0.6, moto: 0.05 }[v.cockpit] ?? 0.3;
    const ahead = v.cockpit === 'car' ? -0.15 : v.len / 2 - fwdOff;
    const seat = v.seat ?? 0;
    return { x: b.x + fx * ahead + lx * seat, y: b.y + fy * ahead + ly * seat, z: v.eye || 1.2, h: b.h, fx, fy, lx, ly };
  }
  mirrorDefs() {
    const c = this.sim.v.cockpit;
    // pozycje ramek w ułamkach ekranu, side: -1 lewe, 1 prawe, 0 wsteczne
    if (c === 'moto') return [{ side: -1, x: 0.04, y: 0.42, w: 0.17, h: 0.11, fov: 38 }, { side: 1, x: 0.79, y: 0.42, w: 0.17, h: 0.11, fov: 38 }];
    if (c === 'bus') return [{ side: -1, x: 0.02, y: 0.08, w: 0.11, h: 0.24, fov: 34 }, { side: 1, x: 0.87, y: 0.08, w: 0.11, h: 0.24, fov: 34 }];
    if (c === 'truck' || c === 'tractor') return [{ side: -1, x: 0.01, y: 0.3, w: 0.1, h: 0.25, fov: 32 }, { side: 1, x: 0.89, y: 0.3, w: 0.1, h: 0.25, fov: 32 }];
    return [{ side: -1, x: 0.02, y: 0.5, w: 0.15, h: 0.12, fov: 36 }, { side: 1, x: 0.83, y: 0.5, w: 0.15, h: 0.12, fov: 36 }, { side: 0, x: 0.38, y: 0.03, w: 0.24, h: 0.085, fov: 40 }];
  }
  resize() {
    const r = this.gl.getBoundingClientRect();
    const w = Math.max(10, r.width), h = Math.max(10, r.height);
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.ov.width = Math.round(w * dpr); this.ov.height = Math.round(h * dpr);
    this.size = { w, h };
    const pr = this.renderer.getPixelRatio();
    this.hudCam.right = w; this.hudCam.top = h; this.hudCam.updateProjectionMatrix();
    for (const m of this.mirrors) {
      m.cam.aspect = (m.w * w) / (m.h * h); m.cam.updateProjectionMatrix();
      m.rt.setSize(Math.max(16, Math.round(m.w * w * pr)), Math.max(16, Math.round(m.h * h * pr)));
      m.quad.scale.set(m.w * w, m.h * h, 1);
      m.quad.position.set((m.x + m.w / 2) * w, h - (m.y + m.h / 2) * h, 0);
    }
  }

  // Słabszy telefon: gdy jest poniżej ~40 kl./s, stopniowo obniżaj rozdzielczość renderowania (do 1×).
  adaptQuality() {
    const now = performance.now();
    if (!this.fpsT) { this.fpsT = now; this.fpsN = 0; return; }
    this.fpsN++;
    if (now - this.fpsT < 2000) return;
    const fps = (this.fpsN * 1000) / (now - this.fpsT);
    this.fpsT = now; this.fpsN = 0;
    const pr = this.renderer.getPixelRatio();
    if (fps < 40 && pr > 1) { this.renderer.setPixelRatio(Math.max(1, pr - 0.25)); this.resize(); }
  }

  render() {
    const s = this.sim;
    this.adaptQuality();
    const e = this.eye();
    if (!this.texC || Math.hypot(e.x - this.texC.x, e.y - this.texC.y) > 25 || s.time - this.texT > 0.3) { this.paintGround(e.x + e.fx * 40, e.y + e.fy * 40); this.texT = s.time; }
    this.far.position.set(e.x, -0.05, e.y);
    // gracz i przyczepa (widoczne w lusterkach)
    const b = s.body();
    this.player.position.set(b.x, this.playerH / 2 + 0.25, b.y); this.player.rotation.y = -b.h;
    if (this.trailerMesh) { const tb = s.trailerBody(); this.trailerMesh.position.set(tb.x, this.trailerMesh.userData.h / 2 + 0.4, tb.y); this.trailerMesh.rotation.y = -tb.h; }
    this.updateObjects();
    // kamera kierowcy (z możliwością rozglądania się)
    const lookAng = e.h + this.look;
    this.cam.position.set(e.x, e.z, e.y);
    this.cam.lookAt(e.x + Math.cos(lookAng) * 20, e.z - 1.0, e.y + Math.sin(lookAng) * 20);
    const R = this.renderer;
    // lusterka → tekstury
    for (const m of this.mirrors) {
      const side = m.side;
      const seat = s.v.seat || 0;
      const lat = side < 0 ? s.v.wid / 2 - seat + 0.2 : -(s.v.wid / 2 + seat + 0.2);
      let mx, my;
      if (side === 0) { mx = b.x - e.fx * (s.v.len / 2 + 0.3); my = b.y - e.fy * (s.v.len / 2 + 0.3); }
      else { mx = e.x + e.lx * lat + e.fx * 0.6; my = e.y + e.ly * lat + e.fy * 0.6; }
      const mz = side === 0 ? e.z + 0.05 : e.z - 0.15;
      const back = e.h + Math.PI + (side === 0 ? 0 : side * -0.12);
      m.cam.position.set(mx, mz, my);
      m.cam.lookAt(mx + Math.cos(back) * 20, mz - 0.6, my + Math.sin(back) * 20);
      R.setRenderTarget(m.rt);
      R.render(this.scene, m.cam);
    }
    R.setRenderTarget(null);
    R.render(this.scene, this.cam);
    R.autoClear = false;
    R.render(this.hudScene, this.hudCam);
    R.autoClear = true;
    this.drawInterior();
  }

  // ---------- wnętrze ----------
  drawInterior() {
    const g = this.ov.getContext('2d');
    const W = this.ov.width, H = this.ov.height, s = this.sim, v = s.v, c = s.car;
    g.clearRect(0, 0, W, H);
    const dash = v.dash || '#2a2d33';
    const kmh = Math.abs(c.v) * 3.6;
    const wheelRot = c.steer * 14;
    const blinkOn = Math.floor(performance.now() / 380) % 2 === 0;
    const style = v.cockpit;
    const frame = (m) => { g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(m.x * W, m.y * H, m.w * W, m.h * H); g.strokeStyle = '#555'; g.lineWidth = 2; g.strokeRect(m.x * W - 3, m.y * H - 3, m.w * W + 6, m.h * H + 6); };
    if (style === 'moto') {
      // bak, zegar, kierownica
      g.fillStyle = v.color; g.beginPath(); g.ellipse(W / 2, H * 1.02, W * 0.17, H * 0.2, 0, Math.PI, 0); g.fill();
      g.save(); g.translate(W / 2, H * 0.86); g.rotate(c.steer * 0.6);
      g.strokeStyle = '#222'; g.lineWidth = H * 0.025; g.lineCap = 'round'; g.beginPath(); g.moveTo(-W * 0.36, -H * 0.03); g.quadraticCurveTo(0, H * 0.04, W * 0.36, -H * 0.03); g.stroke();
      g.fillStyle = '#111'; g.fillRect(-W * 0.4, -H * 0.06, W * 0.07, H * 0.06); g.fillRect(W * 0.33, -H * 0.06, W * 0.07, H * 0.06);
      // lusterka na wysięgnikach
      g.strokeStyle = '#333'; g.lineWidth = 5; g.beginPath(); g.moveTo(-W * 0.3, -H * 0.04); g.lineTo(-W * 0.36, -H * 0.3); g.moveTo(W * 0.3, -H * 0.04); g.lineTo(W * 0.36, -H * 0.3); g.stroke();
      g.restore();
      this.cluster(g, W / 2, H * 0.78, H * 0.07, kmh, v.vmax, true);
    } else {
      // słupki A i dach
      const roofH = style === 'bus' ? 0.06 : style === 'truck' ? 0.1 : 0.12;
      g.fillStyle = '#1b1d21';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H * roofH); g.quadraticCurveTo(W / 2, H * (roofH + 0.03), 0, H * roofH); g.fill();
      if (style !== 'bus') {
        const pw = style === 'tractor' ? 0.035 : 0.06;
        g.beginPath(); g.moveTo(0, H * roofH); g.lineTo(W * pw * 1.8, H * roofH); g.lineTo(W * pw * 0.6, H * 0.62); g.lineTo(0, H * 0.66); g.fill();
        g.beginPath(); g.moveTo(W, H * roofH); g.lineTo(W - W * pw * 1.8, H * roofH); g.lineTo(W - W * pw * 0.6, H * 0.62); g.lineTo(W, H * 0.66); g.fill();
      }
      if (style === 'tractor') { // maska ciągnika
        g.fillStyle = v.color; g.beginPath(); g.moveTo(W * 0.4, H); g.lineTo(W * 0.45, H * 0.62); g.lineTo(W * 0.55, H * 0.62); g.lineTo(W * 0.6, H); g.fill();
        g.fillStyle = '#222'; g.fillRect(W * 0.485, H * 0.5, W * 0.03, H * 0.13); // wydech
      }
      // deska rozdzielcza
      const top = { car: 0.72, van: 0.76, truck: 0.78, bus: 0.8, tractor: 0.84 }[style] || 0.74;
      g.fillStyle = dash;
      g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * (top + 0.02)); g.quadraticCurveTo(W * 0.3, H * (top - 0.05), W * 0.5, H * top); g.quadraticCurveTo(W * 0.75, H * (top + 0.02), W, H * (top + 0.03)); g.lineTo(W, H); g.fill();
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, H * (top + 0.02), W, H * 0.01);
      // zestaw wskaźników i kierownica (kierowca po lewej)
      const wx = style === 'bus' ? W * 0.32 : style === 'tractor' ? W * 0.5 : W * 0.3;
      const wy = H * (style === 'bus' ? 1.0 : style === 'truck' ? 0.98 : 0.97);
      const wr = H * (style === 'bus' || style === 'truck' ? 0.28 : style === 'tractor' ? 0.22 : 0.25);
      this.cluster(g, wx, H * (top + 0.07), H * 0.07, kmh, v.vmax, false);
      g.save(); g.translate(wx, wy); g.scale(1, style === 'bus' ? 0.55 : style === 'truck' ? 0.7 : 1); g.rotate(wheelRot);
      g.strokeStyle = '#151515'; g.lineWidth = wr * 0.16; g.beginPath(); g.arc(0, 0, wr, 0, 7); g.stroke();
      g.strokeStyle = '#2b2b2b'; g.lineWidth = wr * 0.12; g.beginPath(); g.moveTo(-wr, 0); g.lineTo(wr, 0); g.moveTo(0, 0); g.lineTo(0, wr); g.stroke();
      g.fillStyle = '#1e1e1e'; g.beginPath(); g.arc(0, 0, wr * 0.28, 0, 7); g.fill();
      g.fillStyle = '#888'; g.font = `bold ${wr * 0.16}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText({ car: v.name.startsWith('Škoda') ? 'ŠKODA' : v.name.startsWith('Toyota') ? 'TOYOTA' : '', van: 'VW', truck: 'MAN', bus: 'SOLARIS', tractor: 'ZETOR' }[style] || '', 0, 0);
      g.restore();
      // konsola środkowa: wyświetlacz z biegiem, egzamin
      if (style === 'car' || style === 'van') {
        g.fillStyle = '#111'; g.fillRect(W * 0.5, H * (top + 0.04), W * 0.12, H * 0.08);
        g.fillStyle = '#7fd3ff'; g.font = `${H * 0.025}px Arial`; g.textAlign = 'left'; g.fillText('WORD Katowice · egzamin', W * 0.505, H * (top + 0.075));
        // dodatkowy pedał hamulca egzaminatora – wzmianka
      }
      // lusterko wsteczne (uchwyt)
      if (style === 'car' || style === 'van') { g.fillStyle = '#111'; g.fillRect(W * 0.495, 0, W * 0.01, H * 0.035); }
      // „L” na szybie
      if (style === 'car') { g.fillStyle = 'rgba(29,91,191,.85)'; g.fillRect(W * 0.86, H * 0.16, W * 0.04, W * 0.04); g.fillStyle = '#fff'; g.font = `bold ${W * 0.03}px Arial`; g.textAlign = 'center'; g.fillText('L', W * 0.88, H * 0.16 + W * 0.03); }
    }
    for (const m of this.mirrors) { g.clearRect(m.x * W, m.y * H, m.w * W, m.h * H); frame(m); }
    // kontrolki
    const icons = [];
    if (c.blink === 'L' || c.blink === 'H') icons.push(['◀', '#22d36a', blinkOn]);
    if (c.blink === 'R' || c.blink === 'H') icons.push(['▶', '#22d36a', blinkOn]);
    if (c.hand) icons.push(['(P)', '#ff4040', true]);
    if (c.doors) icons.push(['🚪', '#ffb300', true]);
    g.font = `bold ${H * 0.035}px Arial`; g.textAlign = 'center';
    icons.forEach(([t, col, on], i) => { if (!on) return; g.fillStyle = col; g.fillText(t, W * 0.5 + (i - (icons.length - 1) / 2) * H * 0.07, H * 0.97); });
    if (Math.abs(this.look) > 0.05) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 80, 8, 160, 26); g.fillStyle = '#fff'; g.font = '14px Arial'; g.fillText(this.look > 0 ? 'patrzysz w prawo →' : '← patrzysz w lewo', W / 2, 26); }
  }
  cluster(g, x, y, r, kmh, vmax, moto) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#0c0d10'; g.beginPath(); g.arc(0, 0, r * 1.15, 0, 7); g.fill();
    g.strokeStyle = '#3a3f47'; g.lineWidth = r * 0.08; g.stroke();
    const max = Math.ceil(Math.min(240, vmax * 1.2) / 20) * 20;
    g.strokeStyle = '#ddd'; g.lineWidth = r * 0.04;
    for (let k = 0; k <= max; k += 20) { const a = Math.PI * 0.75 + (k / max) * Math.PI * 1.5; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    const a = Math.PI * 0.75 + (Math.min(kmh, max) / max) * Math.PI * 1.5;
    g.strokeStyle = '#ff5a1f'; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); g.stroke();
    g.fillStyle = '#fff'; g.font = `bold ${r * 0.5}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(kmh), 0, r * 0.45);
    g.fillStyle = '#ffb300'; g.font = `bold ${r * 0.32}px Arial`; g.fillText(this.sim.car.gear, 0, -r * 0.35);
    g.restore();
  }
  dispose() { this.renderer.dispose(); this.gl.remove(); this.ov.remove(); }
}

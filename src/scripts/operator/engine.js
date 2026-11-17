// Jobsite Games: the shared parts every game uses.
// - Stage: the full-screen play area (the picture, the buttons under it, the numbers on top).
// - Drawing helpers: the machines, drawn from simple shapes in A&H colors.
// Nothing here talks to the server.

export const C = {
  ink: '#101613', panel: '#0c2a20', deep: '#073a2c', green: '#0b4f3c', gold: '#d4a200', goldDark: '#b38900',
  dirt: '#8b6b49', dirtDark: '#6c5237', dirtLight: '#a88660', mound: '#c9a877', hole: '#3f2f20', holeDeep: '#2c2016',
  grassTall: '#3d6b2c', grassTuft: '#2f5723', grassCut: '#8fa25a', grassCut2: '#869a53', pasture: '#7d8f4e',
  road: '#a39a8b', road2: '#978e7f', rock: '#bdb7aa', rockDark: '#8f897d',
  yellow: '#e2aa08', yellowDark: '#b08200', steel: '#262b28', tread: '#1a1d1b', glass: '#a9cfc3', red: '#a3271f',
  weed: '#4f9a2b', weedDark: '#2f6f1c', dye: '#3f7fa8', water: '#4d7f93', sky: '#9db3aa', cream: '#e9e4d6',
};

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// A steady pretend-random number maker: the same level always comes out the same.
export function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
export const hash = (a, b = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
const box = (g, x, y, w, h, r, fill) => { rrect(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); };

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

// ---------- machines, seen from above. Each is drawn pointing "up" and turned by `ang`. s = its length. ----------

export function drawDozer(g, x, y, s, ang, load = 0, cap = 3) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const u = s / 10;
  box(g, -4.2 * u, -2.6 * u, 2 * u, 6.6 * u, 0.6 * u, C.tread); box(g, 2.2 * u, -2.6 * u, 2 * u, 6.6 * u, 0.6 * u, C.tread);
  g.strokeStyle = '#3b413d'; g.lineWidth = Math.max(1, 0.25 * u);
  for (let i = 0; i < 6; i++) { const ty = -2.1 * u + i * 1.1 * u; g.beginPath(); g.moveTo(-4.2 * u, ty); g.lineTo(-2.2 * u, ty); g.moveTo(2.2 * u, ty); g.lineTo(4.2 * u, ty); g.stroke(); }
  box(g, -2.4 * u, -2.3 * u, 4.8 * u, 6 * u, 0.7 * u, C.yellow);
  box(g, -2.4 * u, -2.3 * u, 4.8 * u, 2.2 * u, 0.7 * u, C.yellowDark); // engine hood
  box(g, -1.9 * u, 0.5 * u, 3.8 * u, 2.6 * u, 0.5 * u, C.green); box(g, -1.4 * u, 0.9 * u, 2.8 * u, 1.1 * u, 0.3 * u, C.glass); // cab
  g.fillStyle = C.steel; g.fillRect(-3.4 * u, -3.4 * u, 0.6 * u, 1.3 * u); g.fillRect(2.8 * u, -3.4 * u, 0.6 * u, 1.3 * u); // push arms
  if (load > 0) { // dirt riding in front of the blade
    g.fillStyle = C.mound; g.beginPath(); g.ellipse(0, -4.6 * u, 3.6 * u, (0.7 + 1.1 * (load / cap)) * u, 0, Math.PI, 0); g.fill();
    g.fillStyle = C.dirtLight; g.beginPath(); g.ellipse(-0.8 * u, -4.7 * u, 1.6 * u, (0.4 + 0.6 * (load / cap)) * u, 0, Math.PI, 0); g.fill();
  }
  box(g, -4.8 * u, -4.6 * u, 9.6 * u, 1.1 * u, 0.4 * u, C.steel); box(g, -4.8 * u, -4.6 * u, 9.6 * u, 0.4 * u, 0.2 * u, '#59605b'); // blade
  g.restore();
}

export function drawTractor(g, x, y, s, ang, spin = 0) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const u = s / 10;
  // the mower (brush hog) pulled behind
  box(g, -4.4 * u, 1.6 * u, 8.8 * u, 3.2 * u, 0.8 * u, C.goldDark); box(g, -3.9 * u, 2 * u, 7.8 * u, 2.4 * u, 0.6 * u, C.yellow);
  g.strokeStyle = 'rgba(38,43,40,0.55)'; g.lineWidth = Math.max(1, 0.3 * u);
  for (const cx of [-2, 2]) { g.beginPath(); g.moveTo(cx * u + Math.cos(spin) * 1.4 * u, 3.2 * u + Math.sin(spin) * 0.9 * u); g.lineTo(cx * u - Math.cos(spin) * 1.4 * u, 3.2 * u - Math.sin(spin) * 0.9 * u); g.stroke(); }
  // the tractor
  box(g, -3.3 * u, -0.9 * u, 1.5 * u, 3 * u, 0.5 * u, C.tread); box(g, 1.8 * u, -0.9 * u, 1.5 * u, 3 * u, 0.5 * u, C.tread);
  box(g, -2.6 * u, -4.4 * u, 0.9 * u, 1.6 * u, 0.3 * u, C.tread); box(g, 1.7 * u, -4.4 * u, 0.9 * u, 1.6 * u, 0.3 * u, C.tread);
  box(g, -1.3 * u, -4.7 * u, 2.6 * u, 4 * u, 0.5 * u, C.green); box(g, -1.9 * u, -1.2 * u, 3.8 * u, 3 * u, 0.6 * u, '#0e5e47');
  box(g, -1.3 * u, -0.7 * u, 2.6 * u, 1.3 * u, 0.3 * u, C.glass);
  g.fillStyle = C.gold; g.fillRect(-1.3 * u, -4.7 * u, 2.6 * u, 0.45 * u);
  g.restore();
}

// kind: 'spray' (tank and booms) or 'dump' (bed of rock). boomL/boomR: is that side spraying. fill: 0..1 rock in the bed.
export function drawTruck(g, x, y, s, ang, kind, o = {}) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const u = s / 10;
  for (const wy of [-3.5, 1.3, 2.9]) { box(g, -2.7 * u, wy * u, 0.9 * u, 1.5 * u, 0.3 * u, C.tread); box(g, 1.8 * u, wy * u, 0.9 * u, 1.5 * u, 0.3 * u, C.tread); }
  box(g, -2.1 * u, -5 * u, 4.2 * u, 3.2 * u, 0.7 * u, C.green); box(g, -1.6 * u, -3.6 * u, 3.2 * u, 1.2 * u, 0.3 * u, C.glass); // cab
  g.fillStyle = C.gold; g.fillRect(-2.1 * u, -5 * u, 4.2 * u, 0.4 * u);
  if (kind === 'spray') {
    box(g, -2.2 * u, -1.5 * u, 4.4 * u, 6.2 * u, 0.5 * u, C.steel);
    box(g, -1.7 * u, -1 * u, 3.4 * u, 4.2 * u, 1.5 * u, C.cream); g.fillStyle = 'rgba(63,127,168,0.55)';
    rrect(g, -1.7 * u, -1 * u + 4.2 * u * (1 - (o.tank ?? 1)), 3.4 * u, 4.2 * u * (o.tank ?? 1), 1.2 * u); g.fill();
    g.fillStyle = C.steel; g.fillRect(-7 * u, 4.1 * u, 14 * u, 0.5 * u); // the boom across the back
    g.fillStyle = C.gold; for (let i = -3; i <= 3; i++) if (i) g.fillRect(i * 2.1 * u - 0.25 * u, 4.5 * u, 0.5 * u, 0.5 * u);
  } else {
    box(g, -2.6 * u, -1.6 * u, 5.2 * u, 6.6 * u, 0.5 * u, C.yellowDark); box(g, -2.1 * u, -1.1 * u, 4.2 * u, 5.6 * u, 0.4 * u, '#5b4a22');
    const f = clamp(o.fill ?? 1, 0, 1);
    if (f > 0.02) { box(g, -2.1 * u, -1.1 * u + 5.6 * u * (1 - f), 4.2 * u, 5.6 * u * f, 0.4 * u, C.rock); g.fillStyle = C.rockDark; for (let i = 0; i < 7; i++) { const px = (hash(i, 3) - 0.5) * 3.4 * u, py = 4.3 * u - hash(i, 9) * 5.2 * u * f; g.fillRect(px, py, 0.5 * u, 0.4 * u); } }
  }
  g.restore();
}

// Stars for the result card and the level buttons.
export const starText = (n, of = 3) => '★'.repeat(n) + '☆'.repeat(of - n);

// ---------- the play area ----------

export class Stage {
  constructor(el) {
    this.el = el; this.canvas = el.querySelector('canvas'); this.g = this.canvas.getContext('2d');
    this.hudEl = el.querySelector('[data-hud]'); this.padEl = el.querySelector('[data-pad]'); this.view = el.querySelector('[data-view]');
    this.input = { dir: null, a: false, b: false, taps: [], dragX: null };
    this.held = []; this.inst = null; this.running = false; this.raf = 0; this.last = 0; this.hudText = '';
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.bindKeys(); this.bindCanvas();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => { this.last = 0; });
  }

  // Put a game on the stage. It waits (drawn, not moving) until play() is called.
  open(game, level, hooks) {
    this.game = game; this.hooks = hooks; this.running = false; this.done = false;
    this.input.dir = null; this.input.a = this.input.b = false; this.input.taps.length = 0; this.input.dragX = null; this.held.length = 0;
    this.buildPad(game.controls);
    this.resize();
    const api = {
      win: (stars, line) => this.finish({ won: true, stars: clamp(Math.round(stars), 1, 3), line }),
      lose: (line) => this.finish({ won: false, stars: 0, line }),
      buzz: (ms = 20) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} },
    };
    this.inst = game.create(level, api);
    this.hudText = ''; this.last = 0;
    cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(this.loop);
  }
  play() { this.running = true; this.last = 0; }
  finish(result) { if (this.done) return; this.done = true; this.running = false; setTimeout(() => this.hooks.onDone(result), 450); }
  close() { cancelAnimationFrame(this.raf); this.inst = null; this.running = false; }

  resize() {
    const r = this.view.getBoundingClientRect(); if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.round(r.width); this.H = Math.round(r.height);
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  loop(t) {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.inst) return;
    const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0; this.last = t;
    if (this.running && dt > 0) this.inst.update(dt, this.input);
    this.input.taps.length = 0;
    this.inst.draw(this.g, this.W, this.H, t / 1000);
    const hud = this.inst.hud();
    const text = JSON.stringify(hud);
    if (text !== this.hudText) {
      this.hudText = text;
      this.hudEl.replaceChildren(...hud.map(([label, value, warn]) => {
        const d = document.createElement('div'); d.className = 'ops-stat' + (warn ? ' is-warn' : '');
        const a = document.createElement('span'); a.textContent = label; const b = document.createElement('strong'); b.textContent = value; d.append(a, b); return d;
      }));
    }
  }

  // ----- buttons under the picture -----
  press(key, down) {
    const inp = this.input;
    if (key === 'a' || key === 'b') { inp[key] = down; if (down) inp.taps.push(key); return; }
    const i = this.held.indexOf(key); if (i >= 0) this.held.splice(i, 1);
    if (down) { this.held.push(key); inp.taps.push(key); }
    inp.dir = this.held[this.held.length - 1] || null;
  }
  buildPad(controls) {
    const pad = this.padEl; pad.replaceChildren(); pad.className = 'ops-pad ops-pad--' + controls.type;
    const make = (key, label, cls) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ops-key ' + (cls || ''); b.textContent = label; b.dataset.key = key;
      b.setAttribute('aria-label', controls.aria?.[key] || label || key);
      const down = (e) => { e.preventDefault(); b.classList.add('is-down'); try { b.setPointerCapture(e.pointerId); } catch (err) {} this.press(key, true); };
      const up = () => { if (!b.classList.contains('is-down')) return; b.classList.remove('is-down'); this.press(key, false); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    if (controls.type === 'dpad') {
      // one arrow shape, turned four ways, so all four look the same size on every phone
      for (const dir of ['up', 'left', 'right', 'down']) { const b = make(dir, '', 'ops-key--' + dir); const i = document.createElement('i'); i.className = 'ops-arrow'; i.setAttribute('aria-hidden', 'true'); b.append(i); pad.append(b); }
    }
    else if (controls.type === 'one') pad.append(make('a', controls.a));
    else pad.append(make('a', controls.a), make('b', controls.b));
  }
  bindKeys() {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    const key = (e, down) => {
      if (!this.inst || !this.game || this.el.hidden) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const type = this.game.controls.type; let k = null;
      if (e.key === ' ' || e.key === 'Enter') { if (e.target && e.target.tagName === 'BUTTON') return; k = type === 'dpad' ? null : 'a'; }
      else if (map[e.key]) { const dir = map[e.key]; k = type === 'dpad' ? dir : type === 'two' ? (dir === 'left' ? 'a' : dir === 'right' ? 'b' : null) : null; }
      if (!k) return;
      e.preventDefault(); if (down && e.repeat) return;
      this.press(k, down);
    };
    window.addEventListener('keydown', (e) => key(e, true)); window.addEventListener('keyup', (e) => key(e, false));
  }
  // Swiping on the picture steers the grid games; dragging steers the truck.
  bindCanvas() {
    let start = null;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); start = { x: e.clientX, y: e.clientY }; this.setDrag(e); try { c.setPointerCapture(e.pointerId); } catch (err) {} });
    c.addEventListener('pointermove', (e) => {
      if (!start) return; this.setDrag(e);
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) { this.input.taps.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); this.input.swiped = true; start = { x: e.clientX, y: e.clientY }; }
    });
    const end = () => { start = null; this.input.dragX = null; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  }
  setDrag(e) { const r = this.canvas.getBoundingClientRect(); this.input.dragX = (e.clientX - r.left) * (this.W / r.width); }
}

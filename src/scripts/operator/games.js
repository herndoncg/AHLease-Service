// Operator School: the five games. Each one has 5 levels that get harder.
//
// Every game gives back three things the stage uses:
//   update(dt, input)  move things along by dt seconds
//   draw(g, W, H, t)   paint the picture
//   hud()              the numbers shown along the top
// and calls api.win(stars, line) or api.lose(line) when the level ends.
//
// To make a game easier or harder, change the numbers in its LEVELS list.

import { C, DIRS, ANGLE, clamp, lerp, rng, hash, rrect, drawDozer, drawTractor, drawTruck } from './engine.js';

// ============================================================ 1. DOZER: level the pad

const DOZER_LEVELS = [
  { w: 5, h: 5, spots: 3, deep: 0, rocks: 0, cap: 2, seed: 11 },
  { w: 6, h: 6, spots: 5, deep: 0, rocks: 2, cap: 3, seed: 23 },
  { w: 7, h: 7, spots: 7, deep: 1, rocks: 3, cap: 3, seed: 37 },
  { w: 7, h: 8, spots: 9, deep: 2, rocks: 5, cap: 3, seed: 41 },
  { w: 8, h: 9, spots: 12, deep: 3, rocks: 7, cap: 4, seed: 53 },
];

function reachable(w, h, blocked, from) {
  const dist = new Int16Array(w * h).fill(-1), prev = new Int16Array(w * h).fill(-1), q = [from]; dist[from] = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx; if (blocked[n] || dist[n] >= 0) continue;
      dist[n] = dist[i] + 1; prev[n] = i; q.push(n);
    }
  }
  return { dist, prev, count: q.length };
}

function buildPad(L) {
  for (let tryNo = 0; tryNo < 40; tryNo++) {
    const r = rng(L.seed + tryNo * 101), n = L.w * L.h, start = (L.h - 1) * L.w + (L.w >> 1);
    const rock = new Uint8Array(n), ht = new Int8Array(n);
    const free = () => { for (;;) { const i = (r() * n) | 0; if (i !== start && !rock[i] && !ht[i]) return i; } };
    for (let k = 0; k < L.rocks; k++) rock[free()] = 1;
    if (reachable(L.w, L.h, rock, start).count !== n - L.rocks) continue;
    for (let k = 0; k < L.spots; k++) { ht[free()] = k < L.deep ? 2 : 1; ht[free()] = k < L.deep ? -2 : -1; }
    return { rock, ht, start };
  }
  throw new Error('pad');
}
// Dirt comes off a high spot onto the blade, or off the blade into a low spot.
function settle(ht, i, st, cap) {
  if (ht[i] > 0 && st.load < cap) { const k = Math.min(ht[i], cap - st.load); ht[i] -= k; st.load += k; return k; }
  if (ht[i] < 0 && st.load > 0) { const k = Math.min(-ht[i], st.load); ht[i] += k; st.load -= k; return -k; }
  return 0;
}
// A plain, sensible way to do the job (always go to the nearest useful spot). Its move count is "par".
function dozerPar(L, pad) {
  const ht = Int8Array.from(pad.ht), st = { load: 0 }; let pos = pad.start, moves = 0;
  for (let guard = 0; guard < 400 && ht.some((v) => v); guard++) {
    const { dist, prev } = reachable(L.w, L.h, pad.rock, pos); let best = -1;
    for (let i = 0; i < ht.length; i++) {
      const useful = (ht[i] > 0 && st.load < L.cap) || (ht[i] < 0 && st.load > 0);
      if (useful && dist[i] > 0 && (best < 0 || dist[i] < dist[best] || (dist[i] === dist[best] && ht[i] < 0 && ht[best] > 0))) best = i;
    }
    if (best < 0) break;
    const path = []; for (let i = best; i !== pos; i = prev[i]) path.push(i);
    for (let k = path.length - 1; k >= 0; k--) { moves++; settle(ht, path[k], st, L.cap); }
    pos = best;
  }
  return moves;
}

const dozer = {
  id: 'dozer', machine: 'Dozer', name: 'Level the pad',
  blurb: 'Cut the high spots, fill the low spots, and bring the pad to grade.',
  how: ['Drive with the arrows (or swipe).', 'Run over a light mound to load the blade. Run over a dark hole to drop it in.', 'Finish before the fuel runs out. Fewer moves earns more stars.'],
  tip: 'On a real pad, the dirt you cut from the high side is the dirt that fills the low side. Moving it once beats moving it twice.',
  controls: { type: 'dpad', aria: { up: 'Drive up', down: 'Drive down', left: 'Drive left', right: 'Drive right' } },
  levels: DOZER_LEVELS.length,
  create(level, api) {
    const L = DOZER_LEVELS[level], pad = buildPad(L), ht = pad.ht, orig = Int8Array.from(ht);
    const par = dozerPar(L, pad), fuel = Math.ceil(par * 2) + 4, st = { load: 0 };
    let x = pad.start % L.w, y = (pad.start / L.w) | 0, fx = x, fy = y, t = 1, dir = 'up', moves = 0, queued = null, over = false;
    const pops = [], tracks = new Uint8Array(L.w * L.h); tracks[pad.start] = 1;
    const left = () => ht.reduce((s, v) => s + (v ? 1 : 0), 0);
    return {
      update(dt, input) {
        for (const p of pops) p.age += dt; while (pops.length && pops[0].age > 0.8) pops.shift();
        for (const k of input.taps) if (DIRS[k]) queued = k;
        if (over) return;
        if (t < 1) {
          t = Math.min(1, t + dt * 7);
          if (t === 1) {
            const i = y * L.w + x, k = settle(ht, i, st, L.cap); tracks[i] = 1;
            if (k) { pops.push({ x, y, age: 0, text: k > 0 ? 'CUT' : 'FILL' }); api.buzz(12); }
            if (!left()) { over = true; const stars = moves <= Math.ceil(par * 1.15) ? 3 : moves <= Math.ceil(par * 1.6) ? 2 : 1; api.win(stars, `Pad is on grade in ${moves} moves. A sharp operator does it in ${par}.`); }
            else if (moves >= fuel) { over = true; api.lose('Out of fuel before the pad was on grade.'); }
          }
          return;
        }
        const want = queued || input.dir; queued = null; if (!want) return;
        dir = want; const nx = x + DIRS[want][0], ny = y + DIRS[want][1];
        if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h || pad.rock[ny * L.w + nx]) return;
        fx = x; fy = y; x = nx; y = ny; t = 0; moves++;
      },
      draw(g, W, H) {
        const cs = Math.floor(Math.min((W - 28) / L.w, (H - 28) / L.h)), ox = (W - cs * L.w) / 2, oy = (H - cs * L.h) / 2;
        g.fillStyle = '#5c6b45'; g.fillRect(0, 0, W, H);
        g.fillStyle = C.dirtDark; rrect(g, ox - 8, oy - 8, cs * L.w + 16, cs * L.h + 16, 8); g.fill();
        for (let cy = 0; cy < L.h; cy++) for (let cx = 0; cx < L.w; cx++) {
          const i = cy * L.w + cx, px = ox + cx * cs, py = oy + cy * cs, v = ht[i], mid = cs / 2;
          g.fillStyle = hash(cx, cy) > 0.5 ? C.dirt : '#876746'; g.fillRect(px, py, cs + 0.5, cs + 0.5);
          if (tracks[i] && !v) { g.strokeStyle = 'rgba(60,44,28,0.35)'; g.lineWidth = Math.max(1, cs * 0.05); for (const off of [0.3, 0.7]) { g.beginPath(); g.moveTo(px + cs * off, py + 3); g.lineTo(px + cs * off, py + cs - 3); g.stroke(); } }
          if (orig[i] && !v) { g.strokeStyle = 'rgba(212,162,0,0.75)'; g.lineWidth = Math.max(1.5, cs * 0.06); g.beginPath(); g.moveTo(px + cs * 0.34, py + mid); g.lineTo(px + cs * 0.46, py + cs * 0.62); g.lineTo(px + cs * 0.68, py + cs * 0.36); g.stroke(); }
          if (pad.rock[i]) {
            g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(px + mid + 2, py + mid + 3, cs * 0.36, cs * 0.3, 0, 0, 7); g.fill();
            g.fillStyle = '#8d8f8b'; g.beginPath(); g.moveTo(px + cs * 0.2, py + cs * 0.62); g.lineTo(px + cs * 0.3, py + cs * 0.28); g.lineTo(px + cs * 0.62, py + cs * 0.18); g.lineTo(px + cs * 0.82, py + cs * 0.46); g.lineTo(px + cs * 0.7, py + cs * 0.78); g.lineTo(px + cs * 0.36, py + cs * 0.8); g.closePath(); g.fill();
            g.fillStyle = '#a9aba6'; g.beginPath(); g.moveTo(px + cs * 0.32, py + cs * 0.32); g.lineTo(px + cs * 0.6, py + cs * 0.24); g.lineTo(px + cs * 0.52, py + cs * 0.5); g.closePath(); g.fill();
          } else if (v > 0) {
            g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(px + mid + 2, py + mid + 3, cs * 0.4, cs * 0.34, 0, 0, 7); g.fill();
            g.fillStyle = C.mound; g.beginPath(); g.ellipse(px + mid, py + mid, cs * 0.4, cs * 0.34, 0, 0, 7); g.fill();
            g.fillStyle = '#dcc194'; g.beginPath(); g.ellipse(px + mid - cs * 0.06, py + mid - cs * 0.07, cs * 0.24, cs * 0.18, 0, 0, 7); g.fill();
            if (v > 1) { g.fillStyle = '#efdcb6'; g.beginPath(); g.ellipse(px + mid - cs * 0.08, py + mid - cs * 0.1, cs * 0.12, cs * 0.09, 0, 0, 7); g.fill(); }
          } else if (v < 0) {
            g.fillStyle = C.hole; g.beginPath(); g.ellipse(px + mid, py + mid, cs * 0.4, cs * 0.34, 0, 0, 7); g.fill();
            g.fillStyle = v < -1 ? '#120c07' : C.holeDeep; g.beginPath(); g.ellipse(px + mid, py + mid + cs * 0.04, cs * (v < -1 ? 0.28 : 0.22), cs * (v < -1 ? 0.22 : 0.16), 0, 0, 7); g.fill();
          }
        }
        g.strokeStyle = 'rgba(40,28,16,0.22)'; g.lineWidth = 1; g.beginPath();
        for (let cx = 1; cx < L.w; cx++) { g.moveTo(ox + cx * cs, oy); g.lineTo(ox + cx * cs, oy + cs * L.h); }
        for (let cy = 1; cy < L.h; cy++) { g.moveTo(ox, oy + cy * cs); g.lineTo(ox + cs * L.w, oy + cy * cs); } g.stroke();
        for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const px = ox + sx * cs * L.w, py = oy + sy * cs * L.h; g.fillStyle = '#e9e4d6'; g.fillRect(px - 1.5, py - 12, 3, 14); g.fillStyle = C.gold; g.beginPath(); g.moveTo(px + 1.5, py - 12); g.lineTo(px + 10, py - 9); g.lineTo(px + 1.5, py - 6); g.fill(); }
        const e = t * t * (3 - 2 * t), dx = lerp(fx, x, e), dy = lerp(fy, y, e);
        drawDozer(g, ox + (dx + 0.5) * cs, oy + (dy + 0.5) * cs, cs * 0.86, ANGLE[dir], st.load, L.cap);
        g.font = `700 ${Math.max(11, cs * 0.24)}px Archivo Variable, Arial, sans-serif`; g.textAlign = 'center';
        for (const p of pops) { g.globalAlpha = 1 - p.age / 0.8; g.fillStyle = '#fff6d6'; g.fillText(p.text, ox + (p.x + 0.5) * cs, oy + (p.y + 0.2) * cs - p.age * 22); } g.globalAlpha = 1;
      },
      peek: () => ({ x, y, t, ht, rock: pad.rock, load: st.load, cap: L.cap, w: L.w, h: L.h, par }), // for the test bots only
      hud: () => [['Fuel', String(Math.max(0, fuel - moves)), fuel - moves <= Math.ceil(fuel * 0.2)], ['Blade', `${st.load} of ${L.cap}`], ['Spots left', String(left())]],
    };
  },
};

// ============================================================ 2. EXCAVATOR: dig the trench

const DIG_LEVELS = [
  { n: 7, lo: 1, hi: 2, speed: 2.6, lines: 0, seed: 22 },
  { n: 8, lo: 1, hi: 3, speed: 3.2, lines: 1, seed: 41 },
  { n: 9, lo: 2, hi: 3, speed: 3.9, lines: 1, seed: 1 },
  { n: 10, lo: 1, hi: 4, speed: 4.6, lines: 2, seed: 41 },
  { n: 11, lo: 2, hi: 4, speed: 5.4, lines: 2, seed: 30 },
];

const dig = {
  id: 'dig', machine: 'Excavator', name: 'Dig the trench',
  blurb: 'Take every column down to the gold grade line. Not past it.',
  how: ['The bucket swings by itself. Press DIG when it is over a column that still needs digging. One scoop per pass.', 'Stop at the gold line. Digging past it is an over-dig, and three ends the job.', 'Yellow flags mark a buried line. Go past the gold line there and you hit it.'],
  tip: 'Before any real dig, call 811 so buried lines get located and flagged. The call is free.',
  controls: { type: 'one', a: 'DIG' },
  levels: DIG_LEVELS.length,
  create(level, api) {
    const L = DIG_LEVELS[level], r = rng(L.seed), target = [], cur = new Array(L.n).fill(0), line = new Array(L.n).fill(false), bad = new Array(L.n).fill(false);
    let d = L.lo + ((r() * (L.hi - L.lo + 1)) | 0);
    for (let i = 0; i < L.n; i++) { target.push(d); const step = r(); d = clamp(d + (step < 0.3 ? -1 : step > 0.7 ? 1 : 0), L.lo, L.hi); }
    for (let k = 0, guard = 0; k < L.lines && guard < 50; guard++) { const i = 1 + ((r() * (L.n - 2)) | 0); if (!line[i] && !line[i - 1] && !line[i + 1]) { line[i] = true; k++; } }
    const total = target.reduce((a, b) => a + b, 0), par = Math.round(total * 1.1 + 6);
    let p = 0, sdir = 1, digT = 0, digCol = -1, rest = -1, strikes = 0, time = 0, scoops = 0, over = false, flash = 0;
    const remaining = () => target.reduce((s, v, i) => s + Math.max(0, v - cur[i]), 0);
    return {
      update(dt, input) {
        flash = Math.max(0, flash - dt);
        if (over) return;
        time += dt;
        if (digT > 0) {
          digT -= dt;
          if (digT <= 0) {
            const i = digCol; cur[i]++; scoops++; api.buzz(12);
            if (cur[i] > target[i]) {
              bad[i] = true; flash = 0.35;
              if (line[i]) { over = true; return api.lose('You hit a buried line. The flags were the warning: stop at the gold line.'); }
              if (++strikes >= 3) { over = true; return api.lose('Three over-digs. The trench bottom has to be rebuilt.'); }
            }
            if (!remaining()) { over = true; const stars = Math.max(1, 3 - strikes - (time > par ? 1 : 0)); api.win(stars, `Trench is on grade in ${Math.round(time)} seconds with ${strikes} over-dig${strikes === 1 ? '' : 's'}. Target time: ${par} seconds.`); }
          }
          return;
        }
        p += sdir * L.speed * dt;
        if (p > L.n - 1) { p = 2 * (L.n - 1) - p; sdir = -1; } else if (p < 0) { p = -p; sdir = 1; }
        // after a scoop the arm has to swing clear of that column before it can dig again
        if (rest >= 0 && Math.round(p) !== rest) rest = -1;
        if (input.taps.includes('a') && Math.round(p) !== rest) { digCol = rest = Math.round(p); digT = 0.26; }
      },
      draw(g, W, H) {
        const y0 = Math.round(H * 0.44), xl = W * 0.2, cw = Math.min((W - xl - 14) / L.n, 64), rh = Math.min(cw * 0.95, (H - y0 - 18) / 5.6), xr = xl + cw * L.n;
        const sky = g.createLinearGradient(0, 0, 0, y0); sky.addColorStop(0, '#8ea79d'); sky.addColorStop(1, '#b4c4b7'); g.fillStyle = sky; g.fillRect(0, 0, W, y0);
        g.fillStyle = '#5f7f66'; g.beginPath(); g.moveTo(0, y0); for (let x = 0; x <= W; x += 14) g.lineTo(x, y0 - 14 - hash(x, 2) * 16); g.lineTo(W, y0); g.fill();
        // spoil pile on the far bank grows as you dig
        const pile = Math.min(1, scoops / total); g.fillStyle = C.dirtLight; g.beginPath(); g.ellipse(xr - cw * 1.4, y0, cw * (0.6 + 1.5 * pile), rh * (0.2 + 1.2 * pile), 0, Math.PI, 0); g.fill();
        g.fillStyle = C.dirt; g.fillRect(0, y0, W, H - y0);
        for (let row = 0; row < 6; row++) { g.fillStyle = row % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)'; g.fillRect(0, y0 + row * rh, W, rh); }
        g.fillStyle = '#4c5d36'; g.fillRect(0, y0 - 3, W, 6);
        for (let i = 0; i < L.n; i++) {
          const x = xl + i * cw;
          if (cur[i]) { g.fillStyle = '#35281b'; g.fillRect(x, y0 - 3, cw + 0.5, cur[i] * rh + 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y0 - 3, cw + 0.5, 5); }
          if (bad[i]) { g.fillStyle = `rgba(163,39,31,${0.45 + flash})`; g.fillRect(x, y0 + target[i] * rh, cw + 0.5, (cur[i] - target[i]) * rh); }
          if (line[i]) { // the buried line sits just under the grade line
            const py = y0 + (target[i] + 0.5) * rh; g.fillStyle = '#1c1c1c'; g.beginPath(); g.arc(x + cw / 2, py, rh * 0.3, 0, 7); g.fill(); g.fillStyle = C.yellow; g.beginPath(); g.arc(x + cw / 2, py, rh * 0.21, 0, 7); g.fill();
            g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + cw / 2, y0); g.lineTo(x + cw / 2, y0 - 24); g.stroke(); g.fillStyle = C.yellow; g.beginPath(); g.moveTo(x + cw / 2, y0 - 24); g.lineTo(x + cw / 2 + 13, y0 - 19); g.lineTo(x + cw / 2, y0 - 14); g.fill();
          }
          if (cur[i] === target[i]) { g.strokeStyle = '#d7f0c8'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + cw * 0.3, y0 + target[i] * rh - rh * 0.45); g.lineTo(x + cw * 0.45, y0 + target[i] * rh - rh * 0.25); g.lineTo(x + cw * 0.72, y0 + target[i] * rh - rh * 0.65); g.stroke(); }
        }
        g.strokeStyle = C.gold; g.lineWidth = 3; g.setLineDash([7, 5]); g.beginPath();
        for (let i = 0; i < L.n; i++) { const x = xl + i * cw, y = y0 + target[i] * rh; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); g.lineTo(x + cw, y); } g.stroke(); g.setLineDash([]);
        // which column the bucket is over
        const col = digT > 0 ? digCol : Math.round(p); g.fillStyle = 'rgba(255,246,214,0.16)'; g.fillRect(xl + col * cw, y0 - 3, cw, 5.6 * rh);
        g.strokeStyle = 'rgba(255,246,214,0.6)'; g.lineWidth = 1.5; g.strokeRect(xl + col * cw + 0.75, y0 - 3, cw - 1.5, 5.6 * rh);
        // the excavator: tracks and house on the left bank, a two-part arm reaching to the bucket
        const u = Math.min(xl / 11.2, H * 0.022), bx = xl * 0.5, by = y0;
        g.fillStyle = C.tread; rrect(g, bx - 5 * u, by - 2.2 * u, 10 * u, 2.2 * u, 1.1 * u); g.fill();
        g.fillStyle = '#3b413d'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(bx - 3.3 * u + k * 2.2 * u, by - 1.1 * u, 0.6 * u, 0, 7); g.fill(); }
        g.fillStyle = C.yellow; rrect(g, bx - 4.6 * u, by - 6.4 * u, 8.6 * u, 4 * u, 0.7 * u); g.fill(); g.fillStyle = C.yellowDark; g.fillRect(bx - 4.6 * u, by - 3.4 * u, 8.6 * u, 1 * u);
        g.fillStyle = C.green; rrect(g, bx - 0.4 * u, by - 9 * u, 4 * u, 5 * u, 0.6 * u); g.fill(); g.fillStyle = C.glass; rrect(g, bx + 0.3 * u, by - 8.3 * u, 2.7 * u, 2.3 * u, 0.3 * u); g.fill();
        const dip = digT > 0 ? Math.sin((1 - digT / 0.26) * Math.PI) : 0, tx = xl + (p + 0.5) * cw, ty = lerp(y0 - rh * 0.9, y0 + (cur[col] + 0.55) * rh, dip);
        const Px = bx + 2.6 * u, Py = by - 5.6 * u, reach = Math.hypot(xr - Px, y0 + 5 * rh - Py), A = reach * 0.56, B = reach * 0.5;
        const dd = clamp(Math.hypot(tx - Px, ty - Py), Math.abs(A - B) + 1, A + B - 1), base = Math.atan2(ty - Py, tx - Px), el = base - Math.acos(clamp((A * A + dd * dd - B * B) / (2 * A * dd), -1, 1));
        const ex = Px + Math.cos(el) * A, ey = Py + Math.sin(el) * A;
        g.lineCap = 'round'; g.strokeStyle = C.yellowDark; g.lineWidth = Math.max(5, 1.3 * u); g.beginPath(); g.moveTo(Px, Py); g.lineTo(ex, ey); g.stroke();
        g.strokeStyle = C.yellow; g.lineWidth = Math.max(4, 1 * u); g.beginPath(); g.moveTo(ex, ey); g.lineTo(tx, ty); g.stroke(); g.lineCap = 'butt';
        g.fillStyle = C.steel; g.beginPath(); g.arc(ex, ey, Math.max(3, 0.6 * u), 0, 7); g.fill();
        const bw = Math.min(cw * 0.8, 30); g.fillStyle = C.steel; g.beginPath(); g.moveTo(tx - bw / 2, ty - 2); g.lineTo(tx + bw / 2, ty - 2); g.lineTo(tx + bw * 0.38, ty + bw * 0.6); g.lineTo(tx - bw * 0.38, ty + bw * 0.6); g.closePath(); g.fill();
        g.fillStyle = '#59605b'; for (let k = -1; k <= 1; k++) g.fillRect(tx + k * bw * 0.26 - 1.5, ty + bw * 0.55, 3, 5);
      },
      peek: () => ({ p, cur, target, digT, rest, n: L.n, par }),
      hud: () => [['Left to dig', String(remaining())], ['Over-digs', `${strikes} of 3`, strikes >= 2], ['Time', `${Math.floor(time)}s`, time > par]],
    };
  },
};

// ============================================================ 3. TRACTOR: mow the right-of-way

const MOW_LEVELS = [
  { w: 6, h: 8, speed: 3.2, markers: 2, blocks: 0, seed: 3 },
  { w: 7, h: 9, speed: 3.6, markers: 4, blocks: 1, seed: 8 },
  { w: 7, h: 10, speed: 4.0, markers: 5, blocks: 2, seed: 15 },
  { w: 8, h: 10, speed: 4.5, markers: 7, blocks: 3, seed: 22 },
  { w: 8, h: 11, speed: 5.0, markers: 9, blocks: 4, seed: 31 },
];
const GRASS = 0, CUT = 1, MARKER = 2, BLOCK = 3;

function buildRow(L) {
  for (let tryNo = 0; tryNo < 60; tryNo++) {
    const r = rng(L.seed + tryNo * 77), n = L.w * L.h, cell = new Uint8Array(n), start = (L.h - 1) * L.w, pipe = [];
    // the pipeline runs up the right-of-way and its markers sit along it
    let px = 1 + ((r() * (L.w - 2)) | 0);
    for (let y = 0; y < L.h; y++) { pipe.push(px); if (r() < 0.22) px = clamp(px + (r() < 0.5 ? -1 : 1), 1, L.w - 2); }
    const rows = Array.from({ length: L.h - 2 }, (_, i) => i + 1).sort(() => r() - 0.5).slice(0, L.markers);
    for (const y of rows) cell[y * L.w + pipe[y]] = MARKER;
    for (let k = 0, guard = 0; k < L.blocks && guard < 80; guard++) { const i = (r() * n) | 0; if (i !== start && !cell[i] && i % L.w !== pipe[(i / L.w) | 0]) { cell[i] = BLOCK; k++; } }
    const solid = cell.map((v) => (v >= MARKER ? 1 : 0));
    if (reachable(L.w, L.h, solid, start).count !== n - solid.reduce((a, b) => a + b, 0)) continue;
    cell[start] = CUT;
    return { cell, start, pipe };
  }
  throw new Error('row');
}

const mow = {
  id: 'mow', machine: 'Tractor', name: 'Mow the right-of-way',
  blurb: 'Cut every strip of tall grass before the fuel is gone.',
  how: ['Press an arrow (or swipe) to turn. The tractor keeps rolling until something stops it.', 'Go around the yellow pipeline markers. Three hits ends the job.', 'Do not drive the same strip twice. Fuel left over earns stars.'],
  tip: 'Pipeline markers show where a line runs under the right-of-way. A mower goes around them, never over them.',
  controls: { type: 'dpad', aria: { up: 'Turn up', down: 'Turn down', left: 'Turn left', right: 'Turn right' } },
  levels: MOW_LEVELS.length,
  create(level, api) {
    const L = MOW_LEVELS[level], f = buildRow(L), cell = f.cell;
    const grass0 = cell.reduce((s, v) => s + (v === GRASS ? 1 : 0), 0), fuelMax = (grass0 / L.speed) * 1.7 + 4;
    let x = 0, y = L.h - 1, fx = x, fy = y, t = 1, dir = null, want = null, face = 'up', fuel = fuelMax, strikes = 0, stun = 0, over = false, flash = 0, started = false;
    const left = () => cell.reduce((s, v) => s + (v === GRASS ? 1 : 0), 0);
    const at = (d) => { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; return nx < 0 || ny < 0 || nx >= L.w || ny >= L.h ? BLOCK : cell[ny * L.w + nx]; };
    const go = (d) => { dir = face = d; fx = x; fy = y; x += DIRS[d][0]; y += DIRS[d][1]; t = 0; };
    const bump = () => { strikes++; stun = 0.55; flash = 0.4; dir = want = null; api.buzz(60); if (strikes >= 3) { over = true; api.lose('Three pipeline markers hit. Markers get mowed around, not over.'); } };
    return {
      update(dt, input) {
        flash = Math.max(0, flash - dt);
        for (const k of input.taps) if (DIRS[k]) { want = k; started = true; }
        if (over) return;
        if (started) { fuel -= dt; if (fuel <= 0) { fuel = 0; over = true; return api.lose(`Out of fuel with ${left()} strip${left() === 1 ? '' : 's'} still standing.`); } }
        if (stun > 0) { stun -= dt; return; }
        if (t < 1) {
          t = Math.min(1, t + dt * L.speed);
          if (t < 1) return;
          const i = y * L.w + x; if (cell[i] === GRASS) cell[i] = CUT;
          if (!left()) { over = true; const frac = fuel / fuelMax, stars = Math.max(1, (frac >= 0.25 ? 3 : frac >= 0.1 ? 2 : 1) - strikes); return api.win(stars, `Right-of-way is mowed with ${Math.round(frac * 100)}% of the fuel left${strikes ? ` and ${strikes} marker hit${strikes === 1 ? '' : 's'}` : ''}.`); }
        }
        if (want && want !== dir) { const a = at(want); if (a === MARKER) { face = want; return bump(); } if (a !== BLOCK) return go(want); if (!dir) { face = want; want = null; } }
        if (dir) { const a = at(dir); if (a === MARKER) return bump(); if (a === BLOCK) { dir = null; return; } go(dir); }
      },
      draw(g, W, H, time) {
        const cs = Math.floor(Math.min((W - 30) / L.w, (H - 26) / L.h)), ox = (W - cs * L.w) / 2, oy = (H - cs * L.h) / 2;
        g.fillStyle = '#27432a'; g.fillRect(0, 0, W, H);
        for (let k = 0; k < 60; k++) { const tx = hash(k, 1) * W, ty = hash(k, 2) * H; if (tx > ox - 6 && tx < ox + cs * L.w + 6) continue; g.fillStyle = k % 2 ? '#1d3622' : '#31532f'; g.beginPath(); g.arc(tx, ty, 7 + hash(k, 3) * 9, 0, 7); g.fill(); }
        for (let cy = 0; cy < L.h; cy++) for (let cx = 0; cx < L.w; cx++) {
          const v = cell[cy * L.w + cx], px = ox + cx * cs, py = oy + cy * cs;
          if (v === GRASS) {
            g.fillStyle = C.grassTall; g.fillRect(px, py, cs + 0.5, cs + 0.5); g.strokeStyle = C.grassTuft; g.lineWidth = Math.max(1.2, cs * 0.045);
            for (let k = 0; k < 5; k++) { const tx = px + (0.15 + hash(cx * 9 + k, cy) * 0.7) * cs, ty = py + (0.25 + hash(cx, cy * 9 + k) * 0.65) * cs; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - cs * 0.05, ty - cs * 0.16); g.moveTo(tx, ty); g.lineTo(tx + cs * 0.06, ty - cs * 0.14); g.stroke(); }
          } else if (v === MARKER) { g.fillStyle = '#4c7a35'; g.fillRect(px, py, cs + 0.5, cs + 0.5); }
          else if (v === BLOCK) { g.fillStyle = '#8c8a7c'; g.fillRect(px, py, cs + 0.5, cs + 0.5); }
          else { g.fillStyle = (cx + cy) % 2 ? C.grassCut : C.grassCut2; g.fillRect(px, py, cs + 0.5, cs + 0.5); }
        }
        g.strokeStyle = 'rgba(226,170,8,0.4)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath();
        f.pipe.forEach((pxc, cy) => { const X = ox + (pxc + 0.5) * cs, Y = oy + cy * cs; if (!cy) g.moveTo(X, Y); else g.lineTo(X, Y); g.lineTo(X, Y + cs); }); g.stroke(); g.setLineDash([]);
        for (let cy = 0; cy < L.h; cy++) for (let cx = 0; cx < L.w; cx++) {
          const v = cell[cy * L.w + cx], mx = ox + (cx + 0.5) * cs, my = oy + (cy + 0.5) * cs;
          if (v === MARKER) {
            g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(mx + cs * 0.12, my + cs * 0.14, cs * 0.22, cs * 0.14, 0.5, 0, 7); g.fill();
            g.fillStyle = flash > 0 ? C.red : C.yellow; g.beginPath(); g.arc(mx, my, cs * 0.2, 0, 7); g.fill(); g.strokeStyle = '#3a2d00'; g.lineWidth = 1.5; g.stroke();
            g.fillStyle = '#c96a12'; g.beginPath(); g.arc(mx, my, cs * 0.09, 0, 7); g.fill();
          } else if (v === BLOCK) {
            g.fillStyle = '#9b9e97'; rrect(g, mx - cs * 0.4, my - cs * 0.4, cs * 0.8, cs * 0.8, 4); g.fill();
            g.fillStyle = '#6f736c'; g.fillRect(mx - cs * 0.07, my - cs * 0.3, cs * 0.14, cs * 0.6); g.fillRect(mx - cs * 0.3, my - cs * 0.07, cs * 0.6, cs * 0.14);
            g.fillStyle = C.red; g.beginPath(); g.arc(mx, my, cs * 0.13, 0, 7); g.fill();
          }
        }
        const e = t, dx = lerp(fx, x, e), dy = lerp(fy, y, e), shake = stun > 0 ? Math.sin(time * 60) * 2 : 0;
        drawTractor(g, ox + (dx + 0.5) * cs + shake, oy + (dy + 0.5) * cs, cs * 0.92, ANGLE[face], dir ? time * 22 : 0);
        if (!started) { g.fillStyle = 'rgba(7,58,44,0.82)'; rrect(g, W / 2 - 118, 10, 236, 34, 6); g.fill(); g.fillStyle = '#f1f4f1'; g.font = '600 15px Public Sans Variable, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('Press an arrow to start', W / 2, 32); }
      },
      peek: () => ({ x, y, t, dir, stun, cell, w: L.w, h: L.h, frac: fuel / fuelMax }),
      hud: () => [['Fuel', `${Math.round((fuel / fuelMax) * 100)}%`, fuel / fuelMax < 0.2], ['Left to mow', String(left())], ['Marker hits', `${strikes} of 3`, strikes >= 2]],
    };
  },
};

// ============================================================ 4. SPRAY TRUCK: spray the weeds

const SPRAY_LEVELS = [
  { len: 60, speed: 2.0, noChance: 0.16, seed: 4 },
  { len: 75, speed: 2.4, noChance: 0.24, seed: 12 },
  { len: 90, speed: 2.8, noChance: 0.3, seed: 19 },
  { len: 105, speed: 3.2, noChance: 0.34, seed: 27 },
  { len: 120, speed: 3.6, noChance: 0.38, seed: 35 },
];
const SL = 4; // slices per unit of road
const BARE = 0, WEED = 1, NOSPRAY = 2;

function buildSide(L, r, level) {
  const n = L.len * SL, type = new Uint8Array(n), zone = new Int16Array(n).fill(-1), gap = Math.max(0.6, 1.2 - level * 0.12);
  let i = 5 * SL, zid = 0, lastNo = true;
  const run = (len, t, z) => { for (let k = 0; k < len * SL && i < n - 3 * SL; k++, i++) { type[i] = t; zone[i] = z; } };
  while (i < n - 4 * SL) {
    if (!lastNo && r() < L.noChance) { run(gap + 0.4, BARE, -1); run(1.8 + r() * 1.8, NOSPRAY, zid++); run(gap + 0.4, BARE, -1); lastNo = true; }
    else { run(1.5 + r() * 2.5, WEED, -1); run(gap + r() * 1.4, BARE, -1); lastNo = false; }
  }
  return { type, zone, sprayed: new Uint8Array(n), hit: new Set() };
}

const spray = {
  id: 'spray', machine: 'Spray truck', name: 'Spray the weeds',
  blurb: 'Hit the weeds on both sides of the lease road. Keep the spray off pasture and water.',
  how: ['The truck drives itself. Hold LEFT BOOM or RIGHT BOOM while weeds pass the boom line.', 'Let go over bare ground: the tank is only so big.', 'Never spray a NO SPRAY zone (cattle pasture or a pond). Three drifts ends the job.'],
  tip: 'Real applicators spray only what is on the ticket and watch the wind. Drift onto pasture, crops or water is the mistake that costs the most.',
  controls: { type: 'two', a: 'LEFT BOOM', b: 'RIGHT BOOM' },
  levels: SPRAY_LEVELS.length,
  create(level, api) {
    const L = SPRAY_LEVELS[level], r = rng(L.seed), sides = [buildSide(L, r, level), buildSide(L, r, level)];
    const weedTotal = sides.reduce((s, sd) => s + sd.type.reduce((a, v) => a + (v === WEED ? 1 : 0), 0), 0), tankMax = (weedTotal / SL / L.speed) * 1.25 + 1.2;
    let s = 0, tank = tankMax, drift = 0, over = false, flash = 0, on = [false, false];
    const done = () => sides.reduce((a, sd) => a + sd.type.reduce((b, v, i) => b + (v === WEED && sd.sprayed[i] ? 1 : 0), 0), 0);
    return {
      update(dt, input) {
        flash = Math.max(0, flash - dt);
        if (over) return;
        const s0 = s; s += L.speed * dt;
        on = [input.a && tank > 0, input.b && tank > 0];
        for (let k = 0; k < 2; k++) {
          if (!on[k]) continue;
          tank = Math.max(0, tank - dt); const sd = sides[k];
          for (let i = Math.max(0, Math.floor(s0 * SL)); i <= Math.floor(s * SL) && i < sd.type.length; i++) {
            sd.sprayed[i] = 1;
            if (sd.type[i] === NOSPRAY && !sd.hit.has(sd.zone[i])) { sd.hit.add(sd.zone[i]); drift++; flash = 0.5; api.buzz(70); if (drift >= 3) { over = true; return api.lose('Three drifts onto pasture or water. That is a phone call nobody wants.'); } }
          }
        }
        if (s >= L.len) {
          over = true; const pct = done() / weedTotal, shown = Math.round(pct * 100);
          if (pct < 0.55) return api.lose(`Only ${shown}% of the weeds got sprayed. It takes 55% to pass.`);
          api.win(Math.max(1, (pct >= 0.9 ? 3 : pct >= 0.75 ? 2 : 1) - drift), `${shown}% of the weeds sprayed${drift ? ` with ${drift} drift${drift === 1 ? '' : 's'}` : ' and no drift'}.`);
        }
      },
      draw(g, W, H, time) {
        const ppu = H / 9, truckY = H * 0.7, rw = Math.min(W * 0.34, 190), xl = (W - rw) / 2, xr = xl + rw, boomY = truckY + ppu * 0.42, sl = ppu / SL;
        const yOf = (i) => boomY - (i / SL - s) * ppu; // screen y of the near edge of slice i
        g.fillStyle = '#93975f'; g.fillRect(0, 0, W, H);
        const signs = [], first = Math.max(0, Math.floor((s - 3) * SL)), last = Math.min(L.len * SL - 1, Math.ceil((s + 8) * SL));
        for (let k = 0; k < 2; k++) {
          const sd = sides[k], x0 = k ? xr : 0, w = xl, edge = k ? xr : xl;
          for (let i = first; i <= last; i++) {
            const y = yOf(i) - sl, v = sd.type[i], sp = sd.sprayed[i];
            if (v === WEED) {
              g.fillStyle = sp ? '#7f8a4c' : C.weed; g.fillRect(x0, y, w, sl + 0.6);
              g.strokeStyle = sp ? '#646d3c' : C.weedDark; g.lineWidth = 2; g.lineCap = 'round';
              for (let q = 0; q < 3; q++) { const bx = x0 + (0.1 + hash(i, q + k * 7) * 0.8) * w, by = y + sl * (0.25 + hash(i + 50, q + k * 7) * 0.5), rad = 4 + hash(i, q + 30) * 3; g.beginPath(); for (let a = 0; a < 5; a++) { const an = a * 1.257 + hash(i, q) * 3; g.moveTo(bx, by); g.lineTo(bx + Math.cos(an) * rad, by + Math.sin(an) * rad); } g.stroke(); if (!sp && q === 0) { g.fillStyle = '#e6c53a'; g.beginPath(); g.arc(bx, by, 1.8, 0, 7); g.fill(); } }
              g.lineCap = 'butt';
              if (sp) { g.fillStyle = 'rgba(63,127,168,0.3)'; g.fillRect(x0, y, w, sl + 0.6); }
            } else if (v === NOSPRAY) {
              const pond = sd.zone[i] % 2 === 0; g.fillStyle = pond ? C.water : '#b9a25c'; g.fillRect(x0, y, w, sl + 0.6);
              if (pond) { g.fillStyle = 'rgba(255,255,255,0.14)'; if (i % 3 === 0) g.fillRect(x0 + hash(i, 5) * w * 0.7, y + sl * 0.4, w * 0.22, 2); }
              else if (i % 5 === 2) { const bx = x0 + (0.25 + hash(i, 8) * 0.5) * w; g.fillStyle = '#4a3423'; g.beginPath(); g.ellipse(bx, y + sl * 0.5, 9, 6, 0, 0, 7); g.fill(); g.beginPath(); g.arc(bx + 9, y + sl * 0.3, 4, 0, 7); g.fill(); g.fillStyle = '#e9e4d6'; g.beginPath(); g.ellipse(bx - 2, y + sl * 0.5, 3.5, 2.5, 0, 0, 7); g.fill(); }
              if (sp) { g.fillStyle = 'rgba(163,39,31,0.5)'; g.fillRect(x0, y, w, sl + 0.6); }
              if (sd.zone[i - 1] !== sd.zone[i] || sd.zone[i + 1] !== sd.zone[i]) { g.fillStyle = C.red; g.fillRect(x0, sd.zone[i - 1] !== sd.zone[i] ? y + sl - 3 : y, w, 3); }
              if (sd.zone[i - 1] !== sd.zone[i]) signs.push([edge + (k ? 6 : -78), y + sl]);
            } else if (sp) { g.fillStyle = 'rgba(63,127,168,0.2)'; g.fillRect(x0, y, w, sl + 0.6); }
          }
        }
        for (const [sx, sy] of signs) { g.fillStyle = '#e9e4d6'; rrect(g, sx, sy - 30, 72, 20, 3); g.fill(); g.strokeStyle = C.red; g.lineWidth = 2; g.stroke(); g.fillStyle = C.red; g.font = '700 11px Archivo Variable, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('NO SPRAY', sx + 36, sy - 16); }
        g.fillStyle = C.road; g.fillRect(xl, 0, rw, H); g.fillStyle = C.road2; g.fillRect(xl, 0, 4, H); g.fillRect(xr - 4, 0, 4, H);
        g.fillStyle = 'rgba(70,62,50,0.3)'; for (let k = 0; k < 46; k++) { const gy = ((hash(k, 4) * H * 1.3 + s * ppu) % (H * 1.3)) - H * 0.15; g.fillRect(xl + 8 + hash(k, 6) * (rw - 16), gy, 3, 2); }
        if (s > L.len - 9) { const fy = boomY - (L.len - s) * ppu; for (let q = 0; q < 8; q++) { g.fillStyle = q % 2 ? '#1a1a1a' : '#e9e4d6'; g.fillRect(xl + (q * rw) / 8, fy - 10, rw / 8, 10); } }
        g.strokeStyle = 'rgba(255,246,214,0.75)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(0, boomY); g.lineTo(xl, boomY); g.moveTo(xr, boomY); g.lineTo(W, boomY); g.stroke(); g.setLineDash([]);
        for (let k = 0; k < 2; k++) if (on[k]) { // the spray fan
          const x0 = k ? xr : xl, x1 = k ? W : 0; g.fillStyle = 'rgba(190,225,240,0.5)'; g.beginPath(); g.moveTo(x0, boomY - 3); g.lineTo(x1, boomY - ppu * 0.2); g.lineTo(x1, boomY + ppu * 0.28); g.lineTo(x0, boomY + 5); g.fill();
          g.fillStyle = 'rgba(235,248,255,0.8)'; for (let q = 0; q < 10; q++) { const fx = lerp(x0, x1, hash(q, (time * 20) | 0)), fyy = boomY + (hash(q + 20, (time * 20) | 0) - 0.4) * ppu * 0.3; g.fillRect(fx, fyy, 2, 2); }
        }
        drawTruck(g, W / 2, truckY, Math.min(rw * 0.9, ppu * 1.05) , 0, 'spray', { tank: tank / tankMax });
        if (flash > 0) { g.fillStyle = `rgba(163,39,31,${flash * 0.5})`; g.fillRect(0, 0, W, H); g.fillStyle = '#fff6d6'; g.font = '700 26px Archivo Variable, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('DRIFT!', W / 2, H * 0.3); }
      },
      peek: () => ({ s, sides, tank: tank / tankMax }),
      hud: () => [['Tank', `${Math.round((tank / tankMax) * 100)}%`, tank / tankMax < 0.15], ['Weeds sprayed', `${Math.round((done() / weedTotal) * 100)}%`], ['Drift', `${drift} of 3`, drift >= 2]],
    };
  },
};

// ============================================================ 5. DUMP TRUCK: rock the road

const ROCK_LEVELS = [
  { len: 16, speed: 0.5, hw: 0.3, amp: 0.3, holes: 5, big: 0, seed: 6 },
  { len: 18, speed: 0.56, hw: 0.27, amp: 0.36, holes: 7, big: 1, seed: 13 },
  { len: 21, speed: 0.62, hw: 0.25, amp: 0.42, holes: 9, big: 2, seed: 20 },
  { len: 24, speed: 0.68, hw: 0.23, amp: 0.46, holes: 10, big: 2, seed: 28 },
  { len: 27, speed: 0.74, hw: 0.22, amp: 0.48, holes: 11, big: 3, seed: 37 },
];

const rock = {
  id: 'rock', machine: 'Dump truck', name: 'Rock the road',
  blurb: 'Haul a full load of rock down the lease road to the location without spilling it.',
  how: ['Hold LEFT or RIGHT to steer (or drag your finger across the road).', 'Stay on the rock road. Running off into the pasture spills your load.', 'Dodge the potholes and washouts. The more rock you deliver, the more stars.'],
  tip: 'A lease road is only as good as the rock that actually gets put on it. A load that stays in the bed is a load that builds road.',
  controls: { type: 'two', a: '◀ LEFT', b: 'RIGHT ▶', aria: { a: 'Steer left', b: 'Steer right' } },
  levels: ROCK_LEVELS.length,
  create(level, api) {
    const L = ROCK_LEVELS[level], r = rng(L.seed), p1 = r() * 6, p2 = r() * 6;
    // where the middle of the road is, s screens down the road (straight at the start and at the end)
    const center = (s) => { const ease = clamp((s - 0.8) / 1.5, 0, 1) * clamp((L.len - 0.6 - s) / 1.5, 0, 1); return L.amp * ease * (0.62 * Math.sin(s * 1.7 + p1) + 0.38 * Math.sin(s * 3.1 + p2)); };
    const holes = [];
    for (let k = 0; k < L.holes + L.big; k++) { const big = k < L.big, s = 2.5 + ((k + r() * 0.6) / (L.holes + L.big)) * (L.len - 5); const rad = big ? 0.08 : 0.045;
      // every hole leaves room to get around it on one side
      const least = Math.max(0, 0.16 + rad + 0.06 - L.hw), most = L.hw - 0.06;
      holes.push({ s, off: (r() < 0.5 ? -1 : 1) * (least + r() * (most - least)), rad, big, hit: false }); }
    let s = 0, x = 0, vx = 0, load = 100, over = false, off = false, flash = 0; const spill = [];
    return {
      update(dt, input) {
        flash = Math.max(0, flash - dt);
        if (over) return;
        let steer = (input.b ? 1 : 0) - (input.a ? 1 : 0);
        if (!steer && input.dragX != null && this.px) { const want = (input.dragX - this.px.mid) / this.px.half; steer = clamp((want - x) * 8, -1, 1); }
        vx = lerp(vx, steer * 1.6, Math.min(1, dt * 12)); x = clamp(x + vx * dt, -0.95, 0.95);
        off = Math.abs(x - center(s)) > L.hw - 0.05;
        s += L.speed * (off ? 0.6 : 1) * dt;
        if (off) { load -= 16 * dt; if (hash((s * 40) | 0, 1) > 0.5) spill.push({ s, x: x + (hash((s * 90) | 0, 2) - 0.5) * 0.1 }); }
        const px = this.px;
        for (const h of holes) if (px && !h.hit && Math.abs(h.s - s) * px.H < (h.rad * 0.72 + 0.16) * px.half && Math.abs(center(h.s) + h.off - x) < h.rad + 0.06) { h.hit = true; load -= h.big ? 15 : 8; flash = 0.3; api.buzz(50); for (let q = 0; q < 5; q++) spill.push({ s: s - 0.02 * q, x: x + (hash(q, (s * 50) | 0) - 0.5) * 0.14 }); }
        if (spill.length > 160) spill.splice(0, spill.length - 160);
        if (load <= 0) { load = 0; over = true; return api.lose('The bed is empty. Every yard of rock is back there in the pasture.'); }
        if (s >= L.len) { over = true; const pct = Math.round(load); if (pct < 40) return api.lose(`Only ${pct}% of the load made it. It takes 40% to pass.`); api.win(pct >= 85 ? 3 : pct >= 65 ? 2 : 1, `${pct}% of the load delivered to the location.`); }
      },
      draw(g, W, H, time) {
        const PW = Math.min(W, 560), half = PW / 2, mid = W / 2, truckY = H * 0.74; this.px = { mid, half, H };
        const X = (nx) => mid + nx * half, Y = (ws) => truckY - (ws - s) * H;
        g.fillStyle = '#7f8c4f'; g.fillRect(0, 0, W, H);
        const base = Math.floor(s * 4);
        for (let k = base - 2; k < base + 7; k++) for (let q = 0; q < 4; q++) { // brush and scrub in the pasture
          const ws = (k + hash(k, q)) / 4, nx = (hash(k, q + 10) * 2 - 1) * (W / PW);
          if (Math.abs(nx - center(ws)) < L.hw + 0.12) continue;
          g.fillStyle = q % 2 ? '#56703a' : '#687f44'; g.beginPath(); g.arc(X(nx), Y(ws), 6 + hash(k, q + 20) * 8, 0, 7); g.fill();
        }
        const step = 4, hwpx = L.hw * half;
        for (let y = -step; y < H + step; y += step) { const ws = s + (truckY - y) / H, cx = X(center(ws)); g.fillStyle = C.rockDark; g.fillRect(cx - hwpx - 4, y, hwpx * 2 + 8, step + 1); }
        for (let y = -step; y < H + step; y += step) { const ws = s + (truckY - y) / H, cx = X(center(ws)); g.fillStyle = ws >= L.len ? '#cfc8b8' : C.rock; g.fillRect(ws >= L.len ? cx - hwpx * 2.4 : cx - hwpx, y, ws >= L.len ? hwpx * 4.8 : hwpx * 2, step + 1); }
        g.fillStyle = 'rgba(80,74,64,0.35)'; for (let k = base * 3 - 4; k < base * 3 + 40; k++) { const ws = k / 12 + hash(k, 3) * 0.05; const yy = Y(ws); if (yy < -4 || yy > H + 4 || ws >= L.len) continue; g.fillRect(X(center(ws) + (hash(k, 5) * 2 - 1) * (L.hw - 0.03)), yy, 3, 2); }
        if (Y(L.len) > -40) { g.fillStyle = C.gold; g.fillRect(X(center(L.len)) - hwpx * 2.4, Y(L.len) - 4, hwpx * 4.8, 4); g.fillStyle = C.deep; g.font = '700 15px Archivo Variable, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('LOCATION', X(center(L.len)), Y(L.len) - 14); }
        for (const h of holes) { const yy = Y(h.s); if (yy < -30 || yy > H + 30) continue; const hx = X(center(h.s) + h.off), rr = h.rad * half; g.fillStyle = h.big ? '#4b3c2b' : '#5d5448'; g.beginPath(); g.ellipse(hx, yy, rr, rr * 0.72, 0, 0, 7); g.fill(); g.fillStyle = h.big ? '#2e2419' : '#3f382f'; g.beginPath(); g.ellipse(hx, yy + rr * 0.08, rr * 0.62, rr * 0.42, 0, 0, 7); g.fill(); }
        g.fillStyle = '#d5cfc2'; for (const p of spill) { const yy = Y(p.s); if (yy > H + 4) continue; g.fillRect(X(p.x) - 2, yy, 4, 3); }
        const shake = off ? Math.sin(time * 50) * 2 : 0;
        drawTruck(g, X(x) + shake, truckY, PW * 0.2, vx * 0.14, 'dump', { fill: load / 100 });
        if (off) { g.fillStyle = 'rgba(7,58,44,0.85)'; rrect(g, mid - 96, 12, 192, 32, 6); g.fill(); g.fillStyle = '#fff6d6'; g.font = '700 15px Archivo Variable, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('OFF THE ROAD: SPILLING', mid, 33); }
        if (flash > 0) { g.fillStyle = `rgba(163,39,31,${flash * 0.6})`; g.fillRect(0, 0, W, H); }
      },
      peek: () => ({ s, x, center, holes, hw: L.hw, load }),
      hud: () => [['Load', `${Math.round(load)}%`, load < 50], ['To location', `${Math.max(0, Math.round((1 - s / L.len) * 100))}%`]],
    };
  },
};

export const GAMES = [dozer, dig, mow, spray, rock];

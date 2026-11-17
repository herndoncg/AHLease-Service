// Checks that every Operator School level can be beaten: a simple robot player plays all 25 levels.
// If someone changes a level's numbers and makes it impossible, this fails. Run with: npm test
import { GAMES } from '../src/scripts/operator/games.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// first step of the shortest way from `from` to the nearest cell that `goal` accepts
function stepToward(w, h, blocked, from, goal) {
  const prev = new Int16Array(w * h).fill(-1), seen = new Uint8Array(w * h), q = [from]; seen[from] = 1;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi];
    if (i !== from && goal(i)) { let j = i; while (prev[j] !== from) j = prev[j]; const dx = (j % w) - (from % w), dy = ((j / w) | 0) - ((from / w) | 0); return dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; }
    for (const [dx, dy] of Object.values(DIRS)) { const nx = (i % w) + dx, ny = ((i / w) | 0) + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const n = ny * w + nx; if (blocked(n) || seen[n]) continue; seen[n] = 1; prev[n] = i; q.push(n); }
  }
  return null;
}
const robots = {
  dozer: (s, input) => { if (s.t < 1) return; const d = stepToward(s.w, s.h, (i) => s.rock[i], s.y * s.w + s.x, (i) => (s.ht[i] > 0 && s.load < s.cap) || (s.ht[i] < 0 && s.load > 0)); if (d) input.taps.push(d); },
  dig: (s, input) => { const c = Math.round(s.p); if (s.digT <= 0 && c !== s.rest && s.cur[c] < s.target[c] && Math.abs(s.p - c) < 0.3) input.taps.push('a'); },
  mow: (s, input) => {
    if (s.stun > 0) return;
    if (s.dir) { const nx = s.x + DIRS[s.dir][0], ny = s.y + DIRS[s.dir][1]; if (nx >= 0 && ny >= 0 && nx < s.w && ny < s.h && s.cell[ny * s.w + nx] === 0) return; }
    const d = stepToward(s.w, s.h, (i) => s.cell[i] >= 2, s.y * s.w + s.x, (i) => s.cell[i] === 0); if (d && d !== s.dir) input.taps.push(d);
  },
  spray: (s, input) => { const i = Math.floor(s.s * 4); input.a = s.sides[0].type[i] === 1; input.b = s.sides[1].type[i] === 1; },
  rock: (s, input) => {
    let aim = s.center(s.s + 0.1); const h = s.holes.find((h) => !h.hit && h.s > s.s - 0.08);
    if (h && h.s - s.s < 0.45) { const hc = s.center(h.s), block = h.rad + 0.1; aim = Math.max(hc - s.hw + 0.07, Math.min(hc + s.hw - 0.07, hc + h.off + (h.off > 0 ? -block : block))); }
    input.a = aim - s.x < -0.015; input.b = aim - s.x > 0.015;
  },
};

let failed = 0;
for (const game of GAMES) {
  const line = [];
  for (let level = 0; level < game.levels; level++) {
    let result = null; const inst = game.create(level, { win: (stars) => (result = stars), lose: () => (result = 0), buzz() {} });
    inst.px = { mid: 195, half: 195, H: 600 }; // a phone-sized picture, for the truck game's pothole check
    const input = { dir: null, a: false, b: false, taps: [], dragX: null };
    for (let frame = 0; result === null && frame < 60 * 300; frame++) { robots[game.id](inst.peek(), input); inst.update(1 / 60, input); input.taps.length = 0; }
    if (!result) failed++;
    line.push(result ? `L${level + 1} ${'★'.repeat(result)}` : `L${level + 1} LOST`);
  }
  console.log(`  ${game.id.padEnd(6)} ${line.join('   ')}`);
}
if (failed) { console.error(`\n${failed} level(s) could not be beaten by the robot player.`); process.exit(1); }
console.log('\nOperator School games: all 25 levels can be beaten.');

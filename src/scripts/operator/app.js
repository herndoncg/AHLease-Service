// Jobsite Games (/games/): the page around the games.
// - shows each game's levels and stars, and the player's rank
// - opens a game full screen, shows the "how to play" card and the result card
// - signs a player in or out and keeps their levels
//
// Where levels are kept:
//   Guest      -> in this browser only (localStorage). Nothing is sent anywhere.
//   Signed in  -> on the A&H server too, under the operator name, so they follow the player to any device.
// The password is only ever sent to our own server over https when signing in. It is never kept in the
// browser, and page scripts cannot read the sign-in cookie.

import { GAMES } from './games.js';
import { Stage, starText, drawDozer, drawTractor, drawTruck, C, rrect } from './engine.js';

const KEY = 'ah_ops_v1';
export const RANKS = [[0, 'Greenhorn'], [8, 'Ground hand'], [20, 'Operator'], [36, 'Lead operator'], [54, 'Foreman'], [75, 'Top hand']];
const MAX = GAMES.reduce((s, g) => s + g.levels * 3, 0);

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// ---------- levels ----------
const clean = (raw) => Object.fromEntries(GAMES.map((g) => [g.id, Array.from({ length: g.levels }, (_, i) => { const v = Number(raw?.[g.id]?.[i]); return Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0; })]));
const merge = (a, b) => { const x = clean(a), y = clean(b); return Object.fromEntries(GAMES.map((g) => [g.id, x[g.id].map((v, i) => Math.max(v, y[g.id][i]))])); };
const readLocal = () => { try { return clean(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return clean({}); } };
const writeLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) {} };
const total = () => GAMES.reduce((s, g) => s + progress[g.id].reduce((a, b) => a + b, 0), 0);
const rankOf = (stars) => { let i = 0; while (i + 1 < RANKS.length && stars >= RANKS[i + 1][0]) i++; return i; };
const unlocked = (g, i) => i === 0 || progress[g.id][i - 1] > 0;

let progress = readLocal();
let user = null; // the operator name when signed in

// ---------- talking to the server ----------
async function call(path, body) {
  try {
    const res = await fetch('/api/operator/' + path, body === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (data && typeof data === 'object') return data;
    return { ok: false, message: res.status === 429 ? 'Too many tries. Wait a minute and try again.' : 'Sign-in is not available right now. Your levels are still saved on this device.' };
  } catch (e) { return { ok: false, message: 'No connection. Your levels are still saved on this device.' }; }
}

// ---------- the games list ----------
const hub = $('[data-ops-hub]');
function drawIcon(canvas, id) {
  const g = canvas.getContext('2d'), s = canvas.width; g.clearRect(0, 0, s, s);
  g.fillStyle = id === 'mow' ? C.grassCut : id === 'spray' ? '#93975f' : id === 'rock' ? C.rock : C.dirt; rrect(g, 0, 0, s, s, s * 0.12); g.fill();
  const m = s / 2;
  if (id === 'dozer') { g.fillStyle = C.mound; g.beginPath(); g.ellipse(m, s * 0.16, s * 0.3, s * 0.1, 0, 0, 7); g.fill(); drawDozer(g, m, m * 1.1, s * 0.72, 0, 2, 3); }
  else if (id === 'mow') { g.fillStyle = C.grassTall; g.fillRect(0, 0, s, s * 0.34); drawTractor(g, m, m * 1.05, s * 0.74, 0, 0.6); }
  else if (id === 'spray') { g.fillStyle = C.road; g.fillRect(s * 0.3, 0, s * 0.4, s); g.fillStyle = C.weed; g.fillRect(0, s * 0.5, s * 0.3, s * 0.3); g.fillRect(s * 0.7, s * 0.1, s * 0.3, s * 0.34); drawTruck(g, m, m * 0.95, s * 0.6, 0, 'spray'); }
  else if (id === 'rock') { g.fillStyle = '#7f8c4f'; g.fillRect(0, 0, s * 0.18, s); g.fillRect(s * 0.82, 0, s * 0.18, s); drawTruck(g, m, m, s * 0.72, 0, 'dump', { fill: 0.9 }); }
  else { // excavator from the side, over a trench
    const u = s / 20; g.fillStyle = '#9db3aa'; rrect(g, 0, 0, s, s * 0.62, s * 0.12); g.fill(); g.fillStyle = C.dirt; g.fillRect(0, s * 0.6, s, s * 0.28); g.fillStyle = '#35281b'; g.fillRect(s * 0.58, s * 0.6, s * 0.26, s * 0.22);
    g.fillStyle = C.tread; rrect(g, 1.5 * u, 10 * u, 9 * u, 2 * u, u); g.fill(); g.fillStyle = C.yellow; rrect(g, 2 * u, 6.4 * u, 7.6 * u, 3.6 * u, 0.6 * u); g.fill(); g.fillStyle = C.green; rrect(g, 5.4 * u, 4 * u, 3.6 * u, 4.4 * u, 0.5 * u); g.fill(); g.fillStyle = C.glass; g.fillRect(6 * u, 4.6 * u, 2.4 * u, 2 * u);
    g.lineCap = 'round'; g.strokeStyle = C.yellowDark; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(8.6 * u, 6.8 * u); g.lineTo(13 * u, 3 * u); g.stroke(); g.strokeStyle = C.yellow; g.lineWidth = u; g.beginPath(); g.moveTo(13 * u, 3 * u); g.lineTo(14.4 * u, 11 * u); g.stroke(); g.lineCap = 'butt';
    g.fillStyle = C.steel; g.beginPath(); g.moveTo(13 * u, 11 * u); g.lineTo(15.8 * u, 11 * u); g.lineTo(15.2 * u, 13.4 * u); g.lineTo(13.4 * u, 13.4 * u); g.closePath(); g.fill();
  }
}

function renderHub() {
  const stars = total(), r = rankOf(stars), next = RANKS[r + 1];
  $('[data-rank]').textContent = RANKS[r][1];
  $('[data-stars]').textContent = `${stars} of ${MAX} stars`;
  $('[data-next]').textContent = next ? `Next rank: ${next[1]} at ${next[0]} stars` : 'Top of the ladder. Every level, three stars.';
  const from = RANKS[r][0], to = next ? next[0] : MAX;
  $('[data-bar]').style.width = `${Math.round(((stars - from) / Math.max(1, to - from)) * 100)}%`;
  $('[data-guest]').hidden = !!user; $('[data-member]').hidden = !user;
  if (user) $('[data-name]').textContent = user;
  for (const g of GAMES) {
    const card = $(`[data-game="${g.id}"]`); if (!card) continue;
    $('[data-earned]', card).textContent = `${progress[g.id].reduce((a, b) => a + b, 0)} of ${g.levels * 3} stars`;
    card.querySelectorAll('[data-level]').forEach((b) => {
      const i = Number(b.dataset.level), open = unlocked(g, i), got = progress[g.id][i];
      b.disabled = !open; b.classList.toggle('is-done', got > 0); b.classList.toggle('is-next', open && !got);
      $('.ops-lvl__stars', b).textContent = open ? starText(got) : 'Locked';
      b.setAttribute('aria-label', `${g.name}, level ${i + 1}${open ? (got ? `, ${got} of 3 stars` : ', not played yet') : ', locked: pass the level before it'}`);
    });
  }
}

// ---------- playing ----------
const stageEl = $('[data-ops-stage]'), over = $('[data-over]');
let stage = null, current = null, returnFocus = null;

function overlay(parts) { const card = el('div', 'ops-over__card'); card.append(...parts.filter(Boolean)); over.replaceChildren(card); over.hidden = false; over.scrollTop = 0; const b = over.querySelector('button'); if (b) b.focus({ preventScroll: true }); }
const button = (label, cls, fn) => { const b = el('button', 'btn ' + cls, label); b.type = 'button'; b.addEventListener('click', fn); return b; };

function openLevel(game, level) {
  if (!stage) stage = new Stage(stageEl);
  current = { game, level };
  stageEl.hidden = false; document.documentElement.classList.add('ops-playing');
  $('[data-title]', stageEl).textContent = game.name; $('[data-lvl]', stageEl).textContent = `Level ${level + 1} of ${game.levels}`;
  stage.open(game, level, { onDone: (result) => showResult(game, level, result) });
  const how = el('ul', 'ops-how'); game.how.forEach((line) => how.append(el('li', '', line)));
  const row = el('div', 'btn-row'); row.append(button('Start', 'btn--gold', () => { over.hidden = true; stage.play(); }));
  overlay([el('p', 'ops-over__eyebrow', `${game.machine} · Level ${level + 1}`), el('h2', '', game.name), how, row]);
}

function showResult(game, level, result) {
  const before = rankOf(total());
  if (result.won && result.stars > progress[game.id][level]) {
    progress[game.id][level] = result.stars; writeLocal();
    if (user) call('progress', { progress }).then((d) => { if (d.ok) { progress = merge(progress, d.progress); writeLocal(); renderHub(); } else if (d.message === 'You are not signed in.') { user = null; renderHub(); } });
  }
  renderHub();
  const after = rankOf(total()), row = el('div', 'btn-row'), hasNext = result.won && level + 1 < game.levels;
  if (hasNext) row.append(button('Next level', 'btn--gold', () => openLevel(game, level + 1)));
  row.append(button(result.won ? 'Play again' : 'Try again', hasNext ? 'btn--line' : 'btn--gold', () => openLevel(game, level)));
  row.append(button('All games', 'btn--line', closeStage));
  const starsEl = result.won ? el('p', 'ops-over__stars', starText(result.stars)) : null; if (starsEl) starsEl.setAttribute('aria-label', `${result.stars} of 3 stars`);
  overlay([
    el('p', 'ops-over__eyebrow', `${game.machine} · Level ${level + 1}`),
    el('h2', '', result.won ? (result.stars === 3 ? 'Clean work.' : 'Level passed.') : 'Not this time.'),
    starsEl,
    el('p', 'ops-over__line', result.line),
    after > before ? el('p', 'ops-over__rank', `New rank: ${RANKS[after][1]}`) : null,
    result.won ? el('p', 'ops-over__tip', game.tip) : null,
    row,
    result.won && !user ? el('p', 'ops-over__note', 'Your stars are saved on this device. Sign in from the games list if you want your rank to follow you to other devices.') : null,
  ]);
}

function closeStage() {
  if (stage) stage.close();
  over.hidden = true; stageEl.hidden = true; document.documentElement.classList.remove('ops-playing'); current = null;
  if (returnFocus) returnFocus.focus({ preventScroll: true });
}

hub.addEventListener('click', (e) => {
  const b = e.target.closest('[data-level]'); if (!b || b.disabled) return;
  const game = GAMES.find((g) => g.id === b.closest('[data-game]').dataset.game); returnFocus = b; openLevel(game, Number(b.dataset.level));
});
$('[data-exit]', stageEl).addEventListener('click', closeStage);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) closeStage(); });

// ---------- signing in ----------
const dialog = $('[data-ops-auth]'), form = $('form', dialog), msg = $('[data-msg]', dialog), nameField = $('[data-name-field]', dialog);
const COPY = {
  login: { title: 'Sign in', button: 'Sign in', auto: 'current-password', note: 'Signing in brings your levels to this device.' },
  signup: { title: 'New player', button: 'Create my account', auto: 'new-password', note: 'Pick a nickname and a password. That is all we ask for.' },
  delete: { title: 'Delete my account', button: 'Delete it for good', auto: 'current-password', note: 'This removes your operator name and every saved level. It cannot be undone. Type your password to confirm.' },
};
let mode = 'login';
function setMode(next) {
  mode = next; const c = COPY[mode];
  $('[data-auth-title]', dialog).textContent = c.title; $('[data-auth-note]', dialog).textContent = c.note; $('[data-submit]', dialog).textContent = c.button;
  form.password.autocomplete = c.auto; nameField.hidden = mode === 'delete'; $('[data-tabs]', dialog).hidden = mode === 'delete';
  dialog.querySelectorAll('[data-mode]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === mode)));
  msg.hidden = true;
}
function openAuth(next) { setMode(next); form.password.value = ''; if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); (mode === 'delete' ? form.password : form.username).focus(); }
const closeAuth = () => { form.password.value = ''; if (dialog.open) dialog.close(); };
const say = (text) => { msg.textContent = text; msg.hidden = false; };

dialog.querySelectorAll('[data-mode]').forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));
$('[data-close]', dialog).addEventListener('click', closeAuth);
dialog.addEventListener('click', (e) => { if (e.target === dialog) closeAuth(); });
document.querySelectorAll('[data-open-auth]').forEach((b) => b.addEventListener('click', () => openAuth(b.dataset.openAuth)));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.username.value.trim(), password = form.password.value, submit = $('[data-submit]', dialog);
  if (mode !== 'delete' && !/^[A-Za-z0-9][A-Za-z0-9 _-]{1,18}[A-Za-z0-9]$/.test(name.replace(/\s+/g, ' '))) return say('Pick an operator name of 3 to 20 letters or numbers (spaces, dashes and underscores are fine).');
  if (password.length < 8) return say('Use a password of at least 8 characters.');
  submit.disabled = true; msg.hidden = true;
  const data = mode === 'delete' ? await call('delete', { password }) : await call(mode, { name, password, progress, website: form.website.value });
  submit.disabled = false;
  if (!data.ok) return say(data.message || 'That did not work. Try again.');
  if (mode === 'delete') { user = null; progress = clean({}); try { localStorage.removeItem(KEY); } catch (err) {} }
  else { user = data.name; progress = merge(progress, data.progress); writeLocal(); }
  closeAuth(); renderHub();
});

$('[data-signout]').addEventListener('click', async () => {
  await call('logout', {});
  // The levels stay safe on the account. They are cleared from this device so the next player starts fresh.
  user = null; progress = clean({}); try { localStorage.removeItem(KEY); } catch (e) {}
  renderHub();
});

// ---------- start ----------
document.querySelectorAll('[data-icon]').forEach((c) => drawIcon(c, c.dataset.icon));
renderHub();
call('me').then((d) => {
  if (!d.ok || !d.name) return;
  user = d.name; const merged = merge(progress, d.progress);
  // anything earned on this device since the last visit is sent up
  if (JSON.stringify(merged) !== JSON.stringify(clean(d.progress))) call('progress', { progress: merged });
  progress = merged; writeLocal(); renderHub();
});

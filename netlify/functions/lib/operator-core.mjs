// Operator School accounts: the rules for signing in and saving a player's levels.
//
// Plain version:
//   - A player picks an operator name and a password. No email, no phone, no real name is asked for.
//   - The password itself is NEVER saved. Only a scrambled, one-way version of it is (scrypt, with a
//     random salt per player). Nobody can read a password back out of it, including us.
//   - Signing in gives the browser a random pass (a cookie that page scripts cannot read). Only a
//     fingerprint of that pass is saved on the server, so a copy of the saved data cannot be used to sign in.
//   - Everything is kept in Netlify Blobs, which is private storage only this site's server code can open.
//     Nothing here is in the public code, and there are no secret keys to leak.
//   - Five wrong passwords in a row locks that name for 15 minutes. Netlify also limits how fast any one
//     visitor can call these addresses (see the rateLimit lines in operator.mjs and operator-auth.mjs).
//
// The storage is passed in (`store`) so the rules can be tested without Netlify: see scripts/test-operator.mjs.

import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

// The games and how many levels each has. The game page uses the same ids.
export const GAMES = { dozer: 5, dig: 5, mow: 5, spray: 5, rock: 5 };
const MAX_STARS = 3;

export const COOKIE = '__Host-ah_ops';
const SESSION_DAYS = 90;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const SIGNUPS_PER_DAY = 400; // across the whole site, so a script cannot fill the storage with fake players
const BODY_LIMIT = 2000;

// scrypt settings: slow on purpose, so guessing passwords from stolen data is not practical.
const KDF = { N: 32768, r: 8, p: 1, len: 32 };
const hashPassword = (password, salt, kdf = KDF) =>
  new Promise((resolve, reject) => scrypt(password, salt, kdf.len, { N: kdf.N, r: kdf.r, p: kdf.p, maxmem: 128 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))));
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]{1,18}[A-Za-z0-9]$/;
export function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!NAME_RE.test(name)) return null;
  return { name, key: name.toLowerCase().replace(/[ -]/g, '_') };
}
const validPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 100;

// Progress is a small table: for each game, the stars (0 to 3) earned on each level.
// Anything that is not exactly that shape is thrown away, so junk can never be stored.
export function cleanProgress(raw) {
  const out = {};
  for (const [game, levels] of Object.entries(GAMES)) {
    const src = raw && typeof raw === 'object' && Array.isArray(raw[game]) ? raw[game] : [];
    out[game] = Array.from({ length: levels }, (_, i) => {
      const v = Number(src[i]);
      return Number.isInteger(v) && v >= 0 && v <= MAX_STARS ? v : 0;
    });
  }
  return out;
}
// Keep the best result for every level (so playing on two phones never loses stars).
export function mergeProgress(a, b) {
  const x = cleanProgress(a), y = cleanProgress(b), out = {};
  for (const game of Object.keys(GAMES)) out[game] = x[game].map((v, i) => Math.max(v, y[game][i]));
  return out;
}

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers } });
const sessionCookie = (token, maxAge) => `${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const readCookie = (req) => {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]{20,100})'));
  return m ? m[1] : null;
};
// Only this website's own pages may send changes. Blocks other sites from acting as a signed-in player.
const sameSite = (req) => {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try { const from = new URL(origin).host; return from === new URL(req.url).host || from === req.headers.get('host'); } catch { return false; }
};
async function readBody(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) return null;
  const text = await req.text();
  if (text.length > BODY_LIMIT) return null;
  try { const v = JSON.parse(text || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}

const MSG = {
  badName: 'Pick an operator name of 3 to 20 letters or numbers (spaces, dashes and underscores are fine).',
  badPassword: 'Use a password of at least 8 characters.',
  taken: 'That operator name is taken. Try another one.',
  noMatch: 'That name and password do not match.',
  locked: 'Too many wrong tries. That name is locked for 15 minutes.',
  signedOut: 'You are not signed in.',
  busy: 'Sign-ups are paused for today. Your levels are still saved on this device. Try again tomorrow.',
  bad: 'We could not read that. Try again.',
};

export function createOperatorApi(store, { now = () => Date.now() } = {}) {
  const userKey = (key) => `user/${key}`;
  const sessionKey = (token) => `session/${sha256(token)}`;
  const strong = { type: 'json', consistency: 'strong' };

  async function startSession(key) {
    const token = randomBytes(32).toString('base64url');
    await store.setJSON(sessionKey(token), { u: key, exp: now() + SESSION_DAYS * 864e5 });
    return sessionCookie(token, SESSION_DAYS * 86400);
  }
  // Who is this browser signed in as? Returns the saved player, or null.
  async function currentUser(req) {
    const token = readCookie(req);
    if (!token) return null;
    const session = await store.get(sessionKey(token), strong);
    if (!session) return null;
    if (session.exp < now()) { await store.delete(sessionKey(token)); return null; }
    const found = await store.getWithMetadata(userKey(session.u), strong);
    if (!found) { await store.delete(sessionKey(token)); return null; }
    return { key: session.u, user: found.data, etag: found.etag, token };
  }
  const publicUser = (user) => ({ ok: true, name: user.name, progress: cleanProgress(user.progress) });

  async function signup(req) {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: MSG.bad }, 400);
    if (body.website) return json({ ok: false, message: MSG.bad }, 400); // hidden box only a script fills in
    const id = cleanName(body.name);
    if (!id) return json({ ok: false, message: MSG.badName }, 400);
    if (!validPassword(body.password)) return json({ ok: false, message: MSG.badPassword }, 400);
    if (await store.get(userKey(id.key), strong)) return json({ ok: false, message: MSG.taken }, 409);

    const day = `stats/signups-${new Date(now()).toISOString().slice(0, 10)}`;
    const count = Number(await store.get(day, { type: 'text', consistency: 'strong' })) || 0;
    if (count >= SIGNUPS_PER_DAY) return json({ ok: false, message: MSG.busy }, 429);

    const salt = randomBytes(16);
    const hash = await hashPassword(body.password, salt);
    const user = { name: id.name, salt: salt.toString('base64'), hash: hash.toString('base64'), kdf: KDF, created: new Date(now()).toISOString().slice(0, 10), progress: cleanProgress(body.progress), fails: 0, lockUntil: 0 };
    const { modified } = await store.setJSON(userKey(id.key), user, { onlyIfNew: true });
    if (!modified) return json({ ok: false, message: MSG.taken }, 409);
    await store.set(day, String(count + 1));
    return json(publicUser(user), 200, { 'set-cookie': await startSession(id.key) });
  }

  async function checkPassword(id, password) {
    const found = id ? await store.getWithMetadata(userKey(id.key), strong) : null;
    if (!found) {
      await hashPassword(String(password).slice(0, 100), Buffer.alloc(16)); // same wait as a real check, so names cannot be told apart by timing
      return { ok: false };
    }
    const user = found.data;
    if (user.lockUntil > now()) return { ok: false, locked: true };
    const hash = await hashPassword(password, Buffer.from(user.salt, 'base64'), user.kdf || KDF);
    const good = timingSafeEqual(hash, Buffer.from(user.hash, 'base64'));
    if (!good) {
      const fails = (user.fails || 0) + 1;
      const locked = fails >= MAX_FAILS;
      await store.setJSON(userKey(id.key), { ...user, fails: locked ? 0 : fails, lockUntil: locked ? now() + LOCK_MINUTES * 6e4 : 0 });
      return { ok: false, locked };
    }
    return { ok: true, user };
  }

  async function login(req) {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: MSG.bad }, 400);
    const id = cleanName(body.name);
    if (!validPassword(body.password)) return json({ ok: false, message: MSG.noMatch }, 401);
    const res = await checkPassword(id, body.password);
    if (!res.ok) return json({ ok: false, message: res.locked ? MSG.locked : MSG.noMatch }, res.locked ? 429 : 401);
    // Bring in any levels earned on this device before signing in, and clear the wrong-try count.
    const user = { ...res.user, fails: 0, lockUntil: 0, progress: mergeProgress(res.user.progress, body.progress) };
    await store.setJSON(userKey(id.key), user);
    return json(publicUser(user), 200, { 'set-cookie': await startSession(id.key) });
  }

  async function me(req) {
    const cur = await currentUser(req);
    return cur ? json(publicUser(cur.user)) : json({ ok: false, signedIn: false }, 200);
  }

  async function saveProgress(req) {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: MSG.bad }, 400);
    for (let attempt = 0; attempt < 4; attempt++) {
      const cur = await currentUser(req);
      if (!cur) return json({ ok: false, message: MSG.signedOut }, 401);
      const user = { ...cur.user, progress: mergeProgress(cur.user.progress, body.progress) };
      const { modified } = await store.setJSON(userKey(cur.key), user, cur.etag ? { onlyIfMatch: cur.etag } : {});
      if (modified) return json(publicUser(user));
    }
    return json({ ok: false, message: MSG.bad }, 409);
  }

  async function logout(req) {
    const token = readCookie(req);
    if (token) await store.delete(sessionKey(token));
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }

  // Deleting an account removes the name, the scrambled password and the saved levels for good.
  async function remove(req) {
    const body = await readBody(req);
    if (!body) return json({ ok: false, message: MSG.bad }, 400);
    const cur = await currentUser(req);
    if (!cur) return json({ ok: false, message: MSG.signedOut }, 401);
    if (!validPassword(body.password)) return json({ ok: false, message: MSG.noMatch }, 401);
    const res = await checkPassword({ key: cur.key }, body.password);
    if (!res.ok) return json({ ok: false, message: res.locked ? MSG.locked : MSG.noMatch }, res.locked ? 429 : 401);
    await store.delete(userKey(cur.key));
    await store.delete(sessionKey(cur.token));
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }

  const routes = { 'POST signup': signup, 'POST login': login, 'POST delete': remove, 'GET me': me, 'POST progress': saveProgress, 'POST logout': logout };

  return async function handle(req, allowed) {
    try {
      const action = new URL(req.url).pathname.replace(/\/$/, '').split('/').pop();
      const route = routes[`${req.method} ${action}`];
      if (!route || (allowed && !allowed.includes(action))) return json({ ok: false, message: 'Not found.' }, 404);
      if (req.method !== 'GET' && !sameSite(req)) return json({ ok: false, message: 'Not allowed from here.' }, 403);
      return await route(req);
    } catch (err) {
      console.error('operator school error:', err && err.name); // the kind of error only, never what was typed
      return json({ ok: false, message: 'Something went wrong on our side. Your levels are still saved on this device.' }, 500);
    }
  };
}

// Checks the Operator School sign-in rules without Netlify, using a pretend storage box kept in memory.
// Run with: npm test
import assert from 'node:assert/strict';
import { createOperatorApi, cleanProgress, mergeProgress, cleanName, COOKIE } from '../netlify/functions/lib/operator-core.mjs';

function memoryStore() {
  const data = new Map(); let n = 0;
  return {
    data,
    async get(key, o = {}) { const e = data.get(key); if (!e) return null; return o.type === 'json' ? JSON.parse(e.v) : e.v; },
    async getWithMetadata(key, o = {}) { const e = data.get(key); if (!e) return null; return { data: o.type === 'json' ? JSON.parse(e.v) : e.v, etag: e.etag, metadata: {} }; },
    async set(key, v, o = {}) {
      const e = data.get(key);
      if (o.onlyIfNew && e) return { modified: false };
      if (o.onlyIfMatch && (!e || e.etag !== o.onlyIfMatch)) return { modified: false };
      const etag = 'e' + ++n; data.set(key, { v: String(v), etag }); return { modified: true, etag };
    },
    async setJSON(key, v, o) { return this.set(key, JSON.stringify(v), o); },
    async delete(key) { data.delete(key); },
  };
}

let clock = Date.parse('2026-11-17T12:00:00Z');
const store = memoryStore();
const api = createOperatorApi(store, { now: () => clock });
const site = 'https://ahleaseservice.com';
const call = (method, action, body, { cookie, origin = site, type = 'application/json' } = {}) =>
  api(new Request(`${site}/api/operator/${action}`, { method, headers: { ...(type ? { 'content-type': type } : {}), ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(body ?? {}) }));
const cookieOf = (res) => { const c = res.headers.get('set-cookie'); return c ? c.split(';')[0] : null; };
let passed = 0; const ok = (name) => { passed++; console.log('  ok  ' + name); };

// names and progress
assert.equal(cleanName('  Big   Red ').name, 'Big Red');
assert.equal(cleanName('Big Red').key, 'big_red');
for (const bad of ['ab', 'x'.repeat(21), '<script>', 'a/b', '', null, 42, ' _a_ ']) assert.equal(cleanName(bad), null, String(bad));
assert.deepEqual(cleanProgress({ dozer: [3, 9, -1, 'x', 2.5, 3, 3], hacked: [3], dig: 'no' }).dozer, [3, 0, 0, 0, 0]);
assert.deepEqual(Object.keys(cleanProgress({ hacked: [3] })), ['dozer', 'dig', 'mow', 'spray', 'rock']);
assert.deepEqual(mergeProgress({ dozer: [1, 3] }, { dozer: [2, 1, 1] }).dozer, [2, 3, 1, 0, 0]);
ok('names and progress are cleaned');

// sign up
let res = await call('POST', 'signup', { name: 'Big Red', password: 'short' });
assert.equal(res.status, 400);
res = await call('POST', 'signup', { name: 'Big Red', password: 'dozer-time-22', progress: { dozer: [3, 2] } });
assert.equal(res.status, 200);
let body = await res.json();
assert.equal(body.name, 'Big Red'); assert.deepEqual(body.progress.dozer, [3, 2, 0, 0, 0]);
const setCookie = res.headers.get('set-cookie');
assert.match(setCookie, new RegExp('^' + COOKIE + '=[A-Za-z0-9_-]{40,}; Path=/; Max-Age=\\d+; HttpOnly; Secure; SameSite=Lax$'));
const cookie = cookieOf(res);
ok('sign up works and the cookie is HttpOnly + Secure + SameSite');

// nothing readable is stored
const saved = JSON.stringify([...store.data.entries()]);
assert.ok(!saved.includes('dozer-time-22'), 'password must not be stored');
assert.ok(!saved.includes(cookie.split('=')[1]), 'session pass must not be stored');
assert.ok(store.data.has('user/big_red'));
ok('the password and the session pass are never stored as typed');

// duplicates (any letter case, space or dash)
for (const name of ['big red', 'BIG_RED', 'Big-Red']) assert.equal((await call('POST', 'signup', { name, password: 'another-pass-1' })).status, 409);
ok('a taken name cannot be taken again');

// me + progress
body = await (await call('GET', 'me', null, { cookie })).json();
assert.equal(body.name, 'Big Red');
body = await (await call('GET', 'me')).json();
assert.equal(body.ok, false);
body = await (await call('GET', 'me', null, { cookie: `${COOKIE}=${'A'.repeat(43)}` })).json();
assert.equal(body.ok, false);
res = await call('POST', 'progress', { progress: { dozer: [1, 3, 2], mow: [9] } }, { cookie });
body = await res.json();
assert.deepEqual(body.progress.dozer, [3, 3, 2, 0, 0]); assert.deepEqual(body.progress.mow, [0, 0, 0, 0, 0]);
assert.equal((await call('POST', 'progress', { progress: {} })).status, 401);
ok('levels save only for the signed-in player and never go down');

// other websites cannot act for a signed-in player
assert.equal((await call('POST', 'progress', { progress: { dozer: [3, 3, 3, 3, 3] } }, { cookie, origin: 'https://evil.example' })).status, 403);
assert.equal((await call('POST', 'progress', { progress: {} }, { cookie, origin: null })).status, 403);
assert.equal((await call('POST', 'progress', { progress: {} }, { cookie, type: 'text/plain' })).status, 400);
assert.equal((await api(new Request(`${site}/api/operator/progress`, { method: 'POST', headers: { 'content-type': 'application/json', origin: site, cookie }, body: JSON.stringify({ junk: 'x'.repeat(3000) }) }))).status, 400);
ok('requests from other sites, wrong types and oversized bodies are refused');

// route allow-list
assert.equal((await api(new Request(`${site}/api/operator/login`, { method: 'POST', headers: { 'content-type': 'application/json', origin: site }, body: '{}' }), ['me', 'progress', 'logout'])).status, 404);
ok('each function only answers its own addresses');

// login: same answer for a wrong password and an unknown name
const wrong = await call('POST', 'login', { name: 'Big Red', password: 'wrong-pass-1' });
const unknown = await call('POST', 'login', { name: 'Nobody Here', password: 'wrong-pass-1' });
assert.equal(wrong.status, 401); assert.equal(unknown.status, 401);
assert.equal((await wrong.json()).message, (await unknown.json()).message);
res = await call('POST', 'login', { name: 'big red', password: 'dozer-time-22', progress: { rock: [2] } });
assert.equal(res.status, 200);
body = await res.json();
assert.deepEqual(body.progress.rock, [2, 0, 0, 0, 0]); assert.deepEqual(body.progress.dozer, [3, 3, 2, 0, 0]);
const cookie2 = cookieOf(res);
assert.notEqual(cookie2, cookie);
ok('sign in works, merges device levels, and does not reveal which names exist');

// lockout after 5 wrong tries
for (let i = 0; i < 5; i++) res = await call('POST', 'login', { name: 'Big Red', password: 'wrong-pass-' + i });
assert.equal(res.status, 429);
assert.equal((await call('POST', 'login', { name: 'Big Red', password: 'dozer-time-22' })).status, 429);
clock += 16 * 60 * 1000;
assert.equal((await call('POST', 'login', { name: 'Big Red', password: 'dozer-time-22' })).status, 200);
ok('five wrong passwords lock the name for 15 minutes');

// logout ends that session only
res = await call('POST', 'logout', {}, { cookie });
assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
assert.equal((await (await call('GET', 'me', null, { cookie })).json()).ok, false);
assert.equal((await (await call('GET', 'me', null, { cookie: cookie2 })).json()).ok, true);
ok('signing out ends the session');

// sessions expire
clock += 91 * 864e5;
assert.equal((await (await call('GET', 'me', null, { cookie: cookie2 })).json()).ok, false);
ok('sessions end after 90 days');

// delete account
res = await call('POST', 'login', { name: 'Big Red', password: 'dozer-time-22' });
const cookie3 = cookieOf(res);
assert.equal((await call('POST', 'delete', { password: 'not-the-one-1' }, { cookie: cookie3 })).status, 401);
assert.equal((await call('POST', 'delete', { password: 'dozer-time-22' }, { cookie: cookie3 })).status, 200);
assert.ok(!store.data.has('user/big_red'));
assert.equal((await (await call('GET', 'me', null, { cookie: cookie3 })).json()).ok, false);
assert.equal((await call('POST', 'login', { name: 'Big Red', password: 'dozer-time-22' })).status, 401);
ok('deleting an account removes everything saved for it');

// hidden bot box and the daily cap
assert.equal((await call('POST', 'signup', { name: 'Bot One', password: 'bot-password-1', website: 'http://spam' })).status, 400);
store.data.set(`stats/signups-${new Date(clock).toISOString().slice(0, 10)}`, { v: '400', etag: 'x' });
assert.equal((await call('POST', 'signup', { name: 'Late Comer', password: 'late-password-1' })).status, 429);
ok('bots and floods of fake sign-ups are refused');

console.log(`\nOperator School sign-in rules: ${passed} checks passed.`);

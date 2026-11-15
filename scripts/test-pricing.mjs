// Checks the estimator math. Run: npm test
// The rates below are MADE-UP round numbers for testing the math only. They are not A&H's prices.
// The real rates are a private setting on Netlify (see netlify/functions/lib/pricing.mjs).
import { estimate, range, loadRates } from '../netlify/functions/lib/pricing.mjs';
const T = { rangeLowPct: 5, rangeHighPct: 10,
  road: { rockPerCuYd: 10, shapingPerFt: 1, mobilization: 1000, maxFeet: 10000 },
  pad: { rockPerCuYd: 10, prepPerSqFt: 0.1, mobilization: 1000, maxSqFt: 100000 },
  mowing: { perAcre: 100, minimum: 500, maxAcres: 100 },
  spraying: { perAcre: 200, minimum: 500, maxAcres: 100 } };
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('FAIL', m); } };

// 1. The first digits of the low and the high are never more than 1 apart (9,xxx to 10,xxx counts
//    as one step), and the range always contains the worked-out price. (Starts at $450.)
for (let t = 450; t < 900000; t = Math.ceil(t * 1.003) + 1) {
  const { low, high } = range(t, 0, T);
  const unit = 10 ** Math.floor(Math.log10(t));
  ok(Math.floor(high / unit) - Math.floor(low / unit) <= 1, `first digits too far apart at ${t}: ${low} to ${high}`);
  ok(low <= t && t <= high, `range does not contain the price at ${t}: ${low} to ${high}`);
  ok(high / low < 1.25, `range too wide at ${t}: ${low} to ${high}`);
}
// 2. Known jobs, worked by hand with the test rates.
//    Road 2,700 ft x 20 ft x 6 in = 1,000 cu yd -> 10,000 rock + 2,700 shaping + 1,000 = 13,700.
const road = estimate({ type: 'road', length: 2700, width: 20, depth: 6 }, T);
ok(road.ok && road.low === 13000 && road.high === 15100, 'road should be 13,000 to 15,100: ' + JSON.stringify(road));
ok(estimate({ type: 'road', length: 3, unit: 'miles', width: 16, depth: 6 }, T).needsVisit, 'a road past the size limit should need a site visit');
//    Pad 300 x 180 x 6 in = 54,000 sq ft, 1,000 cu yd -> 10,000 + 5,400 + 1,000 = 16,400.
const pad = estimate({ type: 'pad', length: 300, width: 180, depth: 6 }, T);
ok(pad.ok && pad.low === 15600 && pad.high === 18000, 'pad should be 15,600 to 18,000: ' + JSON.stringify(pad));
ok(estimate({ type: 'pad', length: 500, width: 500, depth: 6 }, T).needsVisit, 'a pad past the size limit should need a site visit');
const mow = estimate({ type: 'mowing', unit: 'row', miles: 0.5, width: 50 }, T);
ok(mow.ok && mow.low === T.mowing.minimum, 'a small mowing job should start at the minimum: ' + JSON.stringify(mow));
ok(estimate({ type: 'mowing', unit: 'acres', acres: 60 }, T).low === 5700, '60 acres of mowing should start at 5,700');
ok(estimate({ type: 'spraying', unit: 'acres', acres: 500 }, T).needsVisit, 'a spraying job past the size limit should need a call');
ok(!estimate({ type: 'road', length: 0, width: 16, depth: 6 }, T).ok, 'a zero-length road is not a job');
ok(!estimate({ type: 'nope' }, T).ok, 'an unknown job type is refused');
// 3. A bigger job never costs less than a smaller one.
let prev = 0; for (let f = 100; f <= 10000; f += 100) { const e = estimate({ type: 'road', length: f, width: 16, depth: 6 }, T); ok(e.low >= prev, 'road price went down at ' + f); prev = e.low; }
// 4. The reply never carries the rates, and a missing or broken setting is caught.
ok(!/perAcre|rockPerCuYd|mobilization"/.test(JSON.stringify(road)), 'the reply must not include rates');
ok(loadRates(JSON.stringify(T)) && !loadRates('') && !loadRates('{"road":{}}') && !loadRates('not json'), 'the rates setting check');
console.log(fails ? `${fails} check(s) failed` : 'All pricing checks passed');
process.exit(fails ? 1 : 0);

// The estimator math. This runs on the server only.
//
// Plain version: a visitor's browser sends the job size here and gets back a price RANGE.
// The formula never goes to the browser, and the RATES ARE NOT IN THIS FILE AT ALL.
// They live in a private setting on Netlify, so they cannot be read from the website or from this code:
//
//   Netlify > ahleaseservice > Project configuration > Environment variables > ESTIMATOR_RATES
//
// That setting is one line of JSON shaped like this (the numbers here are blanks, not prices):
//
//   { "rangeLowPct": 5, "rangeHighPct": 10,
//     "road":     { "rockPerCuYd": 0, "shapingPerFt": 0, "mobilization": 0, "maxFeet": 0 },
//     "pad":      { "rockPerCuYd": 0, "prepPerSqFt": 0, "mobilization": 0, "maxSqFt": 0 },
//     "mowing":   { "perAcre": 0, "minimum": 0, "maxAcres": 0 },
//     "spraying": { "perAcre": 0, "minimum": 0, "maxAcres": 0 } }
//
//   rockPerCuYd   rock hauled, spread and compacted, per cubic yard
//   shapingPerFt  blading, crowning and ditching, per foot of road
//   prepPerSqFt   stripping, leveling and compacting the ground under a pad, per square foot
//   mobilization  getting equipment to the location
//   minimum       smallest charge for a mowing or spraying trip
//   maxFeet / maxSqFt / maxAcres   above this size the site says "needs a site visit" instead of a price
//   rangeLowPct / rangeHighPct     the visitor sees this much under to this much over the worked-out price
//
// Change a number in that setting, redeploy, and the website uses it. No code changes.

const KEYS = { road: ['rockPerCuYd', 'shapingPerFt', 'mobilization', 'maxFeet'], pad: ['rockPerCuYd', 'prepPerSqFt', 'mobilization', 'maxSqFt'], mowing: ['perAcre', 'minimum', 'maxAcres'], spraying: ['perAcre', 'minimum', 'maxAcres'] };
// Reads the private setting. Returns null if it is missing or incomplete, and the site then says "call us".
export function loadRates(text) {
  try {
    const r = JSON.parse(text || '');
    const good = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
    if (!good(r.rangeLowPct) || !good(r.rangeHighPct)) return null;
    for (const [k, names] of Object.entries(KEYS)) for (const n of names) if (!r[k] || !good(r[k][n])) return null;
    return r;
  } catch { return null; }
}

const SQFT_PER_ACRE = 43560;
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const roundTo = (n, step) => Math.round(n / step) * step;

// Turns one worked-out price into the range a visitor sees: 5% under to 10% over.
export function range(total, floor, r) {
  const step = total >= 20000 ? 500 : total >= 5000 ? 100 : 50;
  let low = Math.max(floor, roundTo(total * (1 - r.rangeLowPct / 100), step));
  let high = roundTo(total * (1 + r.rangeHighPct / 100), step);
  // Colton's rule (same as the CGH quote tool): the first digit of the low and the high are never
  // more than 1 apart. $8,375 must not show as 7,950 to 9,200 (a 7 and a 9). It shows as 8,000 to 9,200.
  // (9,xxx to 10,xxx counts as one step.)
  const unit = 10 ** Math.floor(Math.log10(total));
  if (Math.floor(high / unit) - Math.floor(low / unit) > 1) {
    const up = (Math.floor(high / unit) - 1) * unit;
    if (up <= total) low = up; else high = (Math.floor(low / unit) + 2) * unit - step;
  }
  return { low, high };
}

const visit = (type, why) => ({ ok: true, type, needsVisit: true, message: why });
const bad = (message) => ({ ok: false, message });

// What the public sees: one range and a plain list of what it covers. No rates, no line prices.
export function estimate(input, r) {
  const type = String(input?.type || '');

  if (type === 'road') {
    const feet = input.unit === 'miles' ? num(input.length) * 5280 : num(input.length);
    const width = num(input.width), depth = num(input.depth);
    if (!feet || !width || !depth) return bad('Enter the road length, width and rock depth.');
    if (width > 40 || depth > 18) return bad('Check the width (up to 40 ft) and rock depth (up to 18 in).');
    if (feet > r.road.maxFeet) return visit(type, 'A road this long needs a site visit to price right. Terrain, creek crossings and the haul distance for rock change the number too much to guess.');
    const yards = (feet * width * (depth / 12)) / 27;
    const total = yards * r.road.rockPerCuYd + feet * r.road.shapingPerFt + r.road.mobilization;
    return { ok: true, type, ...range(total, 0, r), summary: `Lease road, ${fmt(feet)} ft long, ${width} ft wide, ${depth} in of rock`,
      includes: [`About ${fmt(yards)} cubic yards of road rock, hauled, spread and compacted`, 'Blading, crowning and ditching the full length', 'Moving equipment in and out'],
      notes: ['Clearing timber, culverts, cattle guards and gates are priced on the site visit.', 'Soft or wet ground may need fabric or extra rock.'] };
  }

  if (type === 'pad') {
    const length = num(input.length), width = num(input.width), depth = num(input.depth);
    if (!length || !width || !depth) return bad('Enter the pad length, width and rock depth.');
    if (depth > 24) return bad('Check the rock depth (up to 24 in).');
    const sqft = length * width;
    if (sqft > r.pad.maxSqFt) return visit(type, 'A pad this size needs a site visit to price right. Cut and fill, drainage and the haul distance for rock decide the number.');
    const yards = (sqft * (depth / 12)) / 27;
    const total = yards * r.pad.rockPerCuYd + sqft * r.pad.prepPerSqFt + r.pad.mobilization;
    return { ok: true, type, ...range(total, 0, r), summary: `Pad, ${fmt(length)} ft by ${fmt(width)} ft (${(sqft / SQFT_PER_ACRE).toFixed(2)} acres), ${depth} in of rock`,
      includes: [`Stripping, leveling and compacting about ${fmt(sqft)} sq ft`, `About ${fmt(yards)} cubic yards of pad rock, hauled, spread and compacted`, 'Moving equipment in and out'],
      notes: ['Heavy cut and fill, clearing timber, pits, berms and cellars are priced on the site visit.', 'This range assumes fairly level ground with truck access.'] };
  }

  if (type === 'mowing' || type === 'spraying') {
    const acres = input.unit === 'acres' ? num(input.acres) : (num(input.miles) * 5280 * num(input.width)) / SQFT_PER_ACRE;
    if (!acres) return bad(input.unit === 'acres' ? 'Enter the number of acres.' : 'Enter the length in miles and the width in feet.');
    const k = r[type];
    if (acres > k.maxAcres) return visit(type, type === 'mowing'
      ? 'A mowing job this size is priced as a route, usually with a per-cycle rate. Call us and we will put a number on the whole program.'
      : 'A spraying program this size is priced as a route, with the chemical plan matched to what is growing. Call us and we will put a number on it.');
    const total = Math.max(k.minimum, acres * k.perAcre);
    const a = acres < 10 ? acres.toFixed(1) : fmt(acres);
    return type === 'mowing'
      ? { ok: true, type, ...range(total, k.minimum, r), summary: `Right-of-way and location mowing, about ${a} acres`,
          includes: [`Mowing about ${a} acres, one pass`, 'Trimming around risers, markers and fence lines the mower cannot reach', 'Moving equipment in and out'],
          notes: ['Brush over about 2 inches thick, or ground that has gone more than a season uncut, is priced on the site visit.', 'A set schedule of several cuts a year lowers the price per cut.'] }
      : { ok: true, type, ...range(total, k.minimum, r), summary: `Weed spraying, about ${a} acres`,
          includes: [`Spraying about ${a} acres, one application`, 'Herbicide, water and equipment', 'Moving equipment in and out'],
          notes: ['The right product depends on what is growing and what is next to it. We confirm that before a firm bid.', 'Bare-ground programs usually take a spring and a follow-up application.'] };
  }

  return bad('Pick what you need priced.');
}

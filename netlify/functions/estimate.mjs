// Netlify runs this for /api/estimate. A visitor's browser sends the job size; this sends back a price range.
// The rates are a private Netlify setting called ESTIMATOR_RATES (see lib/pricing.mjs). They are not in the code.
import { estimate, loadRates } from './lib/pricing.mjs';

export const config = { path: '/api/estimate' };

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, message: 'Send the job details with POST.' }, 405);
  try {
    const rates = loadRates(globalThis.Netlify?.env?.get('ESTIMATOR_RATES') ?? process.env.ESTIMATOR_RATES);
    if (!rates) return json({ ok: false, message: 'The estimator is not switched on yet. Call us and we will price it with you.' }, 503);
    const text = await req.text();
    if (text.length > 2000) return json({ ok: false, message: 'Too much data.' }, 413);
    const result = estimate(JSON.parse(text || '{}'), rates);
    return json(result, result.ok ? 200 : 400);
  } catch (err) {
    return json({ ok: false, message: 'We could not read those numbers. Check them and try again.' }, 400);
  }
};

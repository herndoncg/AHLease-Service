// Operator School: creating an account, signing in, and deleting an account.
// Netlify runs this for the three addresses below. The rules are in lib/operator-core.mjs.
//
// rateLimit, in plain words: one visitor (one internet address) may call these at most 10 times a
// minute. Past that Netlify answers "slow down" by itself. This is what stops a script from guessing
// passwords quickly or creating piles of fake players.
import { getStore } from '@netlify/blobs';
import { createOperatorApi } from './lib/operator-core.mjs';
import { storeName } from './lib/operator-store.mjs';

export const config = {
  path: ['/api/operator/signup', '/api/operator/login', '/api/operator/delete'],
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};

export default async (req, context) => {
  const store = getStore({ name: storeName(req, context), consistency: 'strong' });
  return createOperatorApi(store)(req, ['signup', 'login', 'delete']);
};

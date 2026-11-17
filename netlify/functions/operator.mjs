// Operator School: "who am I signed in as", saving levels, and signing out.
// Netlify runs this for the three addresses below. The rules are in lib/operator-core.mjs.
//
// rateLimit, in plain words: one visitor may call these at most 60 times a minute, which is far more
// than playing the games ever needs.
import { getStore } from '@netlify/blobs';
import { createOperatorApi } from './lib/operator-core.mjs';
import { storeName } from './lib/operator-store.mjs';

export const config = {
  path: ['/api/operator/me', '/api/operator/progress', '/api/operator/logout'],
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};

export default async (req, context) => {
  const store = getStore({ name: storeName(req, context), consistency: 'strong' });
  return createOperatorApi(store)(req, ['me', 'progress', 'logout']);
};

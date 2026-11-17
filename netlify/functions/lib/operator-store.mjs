// Which private storage box the Operator School uses.
// The live site uses "operator-school". Preview copies of the site use a separate box, so testing a
// preview can never touch real players' accounts.
const LIVE_HOSTS = ['ahleaseservice.com', 'www.ahleaseservice.com'];
export function storeName(req, context) {
  let host = ''; try { host = new URL(req.url).host; } catch {}
  const live = context?.deploy?.context === 'production' || LIVE_HOSTS.includes(host);
  return live ? 'operator-school' : 'operator-school-preview';
}

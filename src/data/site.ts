// One place for business facts. Change a value here (or in business.json beside it,
// which the content portal edits) and it updates everywhere on the site.
import business from './business.json';

const tel = (p: string) => { const d = p.replace(/\D/g, '').slice(-10); return { href: 'tel:+1' + d, schema: `+1-${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` }; };

export const site = {
  name: 'A&H Lease Services',
  short: 'A&H',
  url: 'https://ahleaseservice.com',
  phone: business.phone,
  phoneHref: tel(business.phone).href,
  phoneSchema: tel(business.phone).schema,
  phone2: business.phone2,
  phone2Href: business.phone2 ? tel(business.phone2).href : '',
  email: business.email,
  city: business.city,
  state: business.state,
  postalCode: business.postalCode,
  // Emergencies are answered 24/7. Normal office hours are below (Colton set these Nov 16, 2026).
  emergency: business.emergency,
  hours: business.hours,
  hoursLine: business.hours.map((h) => h.label).join(', '),
  // Flip to true in the content portal ONLY once a policy is active and Colton says to show it.
  insured: business.insured,
  statesServed: business.statesServed,
  verse: business.verse,
  sister: business.sisterCompany,
  // Where the bid form sends leads. Netlify Forms collects them (Netlify > ahleaseservice > Forms > "bid").
  bidFormName: 'bid',
};

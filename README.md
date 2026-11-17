# ahleaseservice.com

Public website for **A&H Lease Services**: oilfield lease services, Longview, TX.
Built the same way as the CGH site (`herndoncg/CGH-Site`), with A&H's own colors and look.

- **Built with:** Astro (static site, no database, very fast)
- **Hosting:** Netlify, connected to this repo (deploys automatically when `main` changes; settings in `netlify.toml`)
- **Sister site:** cghoperations.com (CGH Operations, asphalt paving, same crew)
- **The estimator rates are not in this code.** They are a private setting on Netlify called `ESTIMATOR_RATES`.

## Where to change things

| To change… | Edit |
| --- | --- |
| Estimator rates, minimums, the range, the "needs a site visit" sizes | Netlify > ahleaseservice > Project configuration > Environment variables > `ESTIMATOR_RATES` (the shape is explained at the top of `netlify/functions/lib/pricing.mjs`) |
| Phones, email, hours, verse, "insured" switch | `src/data/business.json` |
| Services (a page is generated for each) | `src/data/services.ts` |
| Colors, fonts | `src/styles/tokens.css` |
| Blog posts ("Field notes") | `src/content/blog/*.md` |

`business.json` and the blog can also be edited without code at **/admin** (Pages CMS, config in `.pages.yml`).

## How the estimators price a job (`netlify/functions/lib/pricing.mjs`, on the server)

The math is in the code. The rates are not: they are read from the private Netlify setting `ESTIMATOR_RATES`.
If that setting is missing, the estimators say "call us" instead of showing a price.

- **Lease road:** rock by the cubic yard (length x width x depth) + shaping by the foot + mobilization. Over 2 miles: "needs a site visit".
- **Pad:** rock by the cubic yard + ground prep by the square foot + mobilization. Over about 3.7 acres: "needs a site visit".
- **Mowing / weed spraying:** by the acre (miles x width, or acres typed in), with a minimum trip charge. Very large jobs: "call us".
- The visitor sees the total from 5% under to 10% over, rounded. The first digit of the low and high numbers is never more than 1 apart.

Check the math any time: `npm test`

## Jobsite Games (at /games/; first called Operator School, and /operator-school still redirects there)

Five small games (dozer, excavator, mowing, spraying, hauling rock), 5 levels each, up to 3 stars a level.

| To change… | Edit |
| --- | --- |
| How hard a level is | the `..._LEVELS` list at the top of each game in `src/scripts/operator/games.js` |
| The words (how to play, tips) | the same file, at the top of each game |
| Rank names and the stars each needs | `RANKS` in `src/scripts/operator/app.js` |
| The page layout and colors | `src/pages/games.astro` |

**Sign-in, in plain words.** Playing needs no account; a guest's levels stay in their own browser. An account is an
operator name and a password, nothing else (no email, phone or real name).

- The password is never stored. Only a one-way scrambled version is (scrypt with a random salt per player).
- Signing in sets one cookie that page scripts cannot read (`HttpOnly`, `Secure`, `SameSite=Lax`). The server keeps only a fingerprint of it.
- Accounts live in **Netlify Blobs** (private storage only this site's server code can open), in a box named `operator-school` (the old name, kept on purpose so existing accounts are not lost).
  Preview builds use a separate box, `operator-school-preview`, so tests never touch real players.
- **There are no secret keys for this feature**, so nothing sensitive is in this code or in Netlify's settings.
- Limits: 5 wrong passwords locks a name for 15 minutes; one visitor can try signing in 10 times a minute; 400 new accounts a day site-wide.
- A player can delete their own account on the page. No email on file means a forgotten password cannot be reset.

The rules are in `netlify/functions/lib/operator-core.mjs`. `npm test` checks them (and the estimator math).

## Forms

Leads are collected by **Netlify Forms** (Netlify dashboard > ahleaseservice > Forms). The bid form is named `bid`.
Fields: `name`, `company`, `phone`, `email`, `service`, `location`, `timing`, `reply_by`, `details`,
`estimate` (the estimator result, if they used it), `lead_source` (Google, Facebook, Direct…), `landing_page`, `sent_from`.
Spam trap: `bot-field` (Netlify drops submissions where it is filled).
Every field a form sends must exist as an input in the page's HTML, or Netlify ignores it.

## Photos

There are no photos on the site yet, on purpose: real A&H job photos only (no stock, no AI, no drawn equipment).
Dark headers show a thin survey-grid pattern until photos are added. To put a job photo behind a page header,
set `style="--pagehead-photo: url('/img/uploads/name.webp')"` on that page's `<section class="pagehead">`.

## Local development

```sh
npm install
npm run dev     # http://localhost:4321
npm run build   # outputs to dist/
npm test        # checks the estimator math
```

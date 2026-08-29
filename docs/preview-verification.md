# Preview verification

What to check on the Vercel preview (and after promotion, on production)
before calling this branch verified. Work through it top to bottom; every
item is pass/fail.

## Countries and prices

- [ ] `/en` hero: "Start in Bangladesh. Build anywhere." fully visible, no
      clipping under the header, no horizontal scroll at 320–1440px.
- [ ] Hero right side shows the product module labelled **Product
      preview** — no illustrated person anywhere.
- [ ] `/en/countries`: Bangladesh panel with From ৳9,900 (About $80) and
      its qualifier; six international cards each showing their §5 starting
      price, qualifier and **Applications open — specialist reviewed**.
- [ ] No "Register interest", "Coming soon" or "in preparation" on any
      country surface, in either locale.
- [ ] `/en/countries/saudi-arabia` and `/qatar`: CTA reads "Start …
      assessment"; every other country reads "Start … application"; all
      seven CTAs land on `/start?country=<slug>`.

## Application flow

- [ ] `/en/start?country=usa&objective=new` opens on the nationality
      question (params validated and preseeded).
- [ ] A Bangladesh walk ends: review → Submit application → **Application
      received** with a `BD-YYYY-NNNNNN` reference and the preliminary
      recommendation beneath.
- [ ] An international walk ends with the confirmation and **no**
      Bangladesh recommendation.
- [ ] The consent step blocks submission until ticked.
- [ ] Production only: the row appears in `/admin/applications` (staff +
      MFA), and no `application.insert_failed` line is in the runtime logs.
      If the fallback fired, apply migration 20260101002100 and re-test.
- [ ] The acknowledgement email logs `email.mock_send` (until real email
      credentials exist).

## Copy and truthfulness

- [ ] `/en/how-it-works` and `/bn/how-it-works`: four operational steps, no
      raw key paths anywhere (the e2e sweep mirrors this check).
- [ ] Legal pages carry the §11.4 banner: applications open; paid
      engagements, identity verification and document collection only after
      terms are supplied.
- [ ] Both locales: switch to Bangla on each key page; no missing-key
      paths, no truncated Bangla.
- [ ] No "guaranteed", "instant approval", "official partner", invented
      statistics, testimonials or logos anywhere new.

## Regression spot-checks

- [ ] Header: Start / Services / Countries / Pricing / Resources +
      language, Sign in, Start application; drawer carries Partners, How it
      works, About, Contact.
- [ ] `/en/pricing` unchanged figures (9,900 / 24,900 / 39,900 / 14,900 /
      49,900 / 11,900) with USD approximations when the FX env vars are set.
- [ ] `/contact?interest=qatar` still prefills the topic and hidden
      attribution fields.
- [ ] Sign-in, workspace and admin routes still redirect anonymous
      visitors correctly.

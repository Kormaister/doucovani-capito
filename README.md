# Capito web

Staticky postavený web pro moderní online doučování. Obsahuje sekce O nás, Nabídka, Balíčky, Reference, Ceník, Rezervace, FAQ a Kontakt.

## Bezpečnostní základ

- Žádné externí skripty ani CDN.
- Připravené CSP a bezpečnostní hlavičky v `_headers`; nejsou vložené jako meta tag, aby lokální náhled v Codexu šel anotovat.
- Rezervační formulář nic citlivého neukládá do prohlížeče.
- Platby probíhají mimo web přes Acuity Scheduling a Stripe.
- Tajné klíče, webhooks a potvrzení plateb nesmí být uložené ve statických souborech webu.

## Napojení služeb

Rezervační tlačítko vede do Acuity Scheduling. Nezávazná poptávka je připravená jako Netlify formulář a v lokálním náhledu posílá kontrolní událost `capito:inquiry-ready`. Platby probíhají mimo web přes Acuity a Stripe.

## SEO

- Hlavní SEO metadata jsou v `index.html`.
- Strukturovaná data používají JSON-LD pro WebSite, Organization, LocalBusiness, Course, FAQPage a BreadcrumbList.
- Indexaci pomáhají `robots.txt` a `sitemap.xml`.
- Detail provedených změn a další doporučení jsou v `SEO_REPORT.md`.
- Canonical, Open Graph, strukturovaná data, `robots.txt` a `sitemap.xml` počítají s doménou `https://www.doucovanicapito.cz/`.

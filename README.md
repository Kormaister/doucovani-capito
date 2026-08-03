# Capito web

Staticky postavený web pro moderní online doučování. Obsahuje sekce O nás, Nabídka, Balíčky, Reference, Ceník, Rezervace, FAQ a Kontakt.

## Bezpečnostní základ

- Žádné externí skripty ani CDN.
- Připravené CSP a bezpečnostní hlavičky v `_headers`; nejsou vložené jako meta tag, aby lokální náhled v Codexu šel anotovat.
- Rezervační formulář nic citlivého neukládá do prohlížeče.
- Platby by měly být později řešené přes serverem vytvořený checkout session u platebního providera.
- Tajné klíče, webhooks a potvrzení plateb musí zůstat výhradně na backendu.

## Budoucí napojení

Formulář posílá připravený payload přes událost `capito:reservation-ready`. Po doplnění backendu lze přidat `fetch` na `/api/reservations`, serverovou validaci, ochranu proti spamu, kalendářové sloty a platební checkout.

## SEO

- Hlavní SEO metadata jsou v `index.html`.
- Strukturovaná data používají JSON-LD pro WebSite, Organization, LocalBusiness, Course, FAQPage a BreadcrumbList.
- Indexaci pomáhají `robots.txt` a `sitemap.xml`.
- Detail provedených změn a další doporučení jsou v `SEO_REPORT.md`.
- Canonical, Open Graph, strukturovaná data, `robots.txt` a `sitemap.xml` počítají s doménou `https://www.doucovanicapito.cz/`.

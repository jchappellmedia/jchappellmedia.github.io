# jchappellmedia.github.io

The site behind the YouTube channel — guides, Claude skills, knowledge bases
and business plans.

**Live at:** https://jchappellmedia.github.io

---

## Adding a product or guide — the 30-second version

Open **`assets/data/catalog.json`**, copy an existing block, change the values,
save, and push. That's the whole job. Every grid on every page rebuilds itself.

```json
{
  "id": "unique-no-spaces",
  "title": "What it's called",
  "blurb": "One or two sentences on what someone gets.",
  "type": "guide",
  "price": "Free",
  "url": "guides/my-new-guide.html",
  "featured": true,
  "date": "2026-10-01",
  "cta": "Read the guide",
  "badge": "New"
}
```

| Field | What to put |
|---|---|
| `id` | Anything unique, no spaces. Never shown. |
| `type` | `guide`, `skill`, `knowledge-base`, `business-plan`, or `tool` — sets the label and colour. |
| `price` | `"Free"` turns the badge green. Anything else (`"$49"`) shows as paid. |
| `url` | A page on this site (`guides/x.html`) **or** an external checkout link (`https://...`). External links open in a new tab automatically. |
| `featured` | `true` puts it on the homepage. |
| `date` | `YYYY-MM-DD`. Newest sorts first. |
| `cta` | Button text. Optional. |
| `badge` | Small label like `"New"`. Optional — falls back to the date. |

**Selling something paid?** GitHub Pages is static, so it can't take payments
itself. Put the product on Gumroad, Lemon Squeezy or Stripe Payment Links, and
paste that checkout URL into `url`. Nothing else changes.

> After editing, check the file is still valid JSON — a stray comma breaks every
> grid. Run: `node -e "JSON.parse(require('fs').readFileSync('assets/data/catalog.json','utf8'));console.log('ok')"`

---

## Adding a written guide

1. Copy `templates/guide-template.html` into `guides/` and rename it
   (e.g. `guides/my-new-guide.html`). The filename becomes the URL.
2. Open it and replace the title, description, date and body.
3. Add an entry to `catalog.json` pointing at it.
4. Add the URL to `sitemap.xml`.

---

## Changing the hero image

Replace these two files, keeping the names:

- `assets/img/hero.jpg` — about 2400px wide, for desktop
- `assets/img/hero-mobile.jpg` — about 1200px wide, for phones
- `assets/img/og.jpg` — 1200×630, the thumbnail that shows when the link is shared

If the new image's subject sits somewhere different, adjust
`background-position` in the `.hero-photo::before` rule in
`assets/css/site.css`. First number is horizontal, second vertical.

If `hero.jpg` is missing, the hero falls back to the animated background on its
own — it won't break.

**Note on rights:** the current hero is a frame from video footage. Make sure
you own or are licensed for anything you publish here, since the site is public
and linked from your channel.

---

## Changing colours and fonts

Everything lives in the `:root` block at the top of `assets/css/site.css`.
Change a value there and it updates across the entire site.

---

## Previewing locally before you push

```bash
cd "path/to/jchappellmedia.github.io" && python3 -m http.server 4173
```

Then open http://localhost:4173

Opening `index.html` directly by double-clicking **won't work** — browsers block
the catalog file from loading over `file://`. Use the command above.

---

## Publishing a change

```bash
git add -A && git commit -m "Add new product" && git push
```

GitHub rebuilds the site in about a minute.

---

## Taking payments with Stripe

This site is static — there is no server — so Stripe is wired up the two ways
that work without one. Both are fully supported; pick per product.

> ### The one security rule
> Your **publishable** key (`pk_live_…` / `pk_test_…`) is public by design and
> belongs in `catalog.json`. Your **secret** key (`sk_…`) must *never* go in
> this repo, in any file, ever — this repository is public. If you ever paste
> one here by accident, roll it immediately in the Stripe Dashboard.

### Option A — Payment Links (easiest, start here)

No key needed, no configuration, works in two minutes.

1. Stripe Dashboard → **Payment Links** → **＋ New**.
2. Create or pick the product, set the price, and for a digital download set
   the post-purchase page to deliver the file (or upload it as the product
   file).
3. Copy the link — it looks like `https://buy.stripe.com/aEU5kQ...`.
4. In `catalog.json`, paste it as that item's `url`:

```json
{
  "id": "ai-business-plan-kit",
  "title": "AI Business Plan Kit",
  "price": "$49",
  "url": "https://buy.stripe.com/aEU5kQ...",
  "cta": "Buy now"
}
```

The card now sends buyers straight to Stripe's hosted checkout. Done.

### Option B — Buy Button (keeps buyers on your site)

The buyer lands on a checkout page here, with Stripe's own button embedded, so
the URL stays on your domain until they pay.

1. Fill in your publishable key once, at the top of `catalog.json`:

```json
"stripe": { "publishableKey": "pk_live_51ABC..." }
```

   Find it under Stripe Dashboard → **Developers → API keys**.

2. Stripe Dashboard → **Product catalogue** → your product → **Create buy
   button** → copy the **buy button ID** (`buy_btn_…`).
3. Add it to the item — and leave `url` off entirely:

```json
{
  "id": "knowledge-base-blueprint",
  "title": "The Knowledge Base Blueprint",
  "price": "$29",
  "stripeBuyButtonId": "buy_btn_1ABC...",
  "cta": "Get it"
}
```

The card now opens `checkout.html?id=knowledge-base-blueprint`, which renders
the product and the Stripe button. Nothing else to build.

### Which to use

| | Payment Link | Buy Button |
|---|---|---|
| Setup | 2 minutes, no key | 5 minutes, needs publishable key |
| Buyer leaves your domain | Yes | No, until checkout |
| Good for | Getting the first sale up fast | A more finished storefront feel |

### Testing before you go live

Use your **test-mode** keys and a test Buy Button first
(`pk_test_…`), and pay with card `4242 4242 4242 4242`, any future expiry, any
CVC. Swap to live keys when you're happy.

### What Stripe handles, and what it doesn't

Stripe handles the payment, the receipt, card data, and — if you set it up on
the product — delivering the digital file. It does **not** know anything about
this site, so there is no order history or licence checking here. For digital
products that is usually exactly what you want.

---

## Moving to a different address later

The content is portable — nothing is hard-wired to this URL except the
`canonical` and `og:url` tags.

- **A different free GitHub URL:** make a new account (e.g. `joshchappell`),
  create a repo called `joshchappell.github.io`, and push these same files.
- **Your own domain** (~$12/yr, e.g. `joshchappell.com`): buy it, add a file
  called `CNAME` containing just the domain, point the registrar's DNS at
  GitHub, then tick *Enforce HTTPS* in the repo's Pages settings.

Either way, find-and-replace `jchappellmedia.github.io` across the HTML files.

---

## Your email list (Supabase)

`sd-recovery.html` asks for an email (with a consent checkbox) before the
download. Signups go to your Supabase project **jchappellmedia-site**, table
**`email_signups`**.

**See or export your list:** supabase.com → project *jchappellmedia-site* →
**Table Editor** → `email_signups` → **Export → CSV**. Import that CSV into
whatever tool you send emails from (Kit, Mailchimp, Beehiiv…).

Each row stores the email, the exact consent wording the person agreed to,
which download they signed up from (`source`), and when.

**When you email people:** include an unsubscribe link or honour "unsubscribe"
replies, and remove those people from your list. That's a legal requirement
(CAN-SPAM in the US, GDPR in the EU), not just good manners.

**How it's locked down:** the page uses the *publishable* key, which is public
by design. Database rules only allow a visitor to *add* a row, only with
consent ticked, and only for known sources. Nobody can read, change or delete
the list from the web — only you, from the Supabase dashboard.

**Keep-alive:** free Supabase projects pause after about a week with no
activity. `.github/workflows/keep-email-list-awake.yml` pings the project every
3 days so the form never goes dark. If signups ever stop arriving, check the
project isn't paused in the Supabase dashboard. The page still hands out the
download if the list is unreachable, so visitors are never stuck.

**Gating another free download:** copy `sd-recovery.html`, change `SOURCE` in
its script and the file link, then allow the new source in Supabase (SQL
editor):

```sql
alter policy "Visitors can sign up with consent" on public.email_signups
  with check (consent = true and source in ('sd-video-recovery', 'your-new-source'));
```

The file itself is a normal public file in `downloads/`, so the email step is a
friendly ask, not a lock. Anyone with the direct link can still download it.

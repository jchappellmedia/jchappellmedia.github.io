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

## Moving to a different address later

The content is portable — nothing is hard-wired to this URL except the
`canonical` and `og:url` tags.

- **A different free GitHub URL:** make a new account (e.g. `joshchappell`),
  create a repo called `joshchappell.github.io`, and push these same files.
- **Your own domain** (~$12/yr, e.g. `joshchappell.com`): buy it, add a file
  called `CNAME` containing just the domain, point the registrar's DNS at
  GitHub, then tick *Enforce HTTPS* in the repo's Pages settings.

Either way, find-and-replace `jchappellmedia.github.io` across the HTML files.

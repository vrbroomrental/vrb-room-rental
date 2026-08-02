# VRB Room Rental — website

A three-page static site (no build step, no dependencies) for the VRB Room
Rental long-stay residence in Paco, Manila.

| File           | Page                                              |
|----------------|---------------------------------------------------|
| `index.html`   | Home — hero, the building, rates, reviews, FAQs   |
| `gallery.html` | Full gallery, grouped by area                     |
| `contact.html` | Contact details and the embedded map              |
| `styles.css`   | Shared styles for all three pages                 |
| `main.js`      | Shared behaviour for all three pages              |

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `vrb-room-rental`).
2. Copy **everything** in this `site/` folder into the root of that
   repository — all three `.html` files, `styles.css`, `main.js`, `CNAME`
   and the `images/` folder.
3. Commit and push to the `main` branch:
   ```bash
   git init
   git add index.html gallery.html contact.html styles.css main.js CNAME images
   git commit -m "Launch VRB Room Rental site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
4. On GitHub: **Settings → Pages → Build and deployment → Source** =
   "Deploy from a branch", **Branch** = `main` / `/(root)`. Save.
5. Custom domain: the `CNAME` file in this repo currently claims
   **`new.vrbroomrental.com`**, a staging host used to A/B test against the
   old site still living on the apex. At your DNS provider add one record:

   | Type    | Name  | Value                      |
   |---------|-------|----------------------------|
   | `CNAME` | `new` | `vrbroomrental.github.io`  |

   This does not touch `vrbroomrental.com`, so the existing site keeps
   serving untouched.

   **Promoting to the apex later:** change the `CNAME` file to
   `vrbroomrental.com`, **delete `robots.txt`** (see below), then swap DNS to
   four `A` records on the apex — `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`.

6. Wait a few minutes for DNS + GitHub's certificate to provision, then
   check "Enforce HTTPS" in the Pages settings once it's available.

## Photos and logo

See [images/README.md](images/README.md). Every image is already cropped and
compressed; to swap one, drop in a replacement using the same filename.

## Editing content

Each page is plain HTML in the order it appears on screen. The home page runs
hero → promise → the building (floor by floor) → what's included → gallery
teaser → reviews → rates & terms → registration → FAQs → footer.

The header, footer and mobile action bar are duplicated in each `.html` file.
There is no templating, so **edit a nav or footer link in all three files** or
they will drift apart.

Colours and type are CSS custom properties in the `:root` block at the top of
`styles.css`, with a matching dark-mode set below it. Changing `--gold`
updates the accent everywhere.

## The embedded map

`contact.html` embeds Google Maps through a keyless iframe, so there is no
API key to manage and nothing to bill. If the iframe is ever blocked, a
styled address panel stays visible underneath it and the "Open in Google Maps"
button still works.

To re-point the map, edit the `src` on the `<iframe>` inside `.map` — the
`q=` parameter is just a search string.

## Tracked short links

Outbound links use the `links.vrbroomrental.com` shortener so clicks show up
in its stats:

| Link                                   | Used for                                                    |
|----------------------------------------|-------------------------------------------------------------|
| `links.vrbroomrental.com/nakpil`       | "Read all reviews", "Open in Google Maps", "Get directions" |
| `links.vrbroomrental.com/grab-nakpil`  | "Grab" ride button on the contact page                       |
| `links.vrbroomrental.com/moveit-nakpil`| "Move It" ride button on the contact page                    |

The map **iframe** still points at `maps.google.com/...&output=embed`. An
embed cannot go through a shortener, and iframe loads would not be clicks
anyway — only the buttons around it are tracked.

## Adding photos to the gallery

`gallery.html` groups photos under headings (Rooms, Common areas, and so on).
To add one, drop the file in `images/`, copy an existing `<figure class="shot">`
block into the right group, and update the `src`, `alt`, `width`, `height` and
caption. Remember to bump the `NN photos` count in that group's heading.

## Reviews

The two quotes in the Reviews section are verbatim excerpts from real public
Google reviews, credited by name. **Only ever paste in text that someone
actually wrote** — invented testimonials are both dishonest and, in the
Philippines, a consumer-protection problem.

To add another, copy one `<figure class="card">` block inside
`.revrail__track` and replace the quote, the name, the year, and the star
rating — set `--pct` to `rating / 5 * 100` (5★ = `100%`, 4★ = `80%`) and match
the `aria-label`. Keep the aggregate score honest; it should always match your
live Google rating.

The rail loops seamlessly: `main.js` clones the card set five times and parks
the view in the middle copy, shifting by exactly one set width whenever
scrolling drifts out of it. That is why there is no empty space at either end
and no hard edge for momentum to hit. Add or remove cards freely — the clone
count and dots are derived from however many you write.

## Photo lightbox

Any `.shot__f` thumbnail opens enlarged. The image animates from the
thumbnail's own rectangle (FLIP), so it grows out of the grid and shrinks back
on close. Escape, the X button and the backdrop all dismiss it; focus moves to
the close button and returns to the thumbnail.

## Cookies, consent and analytics

Nothing that sets a cookie runs on page load. Google Analytics
(`G-6CN6CZRSQD`) and the Google Maps embed are both injected by `main.js` only
after the visitor presses **Accept all**. **Decline** blocks both; the address,
the directions link and everything else on the site still work.

The choice is stored in `localStorage` under `vrb-consent` as
`{"v":1,"analytics":bool,"maps":bool}`. Both flags are set together — the
two-button notice deliberately has no per-category panel.

**If you add any other tag, pixel or embed, gate it the same way** — call it
from `loadAnalytics()` or `loadMap()`. Dropping a script tag straight into the
HTML would make the notice untrue.

### Why the map is click-to-load

An iframe's cookies are set by Google's server for the `google.com` origin.
Same-origin policy means this site cannot read, block or strip them, and no
iframe attribute disables that — `sandbox` without `allow-same-origin` just
breaks the map. Holding the URL in `data-src` until consent is the only honest
way to keep the promise the notice makes.

### Cloudflare Web Analytics

Cloudflare injects its own beacon at the edge, before any of this code runs, so
it cannot be gated from here. It is cookieless — verified on the live site as
setting no cookies, no `localStorage` and no `sessionStorage` — so it does not
contradict the notice. To gate it anyway, turn off automatic injection in
Cloudflare, then load it by token alongside `loadAnalytics()`.

### Google Search Console

Search Console is separate and needs no consent — it reports on how Google
already crawls the site and sets no cookies on your visitors. Verify by DNS
(a TXT record at your registrar) rather than the HTML-tag method, so the
verification survives any future redesign.

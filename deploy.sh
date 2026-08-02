#!/usr/bin/env bash
# Stamp the CSS/JS links with a hash of their contents, then commit and push.
#
# GitHub Pages serves index.html with max-age=600 but styles.css and main.js
# with max-age=14400. Without this, a deploy gives visitors new HTML alongside
# four-hour-old CSS and JS — which looks like the site is broken. Hashing the
# URL means a changed file is simply a different URL and can never be stale.
set -euo pipefail
cd "$(dirname "$0")"

css=$(md5 -q styles.css | cut -c1-8)
js=$(md5 -q main.js | cut -c1-8)

for f in index.html gallery.html contact.html; do
  perl -pi -e "s{href=\"styles\.css(\?v=[0-9a-f]+)?\"}{href=\"styles.css?v=$css\"}g" "$f"
  perl -pi -e "s{src=\"main\.js(\?v=[0-9a-f]+)?\"}{src=\"main.js?v=$js\"}g" "$f"
done
echo "stamped  css=$css  js=$js"

if [ -z "$(git status --porcelain)" ]; then
  echo "nothing to commit"; exit 0
fi

git add -A
git -c user.email="info@vrbroomrental.com" -c user.name="VRB Room Rental" \
    commit -q -m "${1:-Update site}"
git push -q origin main
echo "pushed $(git rev-parse --short HEAD)"

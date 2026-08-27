#!/bin/bash
# Audit: hit every tool route + key pages and APIs, record HTTP status + title presence
cd /home/z/my-project
SLUGS=$(bun -e 'const {ALL_TOOLS} = await import("./src/lib/tools/registry.ts"); console.log(ALL_TOOLS.map(t=>t.slug).join("\n"));' 2>/dev/null)
FAIL=0
PASS=0
RESULTS=""
for slug in $SLUGS; do
  CODE=$(curl -s -o /tmp/page.html -w "%{http_code}" --max-time 30 "http://localhost:3000/tools/$slug")
  if [ "$CODE" != "200" ]; then
    RESULTS="$RESULTS\nFAIL $slug -> $CODE"
    FAIL=$((FAIL+1))
  else
    # verify page is not blank and has metadata
    TITLE=$(rg -o "<title>[^<]*</title>" /tmp/page.html | head -1)
    if [ -z "$TITLE" ]; then
      RESULTS="$RESULTS\nWARN $slug -> 200 but no <title>"
      FAIL=$((FAIL+1))
    else
      PASS=$((PASS+1))
    fi
  fi
done
echo -e "TOOL ROUTES: PASS=$PASS FAIL=$FAIL"
echo -e "$RESULTS"

echo ""
echo "=== Static pages ==="
for p in / /tools /categories /categories/pdf /categories/image /categories/document /categories/file /categories/developer /categories/generators /categories/calculators /popular /favorites /about /contact /privacy /terms /admin /sitemap.xml /robots.txt /manifest.webmanifest /nonexistent-page-xyz; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "http://localhost:3000$p")
  echo "$CODE $p"
done

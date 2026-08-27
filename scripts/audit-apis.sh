#!/bin/bash
# Audit: API functional tests against the dev server
BASE="http://localhost:3000"
echo "=== 1. API root ==="
curl -s --max-time 10 "$BASE/api" ; echo ""

echo ""
echo "=== 2. URL Shortener: create ==="
CREATE=$(curl -s --max-time 15 -X POST "$BASE/api/shortener" -H "Content-Type: application/json" -d '{"url":"https://example.com/toolbox100-test"}')
echo "$CREATE"
CODE=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('link',{}).get('shortCode',''))" 2>/dev/null)
echo "shortCode=$CODE"

echo ""
echo "=== 3. URL Shortener: redirect (should be 302 + click count) ==="
curl -s -o /dev/null -w "status=%{http_code} location=%{redirect_url}\n" --max-time 15 "$BASE/s/$CODE"

echo ""
echo "=== 4. URL Shortener: non-existent code (404) ==="
curl -s -o /dev/null -w "status=%{http_code}\n" --max-time 10 "$BASE/s/zzzzzz"

echo ""
echo "=== 5. URL Shortener: invalid URL rejected ==="
curl -s --max-time 10 -X POST "$BASE/api/shortener" -H "Content-Type: application/json" -d '{"url":"javascript:alert(1)"}'; echo ""
curl -s --max-time 10 -X POST "$BASE/api/shortener" -H "Content-Type: application/json" -d '{"url":"http://127.0.0.1/x"}'; echo ""
curl -s --max-time 10 -X POST "$BASE/api/shortener" -H "Content-Type: application/json" -d '{"url":"not a url"}'; echo ""

echo ""
echo "=== 6. Contact form: valid submission ==="
curl -s --max-time 15 -X POST "$BASE/api/contact" -H "Content-Type: application/json" -d '{"name":"Audit Bot","email":"audit@example.com","subject":"Production audit test","message":"This is an automated audit message verifying the contact pipeline."}'; echo ""

echo ""
echo "=== 7. Contact form: invalid email ==="
curl -s --max-time 10 -X POST "$BASE/api/contact" -H "Content-Type: application/json" -d '{"name":"A","email":"bad","subject":"x","message":"short"}'; echo ""

echo ""
echo "=== 8. Contact form: empty body ==="
curl -s --max-time 10 -X POST "$BASE/api/contact" -H "Content-Type: application/json" -d '{}'; echo ""

echo ""
echo "=== 9. Currency API: live rates ==="
curl -s --max-time 20 "$BASE/api/currency?base=USD&symbols=INR,EUR" | head -c 400; echo ""

echo ""
echo "=== 10. Track API ==="
curl -s --max-time 10 -X POST "$BASE/api/track" -H "Content-Type: application/json" -d '{"slug":"merge-pdf","status":"success"}'; echo ""

echo ""
echo "=== 11. Admin: unauthenticated access (401 expected) ==="
curl -s -o /dev/null -w "analytics=%{http_code} " --max-time 10 "$BASE/api/admin/analytics"
curl -s -o /dev/null -w "urls=%{http_code} " --max-time 10 "$BASE/api/admin/urls"
curl -s -o /dev/null -w "messages=%{http_code}\n" --max-time 10 "$BASE/api/admin/messages"

echo ""
echo "=== 12. Admin: wrong password ==="
curl -s --max-time 10 -X POST "$BASE/api/admin/login" -H "Content-Type: application/json" -d '{"password":"wrong-password"}'; echo ""

echo ""
echo "=== 13. Admin: correct login + authenticated analytics ==="
LOGIN=$(curl -s --max-time 10 -c /tmp/admin-cookies.txt -X POST "$BASE/api/admin/login" -H "Content-Type: application/json" -d '{"password":"admin123"}')
echo "$LOGIN"
curl -s --max-time 15 -b /tmp/admin-cookies.txt "$BASE/api/admin/analytics" | head -c 300; echo ""

echo ""
echo "=== 14. Shortener rate limit (create 22 links, expect 429 at end) ==="
for i in $(seq 1 22); do
  R=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE/api/shortener" -H "Content-Type: application/json" -d "{\"url\":\"https://example.com/rl-$i\"}")
  printf "%s " "$R"
done
echo ""

#!/usr/bin/env bash
# E2E: admin session ends when you leave the site.
# Each scenario uses a fresh login so revocations cannot interfere.
set -u
BASE=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' /home/z/my-project/.env | cut -d= -f2- | tr -d '\r')
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS: $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }
login() { # $1 = jar file
  curl -s -o /dev/null -c "$1" -X POST "$BASE/api/admin/login" \
    -H 'Content-Type: application/json' -d "{\"password\":\"$PW\"}"
}
status() { # $1 = jar, $2 = method, $3 = path
  curl -s -o /dev/null -w '%{http_code}' -b "$1" -X "$2" "$BASE$3"
}

echo "== 1. Login issues a browser-session cookie (dies with the browser) =="
JAR=$(mktemp); HDRS=$(mktemp)
login "$JAR" # warm compile
curl -s -D "$HDRS" -o /dev/null -c "$JAR" -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/json' -d "{\"password\":\"$PW\"}"
SC=$(awk 'NR==1{print $2}' "$HDRS")
[ "$SC" = "200" ] && ok "login 200" || bad "login status $SC"
SETC=$(grep -i '^set-cookie: pm_admin' "$HDRS" | tr -d '\r')
if echo "$SETC" | grep -qiE 'max-age|expires='; then bad "cookie is persistent: $SETC"; else ok "cookie has NO Max-Age/Expires (session cookie)"; fi
echo "$SETC" | grep -qi 'httponly' && ok "cookie HttpOnly" || bad "cookie not HttpOnly"
[ "$(status "$JAR" GET /api/admin/overview)" = "200" ] && ok "overview 200 while session live" || bad "overview not 200"
HB=$(mktemp)
curl -s -D "$HB" -o /dev/null -b "$JAR" -c "$JAR" -X POST "$BASE/api/admin/session/heartbeat"
[ "$(awk 'NR==1{print $2}' "$HB")" = "200" ] && ok "heartbeat 200 (session renewed)" || bad "heartbeat not 200"
if grep -i '^set-cookie: pm_admin' "$HB" | grep -qiE 'max-age|expires='; then bad "heartbeat issued persistent cookie"; else ok "heartbeat cookie also session-scoped"; fi

echo "== 2. Refresh case: request during grace window revives the session =="
[ "$(status "$JAR" POST /api/admin/session/end)" = "204" ] && ok "end beacon 204" || bad "end beacon not 204"
[ "$(status "$JAR" GET /api/admin/overview)" = "200" ] \
  && ok "overview 200 right after beacon (F5/refresh stays signed in)" \
  || bad "overview failed right after beacon"
[ "$(status "$JAR" GET /api/admin/overview)" = "200" ] && ok "session stays alive after revive" || bad "session died after revive"
rm -f "$JAR" "$HDRS" "$HB"

echo "== 3. Leave-site case: NO requests after the beacon =="
JAR=$(mktemp); login "$JAR"
[ "$(status "$JAR" POST /api/admin/session/end)" = "204" ] || bad "end beacon not 204"
echo "  (sleeping 95s to pass the 90s grace window — simulating the site being left)..."
sleep 95
SC=$(status "$JAR" GET /api/admin/overview)
[ "$SC" = "401" ] && ok "overview 401 after leaving the site — SESSION ENDED" || bad "overview $SC after grace (session survived!)"

echo "== 4. Explicit sign-out is an immediate hard revoke =="
JAR2=$(mktemp); login "$JAR2"
[ "$(status "$JAR2" GET /api/admin/overview)" = "200" ] && ok "re-login works" || bad "re-login overview not 200"
[ "$(status "$JAR2" DELETE /api/admin/login)" = "200" ] && ok "sign-out 200" || bad "sign-out not 200"
[ "$(status "$JAR2" GET /api/admin/overview)" = "401" ] \
  && ok "overview 401 immediately after sign-out (hard revoke, no grace)" \
  || bad "overview not 401 after sign-out"
rm -f "$JAR" "$JAR2"

echo "== 5. Beacon without a session is a harmless 204 =="
SC=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/session/end" -d 'end')
[ "$SC" = "204" ] && ok "anonymous beacon 204" || bad "anonymous beacon $SC"

echo
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]

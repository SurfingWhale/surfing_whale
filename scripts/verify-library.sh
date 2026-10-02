#!/bin/sh
# Run: sh scripts/verify-library.sh <healthy-log> [healthy-port] [broken-db-port]
#
# Checks the photo library's listing and delete against scripts/fake-supabase.mjs.
# Set the harness up first — two fakes and two builds, one of each healthy and
# one with the database unreachable:
#
#   npm run build
#   PORT=4999 node scripts/fake-supabase.mjs > /tmp/fakeA.log &
#   PORT=5000 FAKE_PGRST_FAIL=1 node scripts/fake-supabase.mjs > /tmp/fakeB.log &
#   SUPABASE_URL=http://localhost:4999 SUPABASE_SERVICE_ROLE_KEY=k \
#     DARKROOM_SECRET=test-secret-for-local-repro-only npx next start -p 3477 &
#   SUPABASE_URL=http://localhost:5000 SUPABASE_SERVICE_ROLE_KEY=k \
#     DARKROOM_SECRET=test-secret-for-local-repro-only npx next start -p 3478 &
#   sh scripts/verify-library.sh /tmp/fakeA.log
#
# The secret is a throwaway for the harness. It signs a studio cookie so the
# routes can be reached at all; nothing real is ever signed with it.
set -u
LOG="${1:?pass the healthy fake's log file}"
OK_PORT="${2:-3477}"
BAD_PORT="${3:-3478}"
C=$(node -e 'const{createHmac}=require("crypto");const e=String(Date.now()+86400000);process.stdout.write(e+"."+createHmac("sha256","test-secret-for-local-repro-only").update(e).digest("base64url"));')
fails=0
check() {
  if printf '%s' "$3" | grep -qF "$2"; then echo "  PASS  $1"
  else echo "  FAIL  $1"; echo "        expected to contain: $2"; echo "        got: $3"; fails=$((fails+1)); fi
}

echo "-- A. the listing shows each photograph once --"
N=$(curl -s --noproxy '*' -b "sw-darkroom=$C" "http://localhost:$OK_PORT/api/library/list" | python3 -c "import json,sys;print(len(json.load(sys.stdin)['photos']))")
check "8 uploads across 2 folders -> 8 tiles, not 16" "8" "$N"
F=$(curl -s --noproxy '*' -b "sw-darkroom=$C" "http://localhost:$OK_PORT/api/library/list" | python3 -c "import json,sys;print(','.join(sorted({p['publicId'].split('/')[0] for p in json.load(sys.stdin)['photos']})))")
check "and keeps the library/ copy, not darkroom/" "library" "$F"

echo "-- B. delete removes every copy, not one folder's --"
R=$(curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$OK_PORT/api/library/delete" -d '{"publicId":"library/2026-09-01-camera-aabbccdd-1200x800.webp"}')
check "delete succeeds" '"ok":true' "$R"
P=$(grep 'DELETE /storage' "$LOG" | tail -1)
check "storage asked to remove the archive/ copy too" 'archive/2026-09-01-camera' "$P"
check "  ... and the darkroom/ one" 'darkroom/2026-09-01-camera' "$P"

echo "-- C. a broken database says what to do, not 'could not' --"
E=$(curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$BAD_PORT/api/library/delete" -d '{"publicId":"library/2026-09-01-camera-aabbccdd-1200x800.webp"}')
check "names the actual fix" 'surfing-whale.sql' "$E"
S=$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$BAD_PORT/api/library/delete" -d '{"publicId":"library/2026-09-01-camera-aabbccdd-1200x800.webp"}')
check "503, and nothing was deleted" "503" "$S"

echo "-- D. the gate still holds --"
L=$(curl -s --noproxy '*' -H 'content-type: application/json' -X POST "http://localhost:$OK_PORT/api/library/delete" -d '{"publicId":"library/x-1x1.webp"}')
check "no session -> Locked" "Locked" "$L"
O=$(curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST "http://localhost:$OK_PORT/api/library/delete" -d '{"publicId":"../secrets/x-1x1.webp"}')
check "path traversal -> Out of scope" "Out of scope" "$O"

echo "-- E. a photograph reaches the site without an essay --"
ID='library/2026-09-02-stairway-aabbccdd-1200x800.webp'
N=$(curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$OK_PORT/api/library/publish" \
  -d "{\"publicId\":\"$ID\",\"alt\":\"\",\"category\":\"everyday\",\"published\":true,\"width\":1200,\"height\":800}")
check "publishing with no description is refused" "Describe the photograph first" "$N"
NC=$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$OK_PORT/api/library/publish" \
  -d "{\"publicId\":\"$ID\",\"alt\":\"\",\"category\":\"everyday\",\"published\":true,\"width\":1200,\"height\":800}")
check "  ... with 422, not a generic failure" "422" "$NC"

P=$(curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$OK_PORT/api/library/publish" \
  -d "{\"publicId\":\"$ID\",\"alt\":\"A man on a stairway\",\"category\":\"landscapes\",\"published\":true,\"width\":1200,\"height\":800}")
check "publishing with one succeeds" '"ok":true' "$P"

G=$(curl -s --noproxy '*' "http://localhost:$OK_PORT/" | grep -c 'A man on a stairway')
check "and the home page gallery shows it — no essay involved" "1" "$G"

S=$(curl -s --noproxy '*' -b "sw-darkroom=$C" "http://localhost:$OK_PORT/api/library/list" | python3 -c "import json,sys;p=[x for x in json.load(sys.stdin)['photos'] if x['published']];print(len(p))")
check "the studio shows it as published" "1" "$S"

echo "-- F. the url on the row is the bucket's, never the browser's --"
curl -s --noproxy '*' -b "sw-darkroom=$C" -H 'content-type: application/json' -X POST \
  "http://localhost:$OK_PORT/api/library/publish" \
  -d "{\"publicId\":\"$ID\",\"alt\":\"A man on a stairway\",\"category\":\"landscapes\",\"published\":true,\"width\":1200,\"height\":800,\"url\":\"https://evil.example/x.jpg\"}" > /dev/null
H=$(curl -s --noproxy '*' "http://localhost:$OK_PORT/")
check "the gallery serves the bucket url" "localhost:4999/storage/v1/object/public" "$H"
if printf '%s' "$H" | grep -qF 'evil.example'; then
  echo "  FAIL  a url supplied by the client reached the page"; fails=$((fails+1))
else
  echo "  PASS  a url supplied by the client never reached the page"
fi

echo "-- G. a missing table leaves the gallery standing --"
F=$(curl -s --noproxy '*' "http://localhost:$BAD_PORT/" | grep -c 'from the photography archive')
check "home page falls back to the manifest, does not 500" "1" "$F"

echo
[ "$fails" -eq 0 ] && echo "ALL PASS" || echo "$fails FAILED"
exit $fails

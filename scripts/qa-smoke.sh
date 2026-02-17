#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASSWORD="${2:-}"
COOKIE_JAR="$(mktemp)"
BODY_FILE="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR" "$BODY_FILE"
}
trap cleanup EXIT

pass() {
  echo "[PASS] $1"
}

fail() {
  echo "[FAIL] $1"
  exit 1
}

status_code() {
  local method="$1"
  local path="$2"
  shift 2
  curl -sS -o "$BODY_FILE" -w "%{http_code}" -X "$method" "$BASE_URL$path" "$@"
}

assert_code() {
  local method="$1"
  local path="$2"
  local expected="$3"
  shift 3
  local actual
  actual="$(status_code "$method" "$path" "$@")"
  if [[ "$actual" == "$expected" ]]; then
    pass "$method $path -> $expected"
  else
    echo "Response body:"
    cat "$BODY_FILE"
    fail "$method $path expected $expected but got $actual"
  fi
}

assert_redirect_to_login() {
  local path="$1"
  local headers
  headers="$(curl -sS -I "$BASE_URL$path")"
  if echo "$headers" | grep -qiE '^location: .*/login\?next='; then
    pass "GET $path redirects to login with next"
  else
    echo "$headers"
    fail "GET $path did not redirect to /login?next=..."
  fi
}

echo "Base URL: $BASE_URL"

assert_code GET / 200
assert_code GET /philosophy 200
assert_code GET /resume 200
assert_code GET /contact 200
assert_code GET /login 200

assert_redirect_to_login /case-studies
assert_redirect_to_login /case-studies/ml-modernization
assert_redirect_to_login /deep-dive/ml-modernization

assert_code POST /api/login 401 -H "Content-Type: application/json" -d '{"password":"wrong-password"}'
if grep -q 'Incorrect password. Try again.' "$BODY_FILE"; then
  pass "Wrong password returns generic error message"
else
  fail "Wrong password message mismatch"
fi

if [[ -n "$PASSWORD" ]]; then
  assert_code POST /api/login 200 -c "$COOKIE_JAR" -H "Content-Type: application/json" -d "{\"password\":\"$PASSWORD\"}"
  assert_code GET /api/verify-session 200 -b "$COOKIE_JAR"
  if grep -q '"authenticated":true' "$BODY_FILE"; then
    pass "Session verification returned authenticated=true"
  else
    fail "Session verification did not return authenticated=true"
  fi
  assert_code GET /case-studies 200 -b "$COOKIE_JAR"
  assert_code GET /case-studies/ml-modernization 200 -b "$COOKIE_JAR"
  assert_code POST /api/logout 200 -b "$COOKIE_JAR"
  pass "Authenticated route checks passed"
else
  echo "[INFO] Skipped success-login checks (provide password as second arg to run them)."
fi

pass "Smoke QA complete"

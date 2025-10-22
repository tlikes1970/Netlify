#!/usr/bin/env bash
set -euo pipefail

fail=0

check() {
  name="$1"; shift
  if bash -lc "$@" >/dev/null 2>&1; then
    printf "PASS  %s\n" "$name"
  else
    printf "FAIL  %s\n" "$name"
    fail=$((fail+1))
  fi
}

# A) Netlify + Functions
check "Netlify dev command" \
  "rg -n '^\s*command\s*=\s*\"npm run dev --prefix apps/web -- --port 4173 --strictPort\"' netlify.toml || rg -n '^\s*command\s*=\s*\"npm run dev -- --port 4173 --strictPort\"' netlify.toml"

check "Functions directory path" \
  "rg -n '^\s*\[functions\]' netlify.toml && rg -n '^\s*directory\s*=\s*\"netlify/functions\"' netlify.toml"

# B) Functions runtime + presence
check "send-email.cjs exists" \
  "[ -f netlify/functions/send-email.cjs ]"

# C) FlickWord UI + modal bits
check "FlickWord files present" \
  "rg -n 'FlickWord(Game|Modal)' apps/web/src/components/games"
check "FlickWordModal has controls" \
  "rg -n 'close|stats' apps/web/src/components/games/FlickWordModal.tsx"
check "FlickWord CSS sizing rules present" \
  "rg -n '\.flickword-(tile|keyboard)' apps/web/src/**/*.css"

# D) Cache busting helpers exist
check "Game cache helpers present" \
  "rg -n 'clearWordCache|getFreshWord|clearTriviaCache|getFreshTrivia' apps/web/src"

# E) API provider swap present
check "Datamuse/Random Word providers referenced" \
  "rg -n 'datamuse|random-word' apps/web/src netlify/functions"

# F) Unused imports should be gone
check "No getTodaysWord/getTodaysTrivia leftovers" \
  "! rg -n 'getTodaysWord|getTodaysTrivia' apps/web/src"

# G) Lighthouse meta/manifest/theme-color
check "Meta description / manifest / theme-color present" \
  "rg -n '<meta name=\"description\"|<link rel=\"manifest\"|<meta name=\"theme-color\"' apps/web/index.html"

# H) TabCard watching move routing is correct
check "TabCard watching move mapped" \
  "rg -n 'Library\.move\(.*'\\''watching'\\''\)' apps/web/src/components/cards/TabCard.tsx"

# I) CardV2 square-buttons saga residue (informational)
check "CardV2 square-button clues (informational)" \
  "rg -n 'isSquare|aspectRatio|w-\\[68px\\]|!w-10|!h-10|lucide-react' apps/web/src/components/cards/CardV2.tsx || true"

# J) lucide-react dep (only if icons retained)
check "lucide-react dependency (optional)" \
  "jq -r '.dependencies[\"lucide-react\"] // empty' apps/web/package.json | rg . || true"

# K) Poster click → TMDB
check "Poster click opens TMDB" \
  "rg -n 'window\.open\\(.*tmdb|themoviedb\.org' apps/web/src/components"

# L) Pro default enabled
check "Pro enabled by default" \
  "rg -n 'isPro:\\s*true' apps/web/src/lib/settings.ts"

# M) Discovery action handlers
check "Discovery uses Library.upsert" \
  "rg -n 'Library\.upsert\\(' apps/web/src/pages/DiscoveryPage.tsx apps/web/src/components"

# N) Duplicate filtering (should be removed per revert)
check "No discovery dedupe logic (expected absent)" \
  "! rg -n 'smartDiscovery|existingIds|excludeExisting' apps/web/src"

# O) Header/search refs present; Filters row removed
check "HeaderV2/UnifiedSearch/AvatarMenu present" \
  "rg -n 'HeaderV2|UnifiedSearch|AvatarMenu' apps/web/src/components"
check "Filters row removed (no FiltersButton)" \
  "! rg -n 'FiltersButton' apps/web/src/components"

# P) Bottom-nav equal width tabs
check "MobileTabs flex-1 aria-label present" \
  "rg -n 'MobileTabs|flex-1|aria-label' apps/web/src/components"

# Q) Auth timing fix present
check "Auth timing: onAuthStateChanged + loading true" \
  "rg -n 'onAuthStateChanged|useAuth|loading:\\s*true' apps/web/src"

exit $fail




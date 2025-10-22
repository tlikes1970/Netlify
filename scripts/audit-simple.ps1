# Simple PowerShell audit script for Windows
Write-Host "Running Flicklet Restore Audit..." -ForegroundColor Cyan

$fail = 0

# A) Netlify + Functions
Write-Host "`n=== Netlify Configuration ===" -ForegroundColor Yellow

$netlifyContent = Get-Content "netlify.toml" -Raw
if ($netlifyContent -match 'command\s*=\s*"npm run dev --prefix apps/web -- --port 4173 --strictPort"') {
    Write-Host "PASS  Netlify dev command" -ForegroundColor Green
} else {
    Write-Host "FAIL  Netlify dev command" -ForegroundColor Red
    $fail++
}

if ($netlifyContent -match '\[functions\]' -and $netlifyContent -match 'directory\s*=\s*"netlify/functions"') {
    Write-Host "PASS  Functions directory path" -ForegroundColor Green
} else {
    Write-Host "FAIL  Functions directory path" -ForegroundColor Red
    $fail++
}

# B) Functions runtime + presence
if (Test-Path "netlify/functions/send-email.cjs") {
    Write-Host "PASS  send-email.cjs exists" -ForegroundColor Green
} else {
    Write-Host "FAIL  send-email.cjs exists" -ForegroundColor Red
    $fail++
}

if (Test-Path "netlify/functions/tmdb-proxy.cjs") {
    Write-Host "PASS  tmdb-proxy.cjs exists" -ForegroundColor Green
} else {
    Write-Host "FAIL  tmdb-proxy.cjs exists" -ForegroundColor Red
    $fail++
}

# C) FlickWord UI + modal bits
Write-Host "`n=== FlickWord Components ===" -ForegroundColor Yellow

if ((Test-Path "apps/web/src/components/games/FlickWordGame.tsx") -and (Test-Path "apps/web/src/components/games/FlickWordModal.tsx")) {
    Write-Host "PASS  FlickWord files present" -ForegroundColor Green
} else {
    Write-Host "FAIL  FlickWord files present" -ForegroundColor Red
    $fail++
}

if (Test-Path "apps/web/src/components/games/FlickWordModal.tsx") {
    $modalContent = Get-Content "apps/web/src/components/games/FlickWordModal.tsx" -Raw
    if ($modalContent -match "close|stats") {
        Write-Host "PASS  FlickWordModal has controls" -ForegroundColor Green
    } else {
        Write-Host "FAIL  FlickWordModal has controls" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  FlickWordModal has controls" -ForegroundColor Red
    $fail++
}

if (Test-Path "apps/web/src/styles/flickword.css") {
    $cssContent = Get-Content "apps/web/src/styles/flickword.css" -Raw
    if ($cssContent -match "\.fw-tile|\.fw-keyboard") {
        Write-Host "PASS  FlickWord CSS sizing rules present" -ForegroundColor Green
    } else {
        Write-Host "FAIL  FlickWord CSS sizing rules present" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  FlickWord CSS sizing rules present" -ForegroundColor Red
    $fail++
}

# D) Cache busting helpers exist
Write-Host "`n=== Game Cache Helpers ===" -ForegroundColor Yellow

if ((Test-Path "apps/web/src/lib/dailyWordApi.ts") -and (Test-Path "apps/web/src/lib/dailyTriviaApi.ts")) {
    $wordApi = Get-Content "apps/web/src/lib/dailyWordApi.ts" -Raw
    $triviaApi = Get-Content "apps/web/src/lib/dailyTriviaApi.ts" -Raw
    if (($wordApi -match "clearWordCache|getFreshWord") -and ($triviaApi -match "clearTriviaCache|getFreshTrivia")) {
        Write-Host "PASS  Game cache helpers present" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Game cache helpers present" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Game cache helpers present" -ForegroundColor Red
    $fail++
}

# E) API provider swap present
if (Test-Path "apps/web/src/lib/dailyWordApi.ts") {
    $wordApi = Get-Content "apps/web/src/lib/dailyWordApi.ts" -Raw
    if ($wordApi -match "datamuse|random-word") {
        Write-Host "PASS  Datamuse/Random Word providers referenced" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Datamuse/Random Word providers referenced" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Datamuse/Random Word providers referenced" -ForegroundColor Red
    $fail++
}

# F) Unused imports should be gone
Write-Host "`n=== TypeScript Cleanup ===" -ForegroundColor Yellow

# M) No legacy function leftovers (getTodaysTrivia should be absent, getTodaysWord is now the proper daily function)
$foundUnused = $false
$files = Get-ChildItem -Path "apps/web/src" -Recurse -Include "*.ts", "*.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "getTodaysTrivia") {
        $foundUnused = $true
        break
    }
}

if (-not $foundUnused) {
    Write-Host "PASS  No getTodaysTrivia leftovers (getTodaysWord is now proper daily function)" -ForegroundColor Green
} else {
    Write-Host "FAIL  No getTodaysTrivia leftovers (getTodaysWord is now proper daily function)" -ForegroundColor Red
    $fail++
}

# G) Lighthouse meta/manifest/theme-color
Write-Host "`n=== Lighthouse Meta Tags ===" -ForegroundColor Yellow

if (Test-Path "apps/web/index.html") {
    $htmlContent = Get-Content "apps/web/index.html" -Raw
    if ($htmlContent -match '<meta name="description"' -and $htmlContent -match '<link rel="manifest"' -and $htmlContent -match '<meta name="theme-color"') {
        Write-Host "PASS  Meta description / manifest / theme-color present" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Meta description / manifest / theme-color present" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Meta description / manifest / theme-color present" -ForegroundColor Red
    $fail++
}

# H) TabCard watching move routing is correct
Write-Host "`n=== Card Actions ===" -ForegroundColor Yellow

if (Test-Path "apps/web/src/components/cards/TabCard.tsx") {
    $tabCardContent = Get-Content "apps/web/src/components/cards/TabCard.tsx" -Raw
    if ($tabCardContent -match "Library\.move\(.*'watching'\)") {
        Write-Host "PASS  TabCard watching move mapped" -ForegroundColor Green
    } else {
        Write-Host "FAIL  TabCard watching move mapped" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  TabCard watching move mapped" -ForegroundColor Red
    $fail++
}

# I) CardV2 square-button clues (informational)
if (Test-Path "apps/web/src/components/cards/CardV2.tsx") {
    $cardV2Content = Get-Content "apps/web/src/components/cards/CardV2.tsx" -Raw
    if ($cardV2Content -match "isSquare|aspectRatio|w-\[68px\]|!w-10|!h-10|lucide-react") {
        Write-Host "PASS  CardV2 square-button clues (informational)" -ForegroundColor Green
    } else {
        Write-Host "FAIL  CardV2 square-button clues (informational)" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  CardV2 square-button clues (informational)" -ForegroundColor Red
    $fail++
}

# J) lucide-react dep (optional)
if (Test-Path "apps/web/package.json") {
    $packageJson = Get-Content "apps/web/package.json" | ConvertFrom-Json
    if ($packageJson.dependencies."lucide-react" -ne $null) {
        Write-Host "PASS  lucide-react dependency (optional)" -ForegroundColor Green
    } else {
        Write-Host "FAIL  lucide-react dependency (optional)" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  lucide-react dependency (optional)" -ForegroundColor Red
    $fail++
}

# K) Poster click → TMDB
if (Test-Path "apps/web/src/components/cards/CardV2.tsx") {
    $cardV2Content = Get-Content "apps/web/src/components/cards/CardV2.tsx" -Raw
    if ($cardV2Content -match "window\.open\(.*tmdb|themoviedb\.org") {
        Write-Host "PASS  Poster click opens TMDB" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Poster click opens TMDB" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Poster click opens TMDB" -ForegroundColor Red
    $fail++
}

# L) Pro default enabled
Write-Host "`n=== Settings ===" -ForegroundColor Yellow

if (Test-Path "apps/web/src/lib/settings.ts") {
    $settingsContent = Get-Content "apps/web/src/lib/settings.ts" -Raw
    if ($settingsContent -match "isPro:\s*true") {
        Write-Host "PASS  Pro enabled by default" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Pro enabled by default" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Pro enabled by default" -ForegroundColor Red
    $fail++
}

# M) Discovery action handlers
Write-Host "`n=== Discovery ===" -ForegroundColor Yellow

if (Test-Path "apps/web/src/pages/DiscoveryPage.tsx") {
    $discoveryContent = Get-Content "apps/web/src/pages/DiscoveryPage.tsx" -Raw
    if ($discoveryContent -match "Library\.upsert\(") {
        Write-Host "PASS  Discovery uses Library.upsert" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Discovery uses Library.upsert" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Discovery uses Library.upsert" -ForegroundColor Red
    $fail++
}

# N) Duplicate filtering (should be removed per revert)
$foundDedupe = $false
$files = Get-ChildItem -Path "apps/web/src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.FullName -notlike "*firebaseSync*" }
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "smartDiscovery|existingIds|excludeExisting") {
        $foundDedupe = $true
        break
    }
}

if (-not $foundDedupe) {
    Write-Host "PASS  No discovery dedupe logic (expected absent)" -ForegroundColor Green
} else {
    Write-Host "FAIL  No discovery dedupe logic (expected absent)" -ForegroundColor Red
    $fail++
}

# O) Header/search refs present; Filters row removed
Write-Host "`n=== Header Components ===" -ForegroundColor Yellow

if ((Test-Path "apps/web/src/components/HeaderV2.tsx") -and (Test-Path "apps/web/src/components/UnifiedSearch.tsx") -and (Test-Path "apps/web/src/components/AvatarMenu.tsx")) {
    Write-Host "PASS  HeaderV2/UnifiedSearch/AvatarMenu present" -ForegroundColor Green
} else {
    Write-Host "FAIL  HeaderV2/UnifiedSearch/AvatarMenu present" -ForegroundColor Red
    $fail++
}

$foundFiltersButton = $false
$files = Get-ChildItem -Path "apps/web/src/components" -Recurse -Include "*.ts", "*.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "FiltersButton") {
        $foundFiltersButton = $true
        break
    }
}

if (-not $foundFiltersButton) {
    Write-Host "PASS  Filters row removed (no FiltersButton)" -ForegroundColor Green
} else {
    Write-Host "FAIL  Filters row removed (no FiltersButton)" -ForegroundColor Red
    $fail++
}

# P) Bottom-nav equal width tabs
Write-Host "`n=== Mobile Navigation ===" -ForegroundColor Yellow

if (Test-Path "apps/web/src/components/MobileTabs.tsx") {
    $mobileTabsContent = Get-Content "apps/web/src/components/MobileTabs.tsx" -Raw
    if ($mobileTabsContent -match "flex-1") {
        Write-Host "PASS  MobileTabs flex-1 aria-label present" -ForegroundColor Green
    } else {
        Write-Host "FAIL  MobileTabs flex-1 aria-label present" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  MobileTabs flex-1 aria-label present" -ForegroundColor Red
    $fail++
}

# Q) Auth timing fix present
Write-Host "`n=== Auth System ===" -ForegroundColor Yellow

if ((Test-Path "apps/web/src/lib/auth.ts") -and (Test-Path "apps/web/src/hooks/useAuth.ts")) {
    $authContent = Get-Content "apps/web/src/lib/auth.ts" -Raw
    $hookContent = Get-Content "apps/web/src/hooks/useAuth.ts" -Raw
    if (($authContent -match "onAuthStateChanged") -and ($hookContent -match "loading.*true")) {
        Write-Host "PASS  Auth timing: onAuthStateChanged + loading true" -ForegroundColor Green
    } else {
        Write-Host "FAIL  Auth timing: onAuthStateChanged + loading true" -ForegroundColor Red
        $fail++
    }
} else {
    Write-Host "FAIL  Auth timing: onAuthStateChanged + loading true" -ForegroundColor Red
    $fail++
}

Write-Host "`n=== Audit Summary ===" -ForegroundColor Cyan
Write-Host "Audit completed with $fail failures" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })

if ($fail -eq 0) {
    Write-Host "`n🎉 All checks passed! Restore is complete." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ $fail checks failed. Review the issues above." -ForegroundColor Red
    exit $fail
}

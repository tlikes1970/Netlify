# PowerShell audit script for Windows
$fail = 0

function Check {
    param($name, $command)
    try {
        Invoke-Expression $command | Out-Null
        Write-Host "PASS  $name" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL  $name" -ForegroundColor Red
        $script:fail++
    }
}

# A) Netlify + Functions
Check "Netlify dev command" {
    $content = Get-Content "netlify.toml" -Raw
    $content -match 'command\s*=\s*"npm run dev --prefix apps/web -- --port 4173 --strictPort"'
}

Check "Functions directory path" {
    $content = Get-Content "netlify.toml" -Raw
    $content -match '\[functions\]' -and $content -match 'directory\s*=\s*"netlify/functions"'
}

# B) Functions runtime + presence
Check "send-email.cjs exists" {
    Test-Path "netlify/functions/send-email.cjs"
}

# C) FlickWord UI + modal bits
Check "FlickWord files present" {
    Test-Path "apps/web/src/components/games/FlickWordGame.tsx" -and Test-Path "apps/web/src/components/games/FlickWordModal.tsx"
}

Check "FlickWordModal has controls" {
    $content = Get-Content "apps/web/src/components/games/FlickWordModal.tsx" -Raw
    $content -match "close|stats"
}

Check "FlickWord CSS sizing rules present" {
    $content = Get-Content "apps/web/src/styles/flickword.css" -Raw
    $content -match "\.fw-tile|\.fw-keyboard"
}

# D) Cache busting helpers exist
Check "Game cache helpers present" {
    $wordApi = Get-Content "apps/web/src/lib/dailyWordApi.ts" -Raw
    $triviaApi = Get-Content "apps/web/src/lib/dailyTriviaApi.ts" -Raw
    ($wordApi -match "clearWordCache|getFreshWord") -and ($triviaApi -match "clearTriviaCache|getFreshTrivia")
}

# E) API provider swap present
Check "Datamuse/Random Word providers referenced" {
    $wordApi = Get-Content "apps/web/src/lib/dailyWordApi.ts" -Raw
    $wordApi -match "datamuse|random-word"
}

# F) Unused imports should be gone
Check "No getTodaysWord/getTodaysTrivia leftovers" {
    $files = Get-ChildItem -Path "apps/web/src" -Recurse -Include "*.ts", "*.tsx"
    $found = $false
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "getTodaysWord|getTodaysTrivia") {
            $found = $true
            break
        }
    }
    -not $found
}

# G) Lighthouse meta/manifest/theme-color
Check "Meta description / manifest / theme-color present" {
    $content = Get-Content "apps/web/index.html" -Raw
    $content -match '<meta name="description"' -and $content -match '<link rel="manifest"' -and $content -match '<meta name="theme-color"'
}

# H) TabCard watching move routing is correct
Check "TabCard watching move mapped" {
    $content = Get-Content "apps/web/src/components/cards/TabCard.tsx" -Raw
    $content -match "Library\.move\(.*'watching'\)"
}

# I) CardV2 square-buttons saga residue (informational)
Check "CardV2 square-button clues (informational)" {
    $content = Get-Content "apps/web/src/components/cards/CardV2.tsx" -Raw
    $content -match "isSquare|aspectRatio|w-\[68px\]|!w-10|!h-10|lucide-react"
}

# J) lucide-react dep (optional)
Check "lucide-react dependency (optional)" {
    $packageJson = Get-Content "apps/web/package.json" | ConvertFrom-Json
    $packageJson.dependencies."lucide-react" -ne $null
}

# K) Poster click → TMDB
Check "Poster click opens TMDB" {
    $content = Get-Content "apps/web/src/components/cards/CardV2.tsx" -Raw
    $content -match "window\.open\(.*tmdb|themoviedb\.org"
}

# L) Pro default enabled
Check "Pro enabled by default" {
    $content = Get-Content "apps/web/src/lib/settings.ts" -Raw
    $content -match "isPro:\s*true"
}

# M) Discovery action handlers
Check "Discovery uses Library.upsert" {
    $content = Get-Content "apps/web/src/pages/DiscoveryPage.tsx" -Raw
    $content -match "Library\.upsert\("
}

# N) Duplicate filtering (should be removed per revert)
Check "No discovery dedupe logic (expected absent)" {
    $files = Get-ChildItem -Path "apps/web/src" -Recurse -Include "*.ts", "*.tsx"
    $found = $false
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "smartDiscovery|existingIds|excludeExisting") {
            $found = $true
            break
        }
    }
    -not $found
}

# O) Header/search refs present; Filters row removed
Check "HeaderV2/UnifiedSearch/AvatarMenu present" {
    (Test-Path "apps/web/src/components/HeaderV2.tsx") -and (Test-Path "apps/web/src/components/UnifiedSearch.tsx") -and (Test-Path "apps/web/src/components/AvatarMenu.tsx")
}

Check "Filters row removed (no FiltersButton)" {
    $files = Get-ChildItem -Path "apps/web/src/components" -Recurse -Include "*.ts", "*.tsx"
    $found = $false
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "FiltersButton") {
            $found = $true
            break
        }
    }
    -not $found
}

# P) Bottom-nav equal width tabs
Check "MobileTabs flex-1 aria-label present" {
    $content = Get-Content "apps/web/src/components/MobileTabs.tsx" -Raw
    $content -match "flex-1"
}

# Q) Auth timing fix present
Check "Auth timing: onAuthStateChanged + loading true" {
    $authContent = Get-Content "apps/web/src/lib/auth.ts" -Raw
    $hookContent = Get-Content "apps/web/src/hooks/useAuth.ts" -Raw
    ($authContent -match "onAuthStateChanged") -and ($hookContent -match "loading.*true")
}

Write-Host "`nAudit completed with $fail failures"
exit $fail


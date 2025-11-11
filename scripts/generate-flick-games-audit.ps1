# FlickWord + FlickTrivia - complete extract for Cursor audit
# PowerShell version for Windows

$ErrorActionPreference = "Stop"

# 1. Make a temp workspace
$REPORT = "$env:TEMP\flick_games_audit.md"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"# FlickGames Deep-Dive Report - $timestamp" | Out-File -FilePath $REPORT -Encoding utf8
"" | Out-File -FilePath $REPORT -Append -Encoding utf8

# 2. Helper: append file with nice header
function Add-Section {
    param(
        [string]$Title,
        [string]$Path
    )
    
    if (-not (Test-Path $Path)) {
        return
    }
    
    "" | Out-File -FilePath $REPORT -Append -Encoding utf8
    "## $Title" | Out-File -FilePath $REPORT -Append -Encoding utf8
    '```' | Out-File -FilePath $REPORT -Append -Encoding utf8
    
    # Read file content and strip secrets
    $content = Get-Content $Path -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $content = $content -replace '(apiKey|appId|measurementId|Stripe\.key|STRIPE_|REACT_APP_)[^,"]*"', '$1[REDACTED]'
        $content | Out-File -FilePath $REPORT -Append -Encoding utf8
    }
    
    '```' | Out-File -FilePath $REPORT -Append -Encoding utf8
}

# 3. Discover every file that references the games (case-insensitive)
Write-Host "Searching for game-related files..."
$gameFiles = Get-ChildItem -Path . -Recurse -File `
    -Exclude "*.log" `
    | Where-Object {
        $excludeDirs = @("node_modules", ".git", "dist", "build", ".next")
        $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
        -not ($excludeDirs | Where-Object { $relativePath -like "*\$_\*" })
    } `
    | Select-String -Pattern "(flickword|flick trivia|flicktrivia|game|trivia|word)" -CaseSensitive:$false -List `
    | Select-Object -ExpandProperty Path -Unique `
    | Sort-Object

Write-Host "Found $($gameFiles.Count) files"

# 4. Bucket by category
$buckets = @{
    "01-routing" = @("router", "routes", "navigation", "screen", "page")
    "02-layout-ui" = @("jsx", "tsx", "vue", "svelte", "xml", "storyboard", "xib")
    "03-styles" = @("css", "scss", "sass", "styled", "theme")
    "04-logic-hooks" = @("ts", "js", "jsx", "tsx")
    "05-state-mgmt" = @("redux", "store", "context", "provider", "zustand", "recoil", "mobx")
    "06-firebase" = @("firestore", "firebase", "rules", "indexes")
    "07-remote-config" = @("remoteconfig", "defaults", "featureflag")
    "08-analytics" = @("analytics", "posthog", "amplitude", "event")
    "09-tests" = @("test", "spec", "e2e")
    "10-stripe" = @("stripe", "billing", "pro", "subscription")
    "99-misc" = @("*")
}

$tempDir = "$env:TEMP\flick_audit_buckets"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

foreach ($bucketKey in $buckets.Keys) {
    $extensions = $buckets[$bucketKey]
    $bucketDir = Join-Path $tempDir $bucketKey
    New-Item -ItemType Directory -Path $bucketDir -Force | Out-Null
    
    foreach ($file in $gameFiles) {
        $ext = [System.IO.Path]::GetExtension($file).TrimStart('.')
        $name = [System.IO.Path]::GetFileName($file).ToLower()
        
        $matches = $false
        if ($bucketKey -eq "99-misc") {
            $matches = $true
        } else {
            foreach ($extPattern in $extensions) {
                if ($name -like "*$extPattern*" -or $ext -eq $extPattern) {
                    $matches = $true
                    break
                }
            }
        }
        
        if ($matches) {
            $relativePath = $file.Replace((Get-Location).Path + "\", "")
            $destPath = Join-Path $bucketDir $relativePath
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $file $destPath -ErrorAction SilentlyContinue
        }
    }
}

# 5. Append each bucket to the report
$bucketDirs = Get-ChildItem $tempDir -Directory | Sort-Object Name
foreach ($bucketDir in $bucketDirs) {
    $bn = $bucketDir.Name
    "" | Out-File -FilePath $REPORT -Append -Encoding utf8
    "# $bn" | Out-File -FilePath $REPORT -Append -Encoding utf8
    
    $files = Get-ChildItem $bucketDir -Recurse -File | Sort-Object FullName
    foreach ($file in $files) {
        $relativePath = $file.FullName.Replace($bucketDir.FullName + "\", "")
        Add-Section -Title $relativePath -Path $file.FullName
    }
}

# 6. Extra meta: package.json scripts, env example, README snippets
$metaFiles = @("package.json", ".env.example", "README.md", "apps\web\package.json")
foreach ($f in $metaFiles) {
    if (Test-Path $f) {
        Add-Section -Title $f -Path $f
    }
}

# 7. Quick stats table
"" | Out-File -FilePath $REPORT -Append -Encoding utf8
"# Quick Stats" | Out-File -FilePath $REPORT -Append -Encoding utf8
"| Term | Hits | Files |" | Out-File -FilePath $REPORT -Append -Encoding utf8
"|------|------|-------|" | Out-File -FilePath $REPORT -Append -Encoding utf8

$terms = @("FlickWord", "FlickTrivia", "trivia", "word", "game")
foreach ($term in $terms) {
    $hits = (Get-ChildItem -Path . -Recurse -File `
        -Exclude "*.log" `
        | Where-Object {
            $excludeDirs = @("node_modules", ".git", "dist", "build", ".next")
            $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
            -not ($excludeDirs | Where-Object { $relativePath -like "*\$_\*" })
        } `
        | Select-String -Pattern $term -CaseSensitive:$false `
        | Measure-Object).Count
    
    $fileCount = (Get-ChildItem -Path . -Recurse -File `
        -Exclude "*.log" `
        | Where-Object {
            $excludeDirs = @("node_modules", ".git", "dist", "build", ".next")
            $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
            -not ($excludeDirs | Where-Object { $relativePath -like "*\$_\*" })
        } `
        | Select-String -Pattern $term -CaseSensitive:$false -List `
        | Select-Object -ExpandProperty Path -Unique `
        | Measure-Object).Count
    
    "| $term | $hits | $fileCount |" | Out-File -FilePath $REPORT -Append -Encoding utf8
}

# 8. Final note
"" | Out-File -FilePath $REPORT -Append -Encoding utf8
"_Report generated at $REPORT _" | Out-File -FilePath $REPORT -Append -Encoding utf8

Write-Host "Report generated at: $REPORT"
Write-Host "Opening in Cursor..."

# Open the file
Start-Process "cursor" -ArgumentList "`"$REPORT`"" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    Start-Process "code" -ArgumentList "`"$REPORT`"" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Invoke-Item $REPORT
    }
}

# Cleanup
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Done!"


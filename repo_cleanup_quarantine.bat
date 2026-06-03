@echo off
setlocal enabledelayedexpansion

echo Flicklet Repo Cleanup - Quarantine Mode
echo ---------------------------------------
echo This script MOVES obvious archive/report/debris folders into _repo_cleanup_archive.
echo It does NOT delete files.
echo.

set "ROOT=%cd%"
set "STAMP=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "ARCHIVE=%ROOT%\_repo_cleanup_archive\%STAMP%"

mkdir "%ARCHIVE%"

echo Creating archive folder:
echo %ARCHIVE%
echo.

REM --- Move legacy/archive/migration-style folders ---
for %%D in (
  "_legacy_v1"
  "legacy"
  "archive"
  "migration"
  "migration-pack"
  "Lighthouse Reports"
  "Card Design"
  "Page design"
  "Cursor Rules"
  "SUBMISSION"
) do (
  if exist "%ROOT%\%%~D" (
    echo Moving folder: %%~D
    move "%ROOT%\%%~D" "%ARCHIVE%\" >nul
  )
)

REM --- Move noisy root markdown/report docs, but keep core docs ---
mkdir "%ARCHIVE%\root-docs"

for %%F in (
  "*REPORT*.md"
  "*SUMMARY*.md"
  "*AUDIT*.md"
  "*FORENSIC*.md"
  "*IMPLEMENTATION*.md"
  "*CHECKLIST*.md"
  "*READINESS*.md"
  "*GUIDE*.md"
  "PHASE*.md"
  "PRO*.md"
  "PLAY_STORE*.md"
  "GOOGLE_PLAY*.md"
  "IOS_APP_STORE*.md"
  "MOBILE*.md"
  "ORIGIN_VALIDATION_FIX_SUMMARY.md"
  "NETLIFY_ENV*.md"
  "PRICING_PLAN.md"
) do (
  for %%G in ("%ROOT%\%%~F") do (
    if exist "%%~G" (
      echo Moving doc: %%~nxG
      move "%%~G" "%ARCHIVE%\root-docs\" >nul
    )
  )
)

REM --- Preserve important root files by moving back if accidentally caught ---
for %%F in (
  "README.md"
  "CHANGELOG.md"
) do (
  if exist "%ARCHIVE%\root-docs\%%~F" (
    echo Restoring important file: %%~F
    move "%ARCHIVE%\root-docs\%%~F" "%ROOT%\" >nul
  )
)

REM --- Move obvious old standalone test/debug scripts from root ---
mkdir "%ARCHIVE%\root-scripts"

for %%F in (
  "test-*.js"
  "debug-*.js"
  "clear-caches-console.js"
  "grantAdmin.js"
  "js_files.txt"
  "structure_filtered.txt"
) do (
  for %%G in ("%ROOT%\%%~F") do (
    if exist "%%~G" (
      echo Moving root script/file: %%~nxG
      move "%%~G" "%ARCHIVE%\root-scripts\" >nul
    )
  )
)

echo.
echo Done.
echo.
echo IMPORTANT:
echo Review the app after this before committing.
echo If anything breaks, move files back from:
echo %ARCHIVE%
echo.
echo Recommended next commands:
echo git status
echo npm run build
echo npx netlify dev
echo.
pause
endlocal
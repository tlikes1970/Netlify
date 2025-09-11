@echo off
echo 🧪 Running Playwright Tests for TV Tracker...
echo.

echo 📋 Available test files:
dir tests\*.spec.ts /b

echo.
echo 🚀 Starting tests...
echo.

npx playwright test

echo.
echo ✅ Tests completed!
pause

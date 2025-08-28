@echo off
echo Copying index.html to www folder...
copy "d:\side projects\tv tracker\index.html" "d:\side projects\tv tracker\www\index.html"
if %errorlevel% equ 0 (
    echo Successfully copied index.html to www folder!
) else (
    echo Error copying file. Check if www folder exists.
)
pause

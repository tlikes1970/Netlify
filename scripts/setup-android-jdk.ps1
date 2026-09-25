# Align Gradle CLI and Android Studio on the same JDK (Option A).
# Uses Android Studio bundled JBR (Java 21) - matches Capacitor 7 Android requirements.
#
# Run from repo root:  .\scripts\setup-android-jdk.ps1
# Re-open terminals and Android Studio after running.

$ErrorActionPreference = 'Stop'

$JbrHome = 'C:\Program Files\Android\Android Studio\jbr'
$JavaExe = Join-Path $JbrHome 'bin\java.exe'

if (-not (Test-Path $JavaExe)) {
    Write-Error "Android Studio JBR not found at: $JbrHome`nInstall Android Studio or edit JbrHome in this script."
}

Write-Host "Using JBR: $JbrHome"
cmd /c "`"$JavaExe`" -version 2>&1"

# Persistent user JAVA_HOME (Windows)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $JbrHome, 'User')
$env:JAVA_HOME = $JbrHome
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$binPath = Join-Path $JbrHome 'bin'
if ($userPath -notlike "*$binPath*") {
    [System.Environment]::SetEnvironmentVariable('Path', "$binPath;$userPath", 'User')
    $env:Path = "$binPath;$env:Path"
}

# CLI Gradle from android/ (gradle.properties is gitignored — local only)
$repoRoot = Split-Path $PSScriptRoot -Parent
$gradleProps = Join-Path $repoRoot 'android\gradle.properties'
$javaHomeLine = "org.gradle.java.home=$($JbrHome -replace '\\', '/')"
if (Test-Path $gradleProps) {
    $content = Get-Content $gradleProps -Raw
    if ($content -match '(?m)^org\.gradle\.java\.home=') {
        $content = $content -replace '(?m)^org\.gradle\.java\.home=.*', $javaHomeLine
    } else {
        $content = $content.TrimEnd() + "`n`n# Option A: same JDK as Android Studio Gradle (see scripts/setup-android-jdk.ps1)`n$javaHomeLine`n"
    }
    Set-Content -Path $gradleProps -Value $content -NoNewline
    Write-Host "Updated android/gradle.properties (org.gradle.java.home)"
} else {
    Write-Warning 'android/gradle.properties not found - create from your local template, then re-run.'
}

Write-Host ''
Write-Host 'Done. Next steps:'
Write-Host '  1. Close and reopen PowerShell / Cursor terminals'
Write-Host '  2. Restart Android Studio (Gradle JDK uses JAVA_HOME via .idea/gradle.xml)'
Write-Host '  3. Verify:  java -version'
Write-Host '            cd android; .\gradlew.bat -version'

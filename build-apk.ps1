# Builds the Android APK locally (no cloud, no account).
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1
# Output: Collex-HR.apk next to this script.
$ErrorActionPreference = "Stop"
$tools = "D:\New Software\tools"
$env:JAVA_HOME = "$tools\jdk17"
$env:ANDROID_HOME = "$tools\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
$env:NODE_ENV = "production"

Set-Location $PSScriptRoot

npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw "prebuild failed" }

Set-Location "$PSScriptRoot\android"
.\gradlew.bat assembleRelease --no-daemon "-Dorg.gradle.jvmargs=-Xmx4g"
if ($LASTEXITCODE -ne 0) { throw "gradle build failed" }

Copy-Item "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk" "$PSScriptRoot\Collex-HR.apk" -Force
Write-Host "APK ready: $PSScriptRoot\Collex-HR.apk"



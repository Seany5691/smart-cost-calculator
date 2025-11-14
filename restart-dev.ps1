# Restart Development Server Script
# This clears cache and restarts the Next.js dev server

Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*next*" } | Stop-Process -Force

Write-Host "Removing .next cache folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host ".next folder removed" -ForegroundColor Green
}

Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
npm run dev

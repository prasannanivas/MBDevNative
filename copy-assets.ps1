# Quick Asset Copy Script
# This copies assets from RoostDevNative to MBDevNative as placeholders

Write-Host "🎨 Copying assets from RoostDevNative to MBDevNative..." -ForegroundColor Cyan

$roostAssets = "d:\Roost Full Stack\RoostDevNative\assets"
$mbAssets = "d:\Roost Full Stack\MBDevNative\assets"

# Check if source files exist
if (-Not (Test-Path "$roostAssets\app-icon-main.png")) {
    Write-Host "❌ Source assets not found in RoostDevNative!" -ForegroundColor Red
    exit 1
}

# Copy icon
Write-Host "📱 Copying app icon..." -ForegroundColor Yellow
Copy-Item "$roostAssets\app-icon-main.png" "$mbAssets\icon.png" -Force

# Copy adaptive icon
Write-Host "🤖 Copying adaptive icon..." -ForegroundColor Yellow
Copy-Item "$roostAssets\adaptive-icon.png" "$mbAssets\adaptive-icon.png" -Force

# Copy favicon
Write-Host "🌐 Copying favicon..." -ForegroundColor Yellow
Copy-Item "$roostAssets\favicon.png" "$mbAssets\favicon.png" -Force

# Create splash screen (simple approach - copy icon as splash for now)
Write-Host "💦 Creating splash screen..." -ForegroundColor Yellow
Copy-Item "$roostAssets\app-icon-main.png" "$mbAssets\splash.png" -Force

Write-Host ""
Write-Host "✅ Asset copy complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review copied assets in MBDevNative\assets\" -ForegroundColor White
Write-Host "2. (Optional) Customize them to distinguish from main Roost app" -ForegroundColor White
Write-Host "3. Test with: npm start" -ForegroundColor White
Write-Host "4. When ready, build with: eas build --platform ios --profile production" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: You can use the same assets for now and customize later!" -ForegroundColor Yellow

# MBDevNative - Android Build Script
# This script builds and submits the app to Google Play Store

Write-Host "🚀 MBDevNative - Android Build & Submit Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectPath = "d:\Roost Full Stack\MBDevNative"
Set-Location $projectPath

Write-Host "📁 Project Path: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI installation..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ EAS CLI already installed" -ForegroundColor Green
}

Write-Host ""

# Prompt user for action
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Build for Android (production)" -ForegroundColor White
Write-Host "2. Submit to Play Store" -ForegroundColor White
Write-Host "3. Build AND Submit (both)" -ForegroundColor White
Write-Host "4. Check build status" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🏗️  Building Android app..." -ForegroundColor Cyan
        Write-Host "This will take 10-20 minutes. Please wait..." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile production
        
        Write-Host ""
        Write-Host "✅ Build complete! Check the output above for the download link." -ForegroundColor Green
        Write-Host "💡 To submit to Play Store, run this script again and choose option 2." -ForegroundColor Yellow
    }
    
    "2" {
        Write-Host ""
        Write-Host "📤 Submitting to Play Store..." -ForegroundColor Cyan
        
        # Check if service account key is set
        if (-not $env:GOOGLE_SERVICE_ACCOUNT_KEY) {
            Write-Host ""
            Write-Host "⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not set!" -ForegroundColor Red
            Write-Host "Please enter the path to your service account JSON file:" -ForegroundColor Yellow
            $keyPath = Read-Host "Path"
            
            if (Test-Path $keyPath) {
                $env:GOOGLE_SERVICE_ACCOUNT_KEY = $keyPath
                Write-Host "✅ Service account key set!" -ForegroundColor Green
            } else {
                Write-Host "❌ File not found: $keyPath" -ForegroundColor Red
                Write-Host "You can submit manually or set the environment variable and try again." -ForegroundColor Yellow
                exit
            }
        }
        
        Write-Host ""
        eas submit --platform android --profile production
        
        Write-Host ""
        Write-Host "✅ Submission complete!" -ForegroundColor Green
        Write-Host "📱 Check Google Play Console for review status." -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host ""
        Write-Host "🏗️  Building Android app..." -ForegroundColor Cyan
        Write-Host "This will take 10-20 minutes. Please wait..." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile production
        
        Write-Host ""
        Write-Host "✅ Build complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📤 Now submitting to Play Store..." -ForegroundColor Cyan
        
        # Check if service account key is set
        if (-not $env:GOOGLE_SERVICE_ACCOUNT_KEY) {
            Write-Host ""
            Write-Host "⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not set!" -ForegroundColor Red
            Write-Host "Please enter the path to your service account JSON file:" -ForegroundColor Yellow
            $keyPath = Read-Host "Path"
            
            if (Test-Path $keyPath) {
                $env:GOOGLE_SERVICE_ACCOUNT_KEY = $keyPath
                Write-Host "✅ Service account key set!" -ForegroundColor Green
            } else {
                Write-Host "❌ File not found: $keyPath" -ForegroundColor Red
                Write-Host "You can submit manually or set the environment variable and try again." -ForegroundColor Yellow
                exit
            }
        }
        
        Write-Host ""
        eas submit --platform android --profile production
        
        Write-Host ""
        Write-Host "✅ All done! Your app is submitted to Play Store!" -ForegroundColor Green
        Write-Host "📱 Check Google Play Console for review status (3-7 days)." -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host ""
        Write-Host "📊 Checking build status..." -ForegroundColor Cyan
        Write-Host ""
        eas build:list --platform android --limit 5
        
        Write-Host ""
        Write-Host "💡 To view detailed logs for a build, use:" -ForegroundColor Yellow
        Write-Host "   eas build:view <BUILD_ID>" -ForegroundColor White
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Please run the script again and choose 1-4." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Script completed!" -ForegroundColor Cyan

# Assets Directory

This directory should contain all static assets for the MBDevNative app.

## Required Assets

### Icons

1. **icon.png** (1024x1024px)
   - App icon for iOS and Android
   - Should feature the Roost logo
   - Use brand colors (Roost Red: #CB003F)

2. **adaptive-icon.png** (1024x1024px)
   - Android adaptive icon
   - Should have transparent background
   - Icon should fit within safe area

3. **favicon.png** (48x48px or larger)
   - Web app favicon
   - Simple version of the app icon

### Splash Screen

4. **splash.png** (1242x2436px or larger)
   - Launch screen image
   - Background color: #CB003F (Roost Red)
   - Should contain Roost logo centered
   - Text: "Roost Mortgage Broker"

## Temporary Solution

The app will run without these assets, but you'll see warnings. To quickly test:

1. Use placeholder images from the main RoostDevNative app
2. Copy assets from: `../RoostDevNative/assets/`
3. Or create simple placeholder images with the correct dimensions

## Brand Guidelines

- **Primary Color**: #CB003F (Roost Red/Maroon)
- **Secondary Color**: #377473 (Green)
- **Logo**: Should match existing Roost branding
- **Style**: Professional, clean, modern

## Asset Generation Tools

### Online Tools
- [App Icon Generator](https://www.appicon.co/)
- [Splash Screen Generator](https://apetools.webprofusion.com/app/#/tools/imagegorilla)
- [Adaptive Icon Generator](https://romannurik.github.io/AndroidAssetStudio/)

### Design Software
- Figma
- Adobe Illustrator
- Sketch
- Canva (for quick mockups)

## Adding Assets

1. Place files in this directory:
   ```
   assets/
   ├── icon.png
   ├── splash.png
   ├── adaptive-icon.png
   └── favicon.png
   ```

2. No need to modify `app.json` - it's already configured

3. Restart the Expo development server:
   ```bash
   expo start -c
   ```

## Notes

- Use PNG format for better quality
- Ensure transparent backgrounds where needed
- Optimize file sizes for faster app loading
- Test on both iOS and Android devices
- Follow platform-specific design guidelines

## Future Assets

Consider adding these in future updates:
- App screenshots for store listings
- Marketing materials
- Tutorial/onboarding images
- Empty state illustrations
- Custom icons for specific features

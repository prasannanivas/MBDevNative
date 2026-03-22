# 🎨 Asset Creation Guide for MBDevNative

## Missing Assets Checklist

You need to create these 4 image files before building:

- [ ] `assets/icon.png` - App Icon
- [ ] `assets/splash.png` - Splash Screen
- [ ] `assets/adaptive-icon.png` - Android Icon
- [ ] `assets/favicon.png` - Web Icon

---

## Option 1: Quick Start - Copy from RoostDevNative (Recommended)

Since you already have assets for RoostDevNative, you can start by copying them as placeholders and customize later:

```bash
# Copy icon files from RoostDevNative
copy "d:\Roost Full Stack\RoostDevNative\assets\app-icon-main.png" "d:\Roost Full Stack\MBDevNative\assets\icon.png"

copy "d:\Roost Full Stack\RoostDevNative\assets\adaptive-icon.png" "d:\Roost Full Stack\MBDevNative\assets\adaptive-icon.png"

copy "d:\Roost Full Stack\RoostDevNative\assets\favicon.png" "d:\Roost Full Stack\MBDevNative\assets\favicon.png"
```

For splash.png, you can create a simple one with the Roost logo centered on the red background (#CB003F).

---

## Option 2: Create Custom Assets

### 1. App Icon (`icon.png`)

**Specifications:**
- Size: 1024 x 1024 pixels
- Format: PNG with no transparency
- Color space: sRGB or P3
- No alpha channel

**Design Tips:**
- Use Roost branding colors (Red: #CB003F, White, Black)
- Add "MB" or "Mortgage Broker" distinction from main Roost app
- Keep design simple and recognizable at small sizes
- Test at 60x60px to see how it looks on home screen

**Tools:**
- Figma (free, web-based)
- Canva (free templates available)
- Photoshop / Illustrator
- Online: [Canva App Icon Maker](https://www.canva.com/create/app-icons/)

---

### 2. Splash Screen (`splash.png`)

**Specifications:**
- Size: 2048 x 2048 pixels (will be scaled down)
- Format: PNG with transparency (optional)
- Background color set in app.json: #CB003F

**Design Tips:**
- Center your logo in safe area (middle 60%)
- Keep it simple - users see this briefly
- Use white or light logo on the Roost red background
- Can use same logo as icon

**Simple Approach:**
1. Create 2048x2048 canvas with transparent background
2. Place your logo/icon in center (around 800x800)
3. Background color (#CB003F) is set automatically in app.json

---

### 3. Adaptive Icon (`adaptive-icon.png`)

**Specifications:**
- Size: 1024 x 1024 pixels
- Format: PNG
- Safe zone: Keep important content within center 66% (circle)
- Foreground image only (background color set in app.json)

**Design Tips:**
- Android will mask this into various shapes (circle, square, squircle)
- Keep logo/important elements in center circle area
- Outer 17% on each side may be cropped
- Can use same design as main icon

---

### 4. Favicon (`favicon.png`)

**Specifications:**
- Size: 48 x 48 pixels (or 32x32)
- Format: PNG or ICO
- For PWA/web version

**Simple Approach:**
- Take your main icon and resize to 48x48
- Ensure it's still recognizable at small size

---

## Option 3: Use Online Tools

### App Icon Generator
Use a tool to generate all sizes from one source image:

1. **[Expo Icon Generator](https://github.com/expo/expo-cli)**
   ```bash
   npx expo-optimize
   ```

2. **[MakeAppIcon](https://makeappicon.com/)** (Free)
   - Upload 1024x1024 icon
   - Downloads all required sizes

3. **[AppIcon.co](https://appicon.co/)** (Free)
   - Upload source image
   - Generate all platforms

---

## Testing Your Assets

After adding the assets:

1. **Test locally:**
   ```bash
   cd "d:\Roost Full Stack\MBDevNative"
   npm start
   ```

2. **Verify:**
   - Icon shows correctly in Expo Go
   - Splash screen displays on app launch
   - No missing asset warnings

3. **Test build:**
   ```bash
   eas build --platform ios --profile preview
   ```

---

## Asset Dimensions Reference

| Asset | Size | Format | Purpose |
|-------|------|--------|---------|
| icon.png | 1024x1024 | PNG | Main app icon (iOS & Android) |
| splash.png | 2048x2048 | PNG | Launch screen |
| adaptive-icon.png | 1024x1024 | PNG | Android adaptive icon |
| favicon.png | 48x48 | PNG | Web/PWA icon |

---

## Quick Design Ideas for Mortgage Broker Variant

Since this is the Mortgage Broker version of Roost:

1. **Use Roost Logo + Badge**
   - Main Roost logo
   - Add "MB" or small house icon in corner

2. **Color Variations**
   - Keep Roost red (#CB003F)
   - Add gold/yellow accent for "broker" distinction

3. **Icon Overlay**
   - Roost logo as base
   - Overlay briefcase or professional symbol

4. **Text Badge**
   - Roost logomark
   - "Broker" text underneath (legible at small sizes)

---

## Need Help?

If you need professional assets created:
- Hire on Fiverr (app icon design ~$20-50)
- Use AI tools: Midjourney, DALL-E 3
- Contact your design team

---

## ✅ Final Checklist

Before building:
- [ ] All 4 asset files exist in `assets/` folder
- [ ] Icon is 1024x1024 PNG with no transparency
- [ ] Splash is at least 2048x2048
- [ ] Assets tested with `npm start`
- [ ] No warnings about missing files
- [ ] Ready to run `eas build`!

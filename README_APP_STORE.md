# 🚀 MBDevNative App Store - Quick Start

## What I've Set Up For You

I've configured your MBDevNative project for App Store submission! Here's what's been done:

### ✅ Files Created/Updated:

1. **[eas.json](./eas.json)** - EAS Build configuration (same setup as RoostDevNative)
2. **[app.json](./app.json)** - Updated with:
   - iOS-specific settings (build number, permissions, info.plist)
   - App description and keywords
   - Privacy and security settings
3. **[APP_STORE_SUBMISSION_GUIDE.md](./APP_STORE_SUBMISSION_GUIDE.md)** - Complete step-by-step guide
4. **[APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md)** - Tracked checklist to follow
5. **[ASSET_CREATION_GUIDE.md](./ASSET_CREATION_GUIDE.md)** - How to create required images
6. **[copy-assets.ps1](./copy-assets.ps1)** - Script to copy assets from RoostDevNative

---

## ⚡ Super Quick Start (5 Minutes)

### Step 1: Copy Assets from RoostDevNative (Fastest)

Run this PowerShell script to copy placeholder assets:

```powershell
cd "d:\Roost Full Stack\MBDevNative"
.\copy-assets.ps1
```

This creates:
- `assets/icon.png`
- `assets/splash.png`
- `assets/adaptive-icon.png`
- `assets/favicon.png`

### Step 2: Test Locally

```bash
npm start
```

Scan QR code with Expo Go and verify the app loads without errors.

### Step 3: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Name:** Roost Mortgage Broker
   - **Bundle ID:** com.roostapp.mortgagebroker
   - **SKU:** mb-dev-native
4. **Copy the 10-digit App ID** (looks like: 6463172728)
5. Open `eas.json` and replace `"YOUR_APP_STORE_CONNECT_APP_ID"` with your actual App ID

### Step 4: Build for iOS

```bash
cd "d:\Roost Full Stack\MBDevNative"
eas build --platform ios --profile production
```

⏱️ **Takes 15-20 minutes**

### Step 5: Submit to App Store

```bash
eas submit --platform ios --profile production
```

### Step 6: Fill Out App Store Info

Go to App Store Connect and add:
- Screenshots (3 minimum - 1290x2796 pixels)
- Description (template provided in guide)
- Keywords
- Support URL: https://roostapp.io/support

See **[APP_STORE_SUBMISSION_GUIDE.md](./APP_STORE_SUBMISSION_GUIDE.md)** for the full content.

### Step 7: Submit for Review

Click **"Submit for Review"** in App Store Connect.

⏱️ **Apple review: 24-48 hours**

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| [APP_STORE_SUBMISSION_GUIDE.md](./APP_STORE_SUBMISSION_GUIDE.md) | Complete step-by-step process |
| [APP_STORE_CHECKLIST.md](./APP_STORE_CHECKLIST.md) | Track your progress |
| [ASSET_CREATION_GUIDE.md](./ASSET_CREATION_GUIDE.md) | How to create/customize app icons |

---

## 🎯 What You Need Right Now

### Immediate (Before Building):
- [ ] **Assets** - Run `copy-assets.ps1` OR create custom assets
- [ ] **App Store Connect App** - Create the app and get App ID
- [ ] **Update eas.json** - Add your App Store Connect App ID

### Later (Before Submission):
- [ ] **Screenshots** - At least 3 screenshots (1290x2796)
- [ ] **App Description** - Use template in submission guide
- [ ] **Privacy Info** - Complete privacy questionnaire

---

## 🔑 Important Info

**Apple Developer Account:**
- Apple ID: d.prasannanivas@gmail.com
- Team ID: QH3NGA2YS4

**Bundle ID:**
- com.roostapp.mortgagebroker

**App Name:**
- Roost Mortgage Broker

**Category:**
- Business

---

## 🚨 One Thing to Update

In `eas.json`, line 25:
```json
"ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
```

Replace with your actual App Store Connect App ID after creating the app (Step 3 above).

---

## 💡 Pro Tips

1. **Use Roost Assets**: The copy-assets.ps1 script copies from RoostDevNative - you can use these and customize later.

2. **TestFlight First**: After building, test with TestFlight before submitting for review.

3. **Screenshots**: Run app in iOS Simulator (iPhone 15 Pro Max), take screenshots with Cmd+S.

4. **Parallel Work**: While build is running (15-20 min), prepare your screenshots and App Store description.

---

## 🆘 Need Help?

| Issue | Solution |
|-------|----------|
| Assets missing | Run `copy-assets.ps1` or see [ASSET_CREATION_GUIDE.md](./ASSET_CREATION_GUIDE.md) |
| Build fails | Check build logs: `eas build:list` |
| Don't have EAS CLI | Install: `npm install -g eas-cli` |
| Need App Store Connect help | See [APP_STORE_SUBMISSION_GUIDE.md](./APP_STORE_SUBMISSION_GUIDE.md) |

---

## ⏱️ Estimated Timeline

- **Setup & Assets:** 30 minutes
- **Build:** 15-20 minutes
- **App Store Connect Setup:** 30 minutes
- **Screenshots & Description:** 30 minutes
- **Apple Review:** 24-48 hours
- **Total:** ~2 days from start to App Store

---

## 🎉 You're Almost There!

Since you've already done this with RoostDevNative, this should be straightforward! The main difference is:
- Different app name: "Roost Mortgage Broker"
- Different bundle ID: com.roostapp.mortgagebroker
- Different focus: Broker-focused features

Everything else is similar to what you did before! 💪

---

**Ready to start? Run the quick start steps above! 🚀**

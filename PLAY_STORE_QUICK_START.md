# 🚀 MBDevNative - Play Store Quick Start

## ✅ What's Already Done

All assets have been copied from RoostDevNative:
- ✅ App icon (1024x1024)
- ✅ Adaptive icon with all resolution variants
- ✅ Play Store icon (512x512)
- ✅ Favicon
- ✅ Android mipmap icons (all densities)
- ✅ App configuration updated in `app.json`
- ✅ EAS configuration ready in `eas.json`

## 📋 Your Next Steps

### Step 1: Build the App for Android

```powershell
cd "d:\Roost Full Stack\MBDevNative"
eas build --platform android --profile production
```

**This will:**
- Use the existing keystore from your Expo account (same as RoostDevNative)
- Build the `.aab` file for Play Store
- Take 10-20 minutes

### Step 2: Create the App in Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Roost Mortgage Broker
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free

### Step 3: Submit to Play Store

Since you already have RoostDevNative on Play Store, you can use the same service account:

```powershell
# Set your service account key (same one you used for RoostDevNative)
$env:GOOGLE_SERVICE_ACCOUNT_KEY="C:\path\to\your-service-account.json"

# Submit
eas submit --platform android --profile production
```

**Or manually upload:**
- Download the `.aab` from EAS
- Upload to Play Console → Create Release

### Step 4: Complete Store Listing

Use this information:

**Short Description:**
```
Connect with clients, manage appointments, and communicate efficiently.
```

**Full Description:**
```
Roost Mortgage Broker - Your Essential Client Management Tool

Streamline your mortgage brokerage business with Roost Mortgage Broker. This powerful app helps you:

✅ Manage Client Requests
- View and respond to client call requests instantly
- Track conversation history
- Never miss an important client inquiry

✅ Schedule Appointments
- Built-in calendar integration
- Schedule calls and meetings with clients
- Automated appointment reminders

✅ Instant Messaging
- Real-time chat with clients
- Share documents and photos securely
- Stay connected on the go

✅ Client Profiles
- Access complete client information
- Track client journey and preferences
- Manage multiple clients efficiently

✅ Professional Features
- Secure authentication with biometric login
- Push notifications for urgent requests
- Professional interface designed for brokers

Perfect for independent mortgage brokers and brokerage teams looking to provide exceptional client service and manage their business efficiently.

Download Roost Mortgage Broker today and transform how you connect with clients!
```

**App Details:**
- Category: **Business**
- Email: d.prasannanivas@gmail.com
- Privacy Policy: https://roostapp.io/privacy
- Website: https://roostapp.io

### Step 5: Upload Screenshots

You'll need to take screenshots from the app:
- **Minimum:** 2 phone screenshots (1080x1920)
- **Recommended:** 4-8 screenshots showing key features

**Feature Graphic** (if you need to create one):
- Size: 1024x500 pixels
- Use Roost branding with Mortgage Broker theme

---

## 🎯 Quick Build Command

```powershell
# One command to build
cd "d:\Roost Full Stack\MBDevNative"; eas build --platform android --profile production
```

---

## 📦 Package Information

- **Package Name:** com.roostapp.mortgagebroker
- **Version:** 1.0.0
- **Version Code:** 1 (auto-increments)
- **Category:** Business
- **Permissions:** Camera, Storage, Contacts

---

## 🔄 For Future Updates

1. Update version in `app.json`:
   ```json
   "version": "1.0.1"
   ```

2. Build:
   ```bash
   eas build --platform android --profile production
   ```

3. Submit:
   ```bash
   eas submit --platform android --profile production
   ```

Version code auto-increments from `eas.json` configuration.

---

## 💡 Tips

- **Use same service account** as RoostDevNative for easier management
- **Content rating** will be similar to RoostDevNative (Business app, no inappropriate content)
- **Data safety** section - declare similar data collection as RoostDevNative
- **Review time** is typically 3-7 days

---

## 📞 Support

For detailed instructions, see: [PLAY_STORE_SUBMISSION_GUIDE.md](PLAY_STORE_SUBMISSION_GUIDE.md)

---

**Ready to build! Run the command above to start. 🚀**

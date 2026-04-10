# 🤖 MBDevNative - Google Play Store Submission Guide

## ✅ Pre-Submission Checklist

### 1. Create Required Assets

You need to create these image assets for Google Play Store:

#### **App Icon** (`assets/icon.png`)
- Size: 1024x1024 pixels
- Format: PNG (no transparency for main icon)
- Should be your Mortgage Broker app logo with Roost branding

#### **Adaptive Icon** (`assets/adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparency
- Safe zone: Keep important content in center 66% (circle crop)
- Background color: #CB003F (defined in app.json)

#### **Feature Graphic** (Required for Play Store)
- Size: 1024x500 pixels
- Format: PNG or JPEG
- No transparency
- Showcases your app visually
- Will be prominently displayed in Play Store

#### **Screenshots** (At least 2 required)
- Phone screenshots: 
  - Minimum dimension: 320px
  - Maximum dimension: 3840px
  - Recommended: 1080x1920 or 1080x2340
- Tablet screenshots (optional but recommended):
  - 7-inch: 1200x1920
  - 10-inch: 1600x2560

#### **Promo Video** (Optional)
- YouTube URL showcasing your app

---

## 🔧 Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

## 🔑 Step 2: Login to Expo

```bash
eas login
```
Use your Expo account credentials.

---

## 🏗️ Step 3: Create Google Play Console Account

1. Go to [Google Play Console](https://play.google.com/console/)
2. Sign in with your Google account
3. **Pay the one-time $25 registration fee** (if first time)
4. Complete account setup:
   - Account type: Organization or Developer
   - Developer name: Your company name
   - Contact details
   - Accept Developer Distribution Agreement

---

## 📱 Step 4: Create App in Play Console

1. Click **"Create app"**
2. Fill in:
   - **App name:** Roost Mortgage Broker
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Check all required declarations
   
3. Click **"Create app"**

---

## 🔐 Step 5: Create Service Account for EAS

To automate submissions, you need a Google Service Account:

### 5.1 Enable Google Play Developer API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Play Android Developer API**:
   - Search for "Google Play Android Developer API"
   - Click "Enable"

### 5.2 Create Service Account

1. In Google Cloud Console, go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in:
   - **Name:** EAS Submit
   - **Description:** Service account for Expo EAS submissions
4. Click **"Create and Continue"**
5. Skip role assignment (click "Continue")
6. Click **"Done"**

### 5.3 Create JSON Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. Click **"Create"**
6. **Save the JSON file securely** (you'll need it later)

### 5.4 Grant Access in Play Console

1. Go back to [Google Play Console](https://play.google.com/console/)
2. Go to **"Users and permissions"** (in left sidebar)
3. Click **"Invite new users"**
4. Enter the service account email (from JSON file, looks like: `eas-submit@your-project.iam.gserviceaccount.com`)
5. Click **"Account permissions"** tab
6. Grant these permissions:
   - **"View app information and download bulk reports"**
   - **"Manage production releases"**
   - **"Manage testing track releases"**
7. Click **"Invite user"**

---

## 🎯 Step 6: Build AAB (Android App Bundle)

Navigate to the MBDevNative folder:
```bash
cd "d:\Roost Full Stack\MBDevNative"
```

Build for Android:
```bash
eas build --platform android --profile production
```

**This will:**
- Create a keystore (or use existing)
- Build an `.aab` file (Android App Bundle)
- Takes 10-20 minutes

**Important:** EAS will ask if you want to generate a new keystore. Choose **YES** for first build and **SAVE THE CREDENTIALS** - you'll need them for updates.

---

## 📤 Step 7: Submit to Play Store

### Option A: Automated Submission (Recommended)

1. Place your service account JSON file in a secure location
2. Set environment variable:

```bash
# Windows PowerShell
$env:GOOGLE_SERVICE_ACCOUNT_KEY="C:\path\to\your-service-account.json"

# Or on Windows CMD
set GOOGLE_SERVICE_ACCOUNT_KEY=C:\path\to\your-service-account.json
```

3. Submit:
```bash
eas submit --platform android --profile production
```

### Option B: Manual Upload

1. Download the `.aab` file from EAS build
2. Go to Play Console → Your App → **"Production"** → **"Create new release"**
3. Upload the `.aab` file
4. Fill in release notes
5. Review and rollout

---

## 📝 Step 8: Complete Store Listing

In Google Play Console, complete these sections:

### 8.1 Store Listing

1. **App name:** Roost Mortgage Broker
2. **Short description** (80 characters max):
   ```
   Connect with clients, manage appointments, and communicate efficiently.
   ```

3. **Full description** (4000 characters max):
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

4. **Upload Assets:**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - At least 2 phone screenshots
   - Optional: Tablet screenshots, promo video

5. **Categorization:**
   - App category: **Business**
   - Tags: mortgage, broker, real estate, client management

6. **Contact details:**
   - Email: Your support email
   - Phone: Optional
   - Website: https://roostapp.io

7. **Privacy policy:**
   - URL: https://roostapp.io/privacy

### 8.2 Content Rating

1. Complete questionnaire:
   - Target audience: Adults (18+)
   - No violent, sexual, or inappropriate content
   - Business/professional app

### 8.3 App Content

1. **Privacy policy:** Add https://roostapp.io/privacy
2. **Data safety:** Declare what data you collect:
   - User account info
   - Messages
   - Photos/files
   - Location (if used)
   - Device ID

3. **Target audience:** Adults

4. **News app:** No

5. **COVID-19 contact tracing:** No

6. **Data deletion:** Provide instructions or automated deletion

### 8.4 Pricing & Distribution

1. **Countries:** Select all countries or specific ones
2. **Free/Paid:** Free
3. **Contains ads:** No (unless you have ads)
4. **In-app purchases:** No (unless you have them)
5. **Content guidelines:** Acknowledge
6. **US export laws:** Acknowledge

---

## 🚀 Step 9: Submit for Review

1. Go to **"Publishing overview"**
2. Complete all required sections (marked with icons)
3. Click **"Send for review"**

**Review process:**
- Usually takes 3-7 days
- You'll receive email updates
- May require changes if policy violations found

---

## 🔄 Step 10: Future Updates

For app updates:

1. Increment version in `app.json`:
   ```json
   "version": "1.0.1",
   "android": {
     "versionCode": 2
   }
   ```

2. Build:
   ```bash
   eas build --platform android --profile production
   ```

3. Submit:
   ```bash
   eas submit --platform android --profile production
   ```

---

## 🆘 Troubleshooting

### Build fails
- Check `eas.json` configuration
- Ensure all dependencies are compatible
- Run `npm install` to update packages

### Submission rejected
- Review Play Store policies
- Check content ratings
- Ensure privacy policy is accessible
- Verify screenshots meet requirements

### Service account not working
- Verify API is enabled in Google Cloud
- Check permissions in Play Console
- Ensure JSON key is valid and path is correct

---

## 📋 Quick Command Reference

```bash
# Login to Expo
eas login

# Build Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view <BUILD_ID>
```

---

## 🎯 Next Steps After Approval

1. **Release the app:** Switch from "Draft" to "Published"
2. **Monitor reviews:** Respond to user feedback
3. **Track metrics:** Use Play Console analytics
4. **Plan updates:** Keep app fresh with new features
5. **Marketing:** Promote your app to mortgage brokers

---

## 📞 Support

- **Expo Documentation:** https://docs.expo.dev/submit/android/
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **EAS Build Issues:** https://docs.expo.dev/build/introduction/

---

**Good luck with your Google Play Store submission! 🚀**

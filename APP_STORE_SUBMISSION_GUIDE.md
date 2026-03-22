# 📱 MBDevNative - App Store Submission Guide

## ✅ Pre-Submission Checklist

### 1. Create Required Assets

You need to create these image assets:

#### **App Icon** (`assets/icon.png`)
- Size: 1024x1024 pixels
- Format: PNG (no transparency)
- Should be your Mortgage Broker app logo with Roost branding

#### **Splash Screen** (`assets/splash.png`)
- Recommended size: 2048x2048 pixels
- Format: PNG
- Background color: #CB003F (Roost red)
- Center your logo/branding

#### **Adaptive Icon** (Android - `assets/adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG
- Safe zone: Keep important content in center 66% of image

#### **Favicon** (`assets/favicon.png`)
- Size: 48x48 pixels
- Format: PNG

**💡 Tip:** You can use the Roost logo and customize it for the Mortgage Broker app variant.

---

## 🔧 Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

## 🔑 Step 2: Login to Expo

```bash
eas login
```
Use your Expo account credentials (same as for RoostDevNative).

---

## 🏗️ Step 3: Create App Store Connect App

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Roost Mortgage Broker
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.roostapp.mortgagebroker
   - **SKU:** mb-dev-native (or any unique identifier)
   - **User Access:** Full Access

4. **Copy the App Store Connect App ID** (10-digit number like 6463172728)

5. Update `eas.json`:
   - Replace `"YOUR_APP_STORE_CONNECT_APP_ID"` with the actual App ID

---

## 🎯 Step 4: Build for Production

Navigate to the MBDevNative folder:
```bash
cd "d:\Roost Full Stack\MBDevNative"
```

Build for iOS:
```bash
eas build --platform ios --profile production
```

**This will:**
- Upload your code to Expo servers
- Build an `.ipa` file (iOS app)
- Store it in the cloud
- Takes 10-20 minutes

---

## 📤 Step 5: Submit to App Store

After build completes successfully:

```bash
eas submit --platform ios --profile production
```

**This will:**
- Download the `.ipa` file
- Upload it to App Store Connect
- Make it available for TestFlight and App Store review

---

## 📝 Step 6: Fill Out App Store Information

Go to [App Store Connect](https://appstoreconnect.apple.com/) and complete:

### **App Information**
- **Name:** Roost Mortgage Broker
- **Subtitle:** Connect with Your Clients Seamlessly
- **Privacy Policy URL:** https://roostapp.io/privacy
- **Category:** Primary: Business, Secondary: Productivity
- **Content Rights:** Yes (if you own all content)

### **Pricing and Availability**
- **Price:** Free
- **Availability:** All countries or select specific ones

### **App Privacy**
Fill out the privacy questionnaire based on what data your app collects:
- Contact Info (if collecting)
- User Content (messages, documents)
- Usage Data
- Etc.

### **Version Information**

#### 1. **Screenshots** (Required for at least 6.5" iPhone)
You need at least 3 screenshots:
- Size: 1290 x 2796 pixels (iPhone 15 Pro Max)
- Take screenshots of key features:
  - Call requests screen
  - Messages/chat screen
  - Profile/settings screen

#### 2. **Promotional Text** (Optional, max 170 characters)
```
Stay connected with your clients! Manage call requests, schedule appointments, and communicate efficiently with Roost Mortgage Broker.
```

#### 3. **Description** (Required, max 4000 characters)
```
Roost Mortgage Broker is the essential companion app for mortgage brokers working with the Roost platform. Streamline your client communications and never miss an important call request.

KEY FEATURES:

📞 CALL REQUEST MANAGEMENT
• View all client call requests in one place
• See priority requests at a glance with visual indicators
• One-tap calling to connect with clients instantly
• Filter requests by time period (Today, Week, Month, All)

💬 INSTANT MESSAGING
• Communicate directly with clients through secure messaging
• Get notified of new messages in real-time
• See unread message counts at a glance
• Filter between unread and all conversations

⏰ SMART REMINDERS
• Set custom reminders for follow-up calls
• Never miss an important client interaction
• Manage your schedule efficiently

👤 PROFESSIONAL PROFILE
• View your broker information
• Manage your account settings
• Quick and secure logout

🔒 SECURE & RELIABLE
• Your credentials are stored securely
• Privacy-focused design
• Encrypted communications

💼 BUILT FOR BROKERS
Designed specifically for mortgage brokers who are part of the Roost network. This app helps you provide exceptional service to your clients by ensuring you're always available and responsive.

Note: This app requires a Roost Mortgage Broker account to use. Contact your Roost administrator for access.
```

#### 4. **Keywords** (max 100 characters, comma-separated)
```
mortgage,broker,realtor,client,communication,appointment,scheduling,business,call,chat
```

#### 5. **Support URL**
```
https://roostapp.io/support
```

#### 6. **Marketing URL** (Optional)
```
https://roostapp.io
```

#### 7. **Copyright**
```
2026 Roost App Inc.
```

### **Build Information**
- Select the build that was uploaded via `eas submit`
- **Export Compliance:** Select "No" (since ITSAppUsesNonExemptEncryption is false)

---

## 🧪 Step 7: TestFlight Testing (Optional but Recommended)

Before submitting for review:
1. In App Store Connect, go to **TestFlight** tab
2. Add internal testers (you and your team)
3. Test the app thoroughly on real devices
4. Fix any bugs, then rebuild and resubmit if needed

---

## 🚀 Step 8: Submit for Review

1. In App Store Connect, go to **App Store** tab
2. Click **"+ Version"** or **"Prepare for Submission"**
3. Fill in all required information (above)
4. **Add screenshots** (at least 3)
5. Click **"Submit for Review"**

**Review Questionnaire:**
- **Advertising Identifier:** No (unless you use ads)
- **Content Rights:** Yes
- **Government Endorsement:** No
- **Demo Account:** Provide test credentials if app requires login

---

## ⏱️ Timeline

- **Build Time:** 10-20 minutes
- **TestFlight Processing:** 5-10 minutes
- **App Review:** 24-48 hours (typically)

---

## 🔄 Future Updates

When you need to release an update:

1. **Update version in app.json:**
   ```json
   "version": "1.0.1"
   ```

2. **Build:**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit:**
   ```bash
   eas submit --platform ios --profile production
   ```

4. **Update App Store listing** with "What's New" information

---

## 📞 Support

If you encounter issues:
- Check [Expo EAS Documentation](https://docs.expo.dev/eas/)
- Check [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- Review Apple's [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## 🎉 Success!

Once approved, your Roost Mortgage Broker app will be live on the App Store! 🎊

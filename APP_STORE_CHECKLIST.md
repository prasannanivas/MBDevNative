# 📋 App Store Submission Checklist - MBDevNative

Use this checklist to track your progress toward App Store submission.

---

## ✅ Phase 1: Assets & Configuration

- [x] Create `icon.png` (1024x1024) ✅ (DONE - Copied from RoostDevNative)
- [x] Create `splash.png` (2048x2048) ✅ (DONE - Copied from RoostDevNative)
- [x] Create `adaptive-icon.png` (1024x1024) ✅ (DONE - Copied from RoostDevNative)
- [x] Create `favicon.png` (48x48) ✅ (DONE - Copied from RoostDevNative)
- [ ] Verify all assets load correctly with `npm start`
- [x] `eas.json` file created ✅ (DONE)
- [x] `app.json` updated with iOS config ✅ (DONE)

---

## ✅ Phase 2: App Store Connect Setup

- [x] Login to [App Store Connect](https://appstoreconnect.apple.com/) ✅ (DONE)
- [x] Create new app: "Roost Mortgage Broker" ✅ (DONE)
- [x] Bundle ID: `com.roostapp.mortgagebroker` ✅ (DONE)
- [x] Copy App Store Connect App ID (10-digit number) ✅ (DONE - 6760616311)
- [x] Update `eas.json` with the App ID ✅ (DONE)
- [ ] Set app category to "Business"
- [ ] Add privacy policy URL: https://roostapp.io/privacy

---

## ✅ Phase 3: Build & Upload

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Run build: `eas build --platform ios --profile production`
- [ ] Wait 10-20 minutes for build to complete
- [ ] Build succeeds with no errors
- [ ] Run submit: `eas submit --platform ios --profile production`
- [ ] Upload completes successfully

---

## ✅ Phase 4: App Store Listing

### Required Information
- [ ] App Name: "Roost Mortgage Broker"
- [ ] Subtitle: "Connect with Your Clients"
- [ ] Privacy Policy URL: https://roostapp.io/privacy
- [ ] Support URL: https://roostapp.io/support
- [ ] Marketing URL: https://roostapp.io
- [ ] Category: Business (Primary), Productivity (Secondary)
- [ ] Copyright: "2026 Roost App Inc."

### Content
- [ ] Description written (see guide for template)
- [ ] Keywords added (max 100 chars)
- [ ] Promotional text written (optional)

### Screenshots (Required - at least 3)
- [ ] Screenshot 1: Call Requests screen (1290x2796)
- [ ] Screenshot 2: Messages/Chat screen (1290x2796)
- [ ] Screenshot 3: Profile screen (1290x2796)
- [ ] Optional: Screenshot 4: Additional feature
- [ ] Optional: Screenshot 5: Additional feature

**How to take screenshots:**
1. Run app in simulator: iPhone 15 Pro Max
2. Navigate to each screen
3. Cmd+S to save screenshot
4. Screenshots auto-saved to Desktop

---

## ✅ Phase 5: Privacy & Compliance

- [ ] Complete App Privacy questionnaire
  - [ ] Data types collected (contact info, messages, etc.)
  - [ ] How data is used
  - [ ] Whether data is linked to user identity
- [ ] Export Compliance: "No" (using standard encryption only)
- [ ] Content Rights: Confirm you own all content
- [ ] Age Rating: Complete questionnaire

---

## ✅ Phase 6: TestFlight (Optional but Recommended)

- [ ] Add internal testers in TestFlight
- [ ] Install via TestFlight on test device
- [ ] Test login functionality
- [ ] Test call request features
- [ ] Test messaging features
- [ ] Test profile/logout
- [ ] Verify notifications work
- [ ] Check for crashes or bugs

---

## ✅ Phase 7: Submit for Review

- [ ] All previous items completed
- [ ] Select the uploaded build
- [ ] Review all information one more time
- [ ] Provide demo account credentials (if required)
- [ ] Click "Submit for Review"
- [ ] Wait for Apple review (24-48 hours typically)

---

## ✅ Phase 8: Post-Submission

- [ ] Monitor App Store Connect for status updates
- [ ] Check email for Apple communications
- [ ] Respond to any review questions within 24 hours
- [ ] If rejected: Read rejection reason, fix issues, resubmit

---

## 🎯 Quick Reference Commands

```bash
# Navigate to project
cd "d:\Roost Full Stack\MBDevNative"

# Install dependencies (if needed)
npm install

# Test locally
npm start

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

## 📞 Important Info

**Apple Developer Account:**
- Apple ID: d.prasannanivas@gmail.com
- Team ID: QH3NGA2YS4

**Bundle Identifier:**
- com.roostapp.mortgagebroker

**EAS Project ID:**
- 35c5cae2-b562-47bf-b26f-18fdf8efedf8

---

## 🚨 Troubleshooting

### Build Fails
- [ ] Check eas build logs for specific error
- [ ] Verify all assets exist
- [ ] Ensure package.json dependencies are correct
- [ ] Try running `npm install` again

### Assets Not Found
- [ ] Verify file names match exactly (case-sensitive)
- [ ] Check files are in `assets/` folder
- [ ] Ensure app.json paths are correct

### Submission Fails
- [ ] Verify App Store Connect App ID is correct
- [ ] Check Apple ID and Team ID are correct
- [ ] Ensure you have admin access in App Store Connect
- [ ] Try submitting manually via Transporter app

---

## ✨ Success Indicators

✅ **Build Success:** You receive a link to download .ipa file  
✅ **Upload Success:** Build appears in App Store Connect  
✅ **Submission Success:** Status changes to "Waiting for Review"  
✅ **Approval:** Status changes to "Ready for Sale"  

---

## 📱 Expected Timeline

- **Asset Creation:** 1-2 hours
- **Build Time:** 15-20 minutes
- **App Store Setup:** 30-60 minutes
- **Screenshots:** 30 minutes
- **TestFlight Testing:** 1-2 hours
- **Apple Review:** 24-48 hours
- **Total:** 2-3 days from start to approval

---

## 🎉 When You're Done

Once approved:
- [ ] Download app from App Store on your device
- [ ] Share App Store link with team
- [ ] Update marketing materials
- [ ] Celebrate! 🎊

**App Store Link Format:**
```
https://apps.apple.com/app/id[APP_ID]
```

---

**Last Updated:** March 15, 2026  
**Version:** 1.0.0  
**Status:** Ready for Submission

# MBDevNative - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd "d:\Roost Full Stack\MBDevNative"
npm install
```

### Step 2: Add Required Assets (Optional for now)
The app will run without these, but you should add them eventually:
- `assets/icon.png` - App icon (1024x1024px)
- `assets/splash.png` - Splash screen
- `assets/adaptive-icon.png` - Android adaptive icon
- `assets/favicon.png` - Web favicon

### Step 3: Start the App
```bash
npm start
```

### Step 4: Test on Your Device
1. Install "Expo Go" app on your phone
2. Scan the QR code shown in terminal
3. App will load on your device

## 📱 Test Login
Use these test credentials (to be provided by backend team):
- Email: [test.broker@roostapp.io]
- Password: [password]

## 🎨 App Features Overview

### Home Tab
- Shows all call requests from clients
- Orange border = Priority request
- Yellow button = Call client
- Green button = Set reminder
- Blue pill button = Filter by time

### Messages Tab
- Shows all message threads
- Red badge = Unread messages
- Tap to open chat
- Purple filter button = Filter Unread/All

### Profile Tab (Realtor Info)
- Shows your broker info
- Logout button (red)

## 🔧 Backend API Endpoints Needed

Make sure these endpoints are implemented on the backend:

### Authentication
- POST `/mortgage-broker/login`
  - Body: `{ email, password }`
  - Returns: `{ broker, token }`

### Call Requests
- GET `/mortgage-broker/:brokerId/call-requests?filter=Today`
  - Filters: Today, This week, Last week, All clients
  - Returns: `{ callRequests: [] }`
  
- POST `/mortgage-broker/:brokerId/call-request/:clientId/called`
  - Marks call request as handled

### Messages
- GET `/mortgage-broker/:brokerId/conversations?filter=All`
  - Filters: Unread, All
  - Returns: `{ conversations: [] }`
  
- GET `/mortgage-broker/:brokerId/conversation/:conversationId/messages`
  - Returns: `{ messages: [] }`
  
- POST `/mortgage-broker/:brokerId/conversation/:conversationId/message`
  - Body: `{ text }`
  - Returns: `{ message }`
  
- POST `/mortgage-broker/:brokerId/conversation/:conversationId/read`
  - Marks conversation as read

- GET `/mortgage-broker/:brokerId/unread-count`
  - Returns: `{ unreadCount }`

### Client Details
- GET `/mortgage-broker/client/:clientId`
  - Returns: `{ client: {} }`

### Reminders
- POST `/mortgage-broker/:brokerId/reminder`
  - Body: `{ clientId, reminderTime, clientName }`
  - Returns: `{ reminder }`

## 📋 Expected Data Structures

### Broker Object
```json
{
  "_id": "broker123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "company": "ABC Realty"
}
```

### Call Request Object
```json
{
  "_id": "request123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "9876543210",
  "email": "jane@example.com",
  "priority": "high",
  "status": "Invited",
  "requestedAt": "2026-02-25T10:30:00Z"
}
```

### Conversation Object
```json
{
  "_id": "conv123",
  "participant": {
    "firstName": "Jane",
    "lastName": "Smith",
    "type": "client"
  },
  "lastMessage": "Looking forward to hearing from you",
  "lastMessageAt": "2026-02-25T10:30:00Z",
  "unreadCount": 2
}
```

### Message Object
```json
{
  "_id": "msg123",
  "text": "Hello, when can we schedule a call?",
  "senderId": "user123",
  "senderType": "client",
  "createdAt": "2026-02-25T10:30:00Z"
}
```

### Client Object
```json
{
  "_id": "client123",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "address": "123 Main St, City, State 12345",
  "status": "Pre-approved",
  "purchaseDetails": {
    "budget": 500000,
    "location": "Downtown",
    "timeline": "3-6 months"
  },
  "notes": "First-time buyer, very motivated"
}
```

## 🐛 Troubleshooting

### "Unable to resolve module..."
```bash
npm install
expo start -c
```

### "Network request failed"
- Check if backend server is running
- Verify `.env` file has correct `BACKEND_URL`

### App crashes on launch
- Check if all required dependencies are installed
- Try: `rm -rf node_modules && npm install`

## 📞 Need Help?

Contact the development team or check the full README.md for more details.

## ✅ Checklist Before Production

- [ ] Add all required assets (icons, splash screen)
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test call requests with filters
- [ ] Test messaging functionality
- [ ] Test reminders
- [ ] Test on both iOS and Android
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test offline behavior
- [ ] Set up push notifications
- [ ] Configure production backend URL
- [ ] Test with real user accounts

# MBDevNative - Mortgage Broker Mobile App

A React Native mobile application for Mortgage Brokers (Sub Admins) to communicate with Realtors and Clients.

## Overview

This is a dedicated mobile app for Mortgage Brokers that provides:
- **Call Management**: View and manage priority call requests from clients
- **Messaging**: Communicate with Realtors and Clients through an integrated chat system
- **Client Details**: Access comprehensive client information and purchase details
- **Reminders**: Set reminders for follow-ups with clients

## Features

### 1. Home Screen (Call Requests)
- View all call requests from clients
- Priority indicators for urgent requests (orange highlight)
- Quick call button - turns blue after calling
- Reminder button for setting follow-up reminders
- Filter options: Today / This week / Last week / All clients
- Tap on any card to view full client details

### 2. Messages Screen
- View all message threads with Realtors and Clients
- Unread message indicators
- Filter options: Unread / All
- Real-time chat functionality
- Quick actions: Chat and Notification buttons

### 3. Profile Screen (Realtor Info)
- View broker profile information
- Logout functionality
- (More features coming soon)

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: Context API
- **UI Components**: Custom components with React Native
- **Icons**: @expo/vector-icons (Ionicons)
- **HTTP Requests**: Fetch API
- **Storage**: AsyncStorage for local data persistence

## Project Structure

```
MBDevNative/
├── App.js                      # Main app entry point
├── index.js                    # Expo entry point
├── package.json                # Dependencies
├── app.json                    # Expo configuration
├── metro.config.js             # Metro bundler config
├── .env                        # Environment variables
│
├── assets/                     # Images, fonts, etc.
│
├── components/                 # Reusable components
│   ├── ChatModal.js           # Chat interface modal
│   ├── FilterModal.js         # Call requests filter
│   ├── MessageFilterModal.js  # Messages filter
│   └── ReminderModal.js       # Set reminder modal
│
├── context/                    # Context providers
│   ├── AuthContext.js         # Authentication state
│   ├── ChatContext.js         # Chat/messaging state
│   └── NetworkContext.js      # Network connectivity
│
├── navigation/                 # Navigation setup
│   └── MainTabs.js            # Bottom tab navigation
│
├── screens/                    # Screen components
│   ├── LoginScreen.js         # Authentication
│   ├── MBHomeScreen.js        # Call requests (Home)
│   ├── MessagesScreen.js      # Message threads
│   ├── ProfileScreen.js       # Broker profile
│   └── ClientDetailsScreen.js # Client information
│
├── styles/                     # Global styles
│
└── utils/                      # Utility functions
    ├── colors.js              # Color palette
    ├── dateUtils.js           # Date formatting
    └── phoneFormatUtils.js    # Phone number formatting
```

## API Endpoints

The app connects to the backend at: `https://signup.roostapp.io`

### Authentication
- `POST /mortgage-broker/login` - Broker login

### Call Requests
- `GET /mortgage-broker/:brokerId/call-requests?filter=:filter` - Fetch call requests
- `POST /mortgage-broker/:brokerId/call-request/:clientId/called` - Mark as called

### Messaging
- `GET /mortgage-broker/:brokerId/conversations?filter=:filter` - Fetch conversations
- `GET /mortgage-broker/:brokerId/conversation/:conversationId/messages` - Fetch messages
- `POST /mortgage-broker/:brokerId/conversation/:conversationId/message` - Send message
- `POST /mortgage-broker/:brokerId/conversation/:conversationId/read` - Mark as read
- `GET /mortgage-broker/:brokerId/unread-count` - Get unread count

### Client Details
- `GET /mortgage-broker/client/:clientId` - Fetch client details

### Reminders
- `POST /mortgage-broker/:brokerId/reminder` - Set reminder

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "d:\Roost Full Stack\MBDevNative"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Check `.env` file for backend URL
   - Default: `BACKEND_URL=https://signup.roostapp.io`

4. **Start the development server**
   ```bash
   npm start
   ```
   or
   ```bash
   expo start
   ```

5. **Run on device/simulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Color Palette

The app uses the Roost brand colors:

- **Primary**: `#CB003F` (Roost Red/Maroon)
- **Green**: `#377473` (Action buttons, indicators)
- **Blue**: `#2271B1` (Call button after pressed)
- **Orange**: `#F0913A` (Priority indicators)
- **Background**: `#F6F6F6` (Light gray)
- **Text**: `#0E1D1D` (Dark gray/black)

## User Flow

### First Time Login
1. User opens app
2. Presented with login screen
3. Enter email and password
4. Successfully authenticated → Navigate to Home screen

### Home Screen Flow
1. View call requests
2. Filter by time period (Today/This week/etc.)
3. Tap call button to dial client
4. Tap reminder button to set follow-up
5. Tap card to view full client details

### Messages Flow
1. View all conversations
2. Filter by Unread/All
3. Tap conversation to open chat
4. Send/receive messages in real-time
5. Messages marked as read automatically

## Future Enhancements

- Push notifications for new messages and reminders
- Voice/video call integration
- Document sharing
- Calendar integration
- Analytics dashboard
- Profile editing
- Dark mode support

## Development Notes

### Key Features Implemented

✅ Authentication with AsyncStorage persistence
✅ Bottom tab navigation (Home, Messages, Profile)
✅ Call request management with filters
✅ Priority indicators for urgent requests
✅ Call button with visual feedback
✅ Reminder system with multiple options
✅ Message threads with unread indicators
✅ Real-time chat functionality
✅ Client details view
✅ Logout functionality

### Component Highlights

- **AuthContext**: Manages authentication state and persistence
- **ChatContext**: Handles unread message counts and conversation state
- **FilterModal/MessageFilterModal**: Reusable filter modals
- **ReminderModal**: Flexible reminder scheduling
- **ChatModal**: Full-featured chat interface

## Testing

### Test Accounts
(To be provided by backend team)

### Test Scenarios
1. Login with valid credentials
2. View call requests with different filters
3. Make a call and verify button state changes
4. Set reminders with different time options
5. Send and receive messages
6. View client details
7. Logout and verify data cleared

## Troubleshooting

### Common Issues

**App won't start:**
- Delete `node_modules` and run `npm install` again
- Clear Expo cache: `expo start -c`

**API connection issues:**
- Check `.env` file for correct backend URL
- Verify network connectivity
- Check backend server status

**Authentication issues:**
- Clear AsyncStorage: Use React Native Debugger or manually clear app data
- Verify login endpoint is working

## Support

For questions or issues, contact the development team.

## License

Proprietary - Roost App © 2026

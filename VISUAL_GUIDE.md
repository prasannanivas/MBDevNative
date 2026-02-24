# MBDevNative - App Structure Visual Guide

## 📱 Screen Flow Diagram

```
┌─────────────────────────────────────────────┐
│           App Launch                        │
│                                             │
│  Check Authentication (AsyncStorage)       │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   Not Logged In    Logged In
       │                │
       │                │
┌──────▼──────┐  ┌──────▼──────────────────────┐
│             │  │                              │
│  Login      │  │  Main Bottom Tabs            │
│  Screen     │  │                              │
│             │  │  ┌────────────────────────┐  │
│  [Email]    │  │  │  1. Home Tab           │  │
│  [Password] │  │  │    (Call Requests)     │  │
│  [Sign In]  │  │  │                        │  │
│             │  │  │  - Filter: Today ▼     │  │
└─────────────┘  │  │  - Priority Cards      │  │
                 │  │  - Call Button 📞      │  │
                 │  │  - Reminder Button 🔔  │  │
                 │  │                        │  │
                 │  │  Tap Card ──────┐      │  │
                 │  │                 │      │  │
                 │  └─────────────────┼──────┘  │
                 │                    │         │
                 │  ┌─────────────────▼──────┐  │
                 │  │  2. Messages Tab       │  │
                 │  │                        │  │
                 │  │  - Filter: Unread ▼    │  │
                 │  │  - Conversation List   │  │
                 │  │  - Unread Badge        │  │
                 │  │  - Chat/Bell Icons     │  │
                 │  │                        │  │
                 │  │  Tap Convo ──────┐     │  │
                 │  │                  │     │  │
                 │  └──────────────────┼─────┘  │
                 │                     │        │
                 │  ┌──────────────────▼─────┐  │
                 │  │  3. Profile Tab        │  │
                 │  │    (Realtor Info)      │  │
                 │  │                        │  │
                 │  │  - Broker Info         │  │
                 │  │  - Email & Phone       │  │
                 │  │  - [Logout Button]     │  │
                 │  │                        │  │
                 │  └────────────────────────┘  │
                 │                              │
                 └──────────────────────────────┘
                        │          │
                   ┌────┘          └────┐
                   │                    │
         ┌─────────▼──────────┐  ┌──────▼────────┐
         │  Client Details    │  │  Chat Modal   │
         │  Screen            │  │               │
         │                    │  │  - Messages   │
         │  - Contact Info    │  │  - Send Text  │
         │  - Purchase Info   │  │  - Real-time  │
         │  - Call/Email      │  │               │
         │  - Notes           │  │               │
         └────────────────────┘  └───────────────┘
```

---

## 🗂️ File Organization Map

```
MBDevNative/
│
├── 📱 Entry Points
│   ├── index.js ─────────────► Expo entry point
│   └── App.js ───────────────► Main app component
│
├── 🎨 Screens
│   ├── LoginScreen.js ───────► Authentication
│   ├── MBHomeScreen.js ──────► Call requests (main)
│   ├── MessagesScreen.js ────► Message threads
│   ├── ProfileScreen.js ─────► Realtor info
│   └── ClientDetailsScreen.js ► Client information
│
├── 🧩 Components
│   ├── ChatModal.js ─────────► Full chat interface
│   ├── FilterModal.js ───────► Call filter modal
│   ├── MessageFilterModal.js ► Message filter modal
│   └── ReminderModal.js ─────► Set reminder modal
│
├── 🔄 Context (State Management)
│   ├── AuthContext.js ───────► Authentication state
│   ├── ChatContext.js ───────► Messaging state
│   └── NetworkContext.js ────► Network connectivity
│
├── 🧭 Navigation
│   └── MainTabs.js ──────────► Bottom tab navigation
│
├── 🛠️ Utils
│   ├── colors.js ────────────► Color palette
│   ├── dateUtils.js ─────────► Date/time formatting
│   └── phoneFormatUtils.js ──► Phone formatting
│
├── 🎨 Assets
│   └── (icons, splash, etc.)
│
└── 📝 Config
    ├── package.json ─────────► Dependencies
    ├── app.json ─────────────► Expo config
    ├── .env ─────────────────► Environment vars
    └── metro.config.js ──────► Bundler config
```

---

## 🔐 Authentication Flow

```
User Opens App
      │
      │ Check AsyncStorage
      │
      ├──► Token Found?
      │         │
      │    ┌────┴────┐
      │    │         │
      │   Yes       No
      │    │         │
      │    │    ┌────▼────┐
      │    │    │ Login   │
      │    │    │ Screen  │
      │    │    └────┬────┘
      │    │         │
      │    │    POST /login
      │    │         │
      │    │    ┌────▼────┐
      │    │    │ Success?│
      │    │    └────┬────┘
      │    │         │
      │    │    Save to AsyncStorage
      │    │         │
      └────┴─────────┴────► Main App
```

---

## 🏠 Home Screen Component Breakdown

```
┌───────────────────────────────────────┐
│ ┌───────────────────────────────────┐ │
│ │        Header (Red Section)       │ │  ← Primary color background
│ │                                   │ │
│ │  [Avatar] DAVID SMITH             │ │  ← Broker info
│ │           ABC Realty              │ │
│ │                                   │ │
│ │  CALL REQUESTED    [Today ▼]     │ │  ← Section title + Filter
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ ┌──┬──────────────────┬──┬──┐    │ │  ← Priority card
│ │ │OR│ Abby Smith       │📞│🔔│    │ │    (orange border)
│ │ │AN│ 35 mins ago      │  │  │    │ │
│ │ │GE└──────────────────┴──┴──┘    │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ [AS] Abby Smith        [📞][🔔]  │ │  ← Regular card
│ │      Invited                      │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ [AS] Abby Smith        [📞][🔔]  │ │
│ │      Invited                      │ │
│ └───────────────────────────────────┘ │
│                                       │
│              (More cards...)          │
│                                       │
└───────────────────────────────────────┘
│
Bottom Tab Bar: [📞 Home] [💬 Messages] [👤 Profile]
```

---

## 💬 Messages Screen Component Breakdown

```
┌───────────────────────────────────────┐
│ ┌───────────────────────────────────┐ │
│ │        Header (Red Section)       │ │  ← Primary color background
│ │                                   │ │
│ │  [Avatar] DAVID SMITH             │ │  ← Broker info
│ │           ABC Realty              │ │
│ │                                   │ │
│ │  MESSAGES          [Unread ▼]    │ │  ← Section title + Filter
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ ┌──┬──────────────────┬──┐       │ │  ← Unread message
│ │ │AS│ Abby Smith       │🔴│  [💬] │ │    (red indicator)
│ │ │  │ Just wanted to...│  │  [🔔] │ │
│ │ └──┴──────────────────┴──┘       │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ [BL] Brian Lee            [💬][🔔]│ │  ← Read message
│ │      I have completed...          │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ [CJ] Cynthia Johnson      [💬][🔔]│ │
│ │      Could you please...          │ │
│ └───────────────────────────────────┘ │
│                                       │
└───────────────────────────────────────┘
│
Bottom Tab Bar: [📞 Home] [💬 Messages(2)] [👤 Profile]
                                    ↑
                            Unread badge
```

---

## 🎯 Modal Components

### Filter Modal
```
┌─────────────────────┐
│ Filter Call Requests│ [X]
├─────────────────────┤
│ ✓ Today             │ ← Blue background
│   This week         │
│   Last week         │
│   All clients       │
└─────────────────────┘
```

### Reminder Modal
```
┌─────────────────────┐
│ Set Reminder        │ [X]
├─────────────────────┤
│   Abby Smith        │
├─────────────────────┤
│   30 minutes        │
│   1 hour            │
│   2 hours           │
│   4 hours           │
│   Tomorrow 9 AM     │
│   Custom            │
├─────────────────────┤
│ ⏰ Feb 25, 11:30 AM │
├─────────────────────┤
│  [Set Reminder]     │ ← Green button
└─────────────────────┘
```

### Chat Modal
```
┌─────────────────────┐
│ [←] Jane Smith      │ ← Primary header
│     Client          │
├─────────────────────┤
│                     │
│  ┌──────────────┐   │
│  │ Hello! How...│   │ ← Client message
│  └──────────────┘   │   (white bubble)
│                     │
│    ┌─────────────┐  │
│    │ Hi Jane...  │  │ ← Broker message
│    └─────────────┘  │   (green bubble)
│                     │
├─────────────────────┤
│ [Type message...][▶]│ ← Input area
└─────────────────────┘
```

---

## 🎨 Color Palette Usage

```
Screen Element              Color Used
═══════════════════════════════════════
Header Background          #CB003F (Primary Red)
Action Buttons            #377473 (Green)
Pressed Call Button       #2271B1 (Blue)
Priority Indicator        #F0913A (Orange)
Background                #F6F6F6 (Light Gray)
Text                      #0E1D1D (Dark Gray)
Filter Buttons            #2271B1 (Blue)
Cards                     #FFFFFF (White)
```

---

## 📊 State Management Flow

```
┌──────────────────────────────────────────┐
│            Context Providers             │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         AuthContext               │  │
│  │  - broker: Object                 │  │
│  │  - authToken: String              │  │
│  │  - login()                        │  │
│  │  - logout()                       │  │
│  │  - updateBroker()                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         ChatContext               │  │
│  │  - unreadCount: Number            │  │
│  │  - conversations: Array           │  │
│  │  - fetchUnreadCount()             │  │
│  │  - markAsRead()                   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │       NetworkContext              │  │
│  │  - isConnected: Boolean           │  │
│  │  - showOfflineGame: Boolean       │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    [Screens]           [Components]
```

---

## 🔌 API Endpoints Map

```
Feature              HTTP Method    Endpoint
═══════════════════════════════════════════════════════
Login                POST          /mortgage-broker/login
Call Requests        GET           /mortgage-broker/:id/call-requests
Mark Called          POST          /mortgage-broker/:id/call-request/:cid/called
Conversations        GET           /mortgage-broker/:id/conversations
Messages             GET           /mortgage-broker/:id/conversation/:cid/messages
Send Message         POST          /mortgage-broker/:id/conversation/:cid/message
Mark Read            POST          /mortgage-broker/:id/conversation/:cid/read
Unread Count         GET           /mortgage-broker/:id/unread-count
Client Details       GET           /mortgage-broker/client/:clientId
Set Reminder         POST          /mortgage-broker/:id/reminder
```

---

## 🚀 Data Flow Example: Sending a Message

```
User Types Message
     │
     ▼
  [Send Button Pressed]
     │
     ├─► Add temp message to local state
     │   (Shows immediately in UI)
     │
     ├─► POST to API
     │   /mortgage-broker/:id/conversation/:cid/message
     │
     ├─► Success?
     │      │
     │   ┌──┴──┐
     │   Yes  No
     │    │    │
     │    │    └─► Remove temp message
     │    │        Show error
     │    │
     │    └──► Replace temp with real message
     │         (has proper ID, timestamp)
     │
     └─► Update conversation's lastMessage
         Update lastMessageAt
```

---

## ✅ Implementation Checklist

**Core Functionality**
- ✅ Authentication system
- ✅ Call requests list
- ✅ Priority indicators
- ✅ Call button with state change
- ✅ Reminder system
- ✅ Message threads
- ✅ Real-time chat
- ✅ Client details
- ✅ Profile/logout

**UI/UX**
- ✅ Bottom tab navigation
- ✅ Pull to refresh
- ✅ Loading states
- ✅ Empty states
- ✅ Modal dialogs
- ✅ Filter options
- ✅ Unread badges

**Code Quality**
- ✅ Context API for state
- ✅ Reusable components
- ✅ Utility functions
- ✅ Error handling
- ✅ Responsive design
- ✅ Clean code structure

---

This visual guide provides a complete overview of the MBDevNative app structure, screen flows, and implementation details.

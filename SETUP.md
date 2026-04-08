# Dr. Sage — Setup & Installation Guide

## Overview
Dr. Sage is a virtual counselor app for iOS and Android, built with React Native (Expo). It uses Claude AI as its intelligence layer, with a comprehensive psychological knowledge base, mood tracking, session history, and psychology reference library.

---

## Prerequisites

### 1. Install Node.js
Open Terminal and run:
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (follow the instructions printed after install, or run:)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install Node.js
brew install node

# Verify
node --version   # should show v18+ or v20+
npm --version
```

### 2. Install Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### 3. Install Xcode (for iOS)
- Download from the Mac App Store
- Open Xcode → Preferences → Locations → set Command Line Tools
- Install iOS Simulator: Xcode → Preferences → Components

### 4. Install Android Studio (for Android)
- Download from https://developer.android.com/studio
- Install Android SDK (API 33+) and an emulator

---

## Project Setup

### 1. Install Dependencies
```bash
cd /Users/kushalrajroy/Documents/virtual_councellor
npm install
```

### 2. Configure Your Anthropic API Key
Get your API key from https://console.anthropic.com

**Option A — Environment file (quickest for development):**
```bash
cp .env.example .env
# Then edit .env and add your key:
# EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxxx
```

**Option B — Secure Storage (recommended for production):**
You can set the key in-app via the Profile screen → About → Enter API Key.
The key will be stored securely using expo-secure-store.

### 3. Add App Icon and Splash Screen
Place these files in `assets/images/`:
- `icon.png` — 1024×1024px, no transparency
- `adaptive-icon.png` — 1024×1024px (Android)
- `splash.png` — 1284×2778px (or any aspect ratio)
- `favicon.png` — 32×32px (web)

Temporary placeholder: The app will run without these files in development mode.

---

## Running the App

### Start development server
```bash
npm start
```
This opens Expo DevTools in your browser.

### Run on iOS Simulator
```bash
npm run ios
# or press 'i' in the Expo DevTools terminal
```

### Run on Android Emulator
```bash
npm run android
# or press 'a' in the Expo DevTools terminal
```

### Run on Physical Device
1. Install **Expo Go** from the App Store or Google Play
2. Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android)

---

## Building for App Stores

### Configure EAS Build
```bash
eas login
eas build:configure
```

### Build for iOS (TestFlight / App Store)
```bash
eas build --platform ios --profile production
```

### Build for Android (Google Play)
```bash
eas build --platform android --profile production
```

### Submit to App Stores
```bash
eas submit --platform ios
eas submit --platform android
```

---

## Project Structure

```
dr-sage/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Entry redirect
│   ├── onboarding/         # 3-screen onboarding flow
│   ├── (tabs)/             # Main tab navigation
│   │   ├── index.tsx       # Home dashboard
│   │   ├── chat.tsx        # AI chat with Dr. Sage
│   │   ├── mood.tsx        # Mood tracker
│   │   ├── library.tsx     # Psychology reference library
│   │   └── profile.tsx     # Settings & profile
│   ├── library/[termId].tsx # Term detail
│   └── history/            # Session history
│
├── src/
│   ├── services/
│   │   ├── anthropic.ts    # Claude API client (streaming)
│   │   ├── systemPrompt.ts # Dr. Sage AI persona & safety
│   │   ├── storage.ts      # SQLite database layer
│   │   └── notifications.ts # Local push notifications
│   ├── stores/             # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript interfaces
│   ├── theme/              # Colors, typography, spacing
│   └── utils/              # Date helpers, haptics
│
└── data/knowledge-base/    # Psychology reference library
    ├── therapeutic-approaches.json   # CBT, DBT, ACT, etc.
    ├── disorders.json                # Common conditions
    ├── techniques.json               # Therapeutic techniques
    ├── coping-strategies.json        # Coping skill guides
    ├── glossary.json                 # 100+ psychology terms
    └── crisis-resources.json         # Crisis hotlines
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Counselor** | Streaming responses from Claude, personalized to user goals |
| **Crisis Safety** | Automatic 988 Lifeline referral on risk detection |
| **Mood Tracker** | Daily mood logging with streaks, weekly chart |
| **Psychology Library** | 100+ terms, 12+ therapy approaches, 20+ techniques |
| **Session History** | Persistent chat history with SQLite |
| **Onboarding** | 3-screen personalization flow |
| **Notifications** | Local daily check-in reminders |

---

## Important Notes

- **Not for Clinical Use**: Dr. Sage is an AI companion, not a licensed therapist
- **Data Privacy**: All conversation data is stored locally on device
- **Crisis Resources**: App always provides 988 Lifeline for crisis situations
- **API Costs**: The app uses the Claude API — monitor usage at console.anthropic.com

---

## Troubleshooting

**"Module not found" errors:**
```bash
npm install
npx expo install --fix
```

**Metro bundler issues:**
```bash
npx expo start --clear
```

**iOS build fails:**
```bash
cd ios && pod install && cd ..
```

**TypeScript errors:**
The `@/` path alias is configured in tsconfig.json. If your IDE doesn't resolve it, reload the TypeScript server.

# 🧠 Dr. Sage — AI Mental Wellness Companion

> A safe, judgment-free space to talk through what's on your mind — powered by AI, grounded in evidence-based psychology.

---

## ✨ What Makes Dr. Sage Different

Most mental health apps give you generic tips. Dr. Sage **listens first, asks questions, and guides you** — the same way a skilled counsellor would.

- **Asks before it tells** — uses Motivational Interviewing & Socratic questioning to understand your situation deeply before offering guidance
- **Remembers you** — auto-summarises every session; references past conversations in future ones
- **Voice-first** — speak naturally, Dr. Sage transcribes and responds; replies are read aloud in a clear, natural voice
- **Evidence-based** — grounded in CBT, DBT, ACT, mindfulness, and a curated mental health knowledge base
- **Crisis-aware** — detects distress signals and immediately surfaces crisis hotlines
- **Works offline** — falls back to local RAG (retrieval-augmented generation) if no internet

---

## 📱 Try It Now

**No install needed** — open in Expo Go:

| Platform | Link |
|---|---|
| iOS (App Store) | Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779), then open the link below |
| Android (Play Store) | Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent), then open the link below |

```
exp://u.expo.dev/38689a03-40d7-48b8-9966-a273ccdf9e7f
```

Or scan this QR code with your camera (iOS) or Expo Go (Android):

> Visit the [Expo Dashboard](https://expo.dev/accounts/kroy3/projects/dr-sage) for the latest QR code.

---

## 🚀 Features

### 💬 Intelligent Chat
- Warm, rigorous AI companion trained on mental health principles
- Validates feelings before exploring them
- Guides decision-making through values clarification and evidence review
- Tracks named people, situations, and recurring themes within a session

### 🎙️ Voice Mode
- Tap mic → speak → tap again to send
- Groq Whisper AI transcription (fast, accurate)
- Auto-speak toggle — Dr. Sage reads every reply aloud
- Per-message replay button
- Clear, natural-sounding voice (native iOS/Android TTS)

### 🧠 Cross-Session Memory
- Every conversation is auto-summarised when you end it
- Dr. Sage references past sessions: *"Last time you mentioned trouble at work..."*
- Tracks mood patterns and recurring themes over time

### 📚 Knowledge Base
- Curated library of evidence-based mental health content
- Disorders, therapeutic approaches, coping strategies, techniques, glossary
- Offline-accessible — no internet required for the library

### 📊 Mood Tracking
- Log your mood daily with tags and notes
- Visual history and streak tracking
- Mood data feeds into Dr. Sage's understanding of your patterns

### 🌙 Dark Mode
- Full light/dark theme support
- Follows system preference or manually selectable

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 / React Native |
| Navigation | Expo Router (file-based) |
| AI Chat | [Groq](https://groq.com) — `llama-3.3-70b-versatile` |
| Voice Input | Groq Whisper (`whisper-large-v3-turbo`) via `expo-audio` |
| Voice Output | `expo-speech` (native Siri/Google TTS) |
| Knowledge Base | Local JSON RAG (offline, no API) |
| Storage | SQLite via `expo-sqlite` |
| State | Zustand with AsyncStorage persistence |
| Styling | React Native StyleSheet + custom theme system |
| Build & Deploy | EAS Build + EAS Update |

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) on your phone (for quick testing)
- A free [Groq API key](https://console.groq.com) (for AI chat + voice transcription)

### 1. Clone
```bash
git clone https://github.com/kroy3/dr-sage.git
cd dr-sage
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment
```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
```

Get a free key at → https://console.groq.com (no credit card required)

### 4. Run
```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go on your phone.

---

## 🏗️ Build for Stores

### Android APK (direct install)
```bash
eas build --platform android --profile preview
```

### Android AAB (Google Play)
```bash
eas build --platform android --profile production
```

### iOS (requires Apple Developer account — $99/yr)
```bash
eas build --platform ios --profile production
```

---

## 📁 Project Structure

```
dr-sage/
├── app/                    # Screens (Expo Router file-based routing)
│   ├── (tabs)/
│   │   ├── chat.tsx        # Main chat screen with voice
│   │   ├── mood.tsx        # Mood tracking
│   │   ├── library.tsx     # Knowledge base browser
│   │   └── profile.tsx     # Settings & profile
│   └── onboarding/         # First-run onboarding flow
├── src/
│   ├── services/
│   │   ├── groq.ts         # Groq LLM + Whisper API
│   │   ├── voice.ts        # Recording + TTS
│   │   ├── localCouncil.ts # Offline RAG retrieval
│   │   └── storage.ts      # SQLite database layer
│   ├── stores/             # Zustand state stores
│   ├── hooks/              # useChat (main AI orchestration)
│   ├── theme/              # Colors, typography, spacing
│   └── types/              # TypeScript types
└── data/
    └── knowledge-base/     # Curated mental health JSON content
```

---

## 🔒 Privacy & Safety

- **No data leaves your device** except AI chat messages sent to Groq for processing
- **No account required** to use the app
- **Your API key** stays in your `.env` file — never committed to git
- **Crisis detection** — messages containing self-harm signals bypass the AI and immediately show crisis resources
- Dr. Sage is a **wellness companion, not a therapist** — it always recommends professional help for clinical concerns

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Open a pull request

Areas where help is especially welcome:
- Expanding the knowledge base (`data/knowledge-base/`)
- Improving the AI system prompt (`src/hooks/useChat.ts`)
- Adding more languages / voice options
- Accessibility improvements

---

## 📄 Licence

MIT — free to use, modify, and distribute.

---

## ⚠️ Disclaimer

Dr. Sage is an AI wellness companion for educational and supportive purposes only. It is **not a substitute for professional mental health care**. If you are in crisis, please contact:

- **988 Suicide & Crisis Lifeline** — call or text **988** (US)
- **Crisis Text Line** — text **HOME** to **741741** (US)
- **Emergency Services** — call **911** (or your local emergency number)

---

<p align="center">Made with ❤️ for everyone who needs someone to talk to.</p>

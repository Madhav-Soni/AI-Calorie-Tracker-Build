<div align="center">

<img src="https://img.shields.io/badge/Platform-React%20Native%20%2B%20Expo-7C3AED?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/AI-Cloudflare%20Workers%20AI-F6821F?style=for-the-badge&logo=cloudflare&logoColor=white" />
<img src="https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=for-the-badge" />

<br /><br />

# ⚡ AI Calorie Tracker

### *Snap a meal. Get instant nutrition. No manual logging. Ever.*

**The first mobile nutrition companion powered by on-device Vision AI —**  
**built for people who want results, not spreadsheets.**

<br />

[![Watch Demo](https://img.shields.io/badge/🎥_Watch_Demo-Loom-7C3AED?style=for-the-badge)](https://www.loom.com/share/397acfc681c742deacb9a4bd58648684) &nbsp;&nbsp; [![Try It](https://img.shields.io/badge/📱_Try_It-Installation-22C55E?style=for-the-badge)](#installation)

<br />

---

</div>

## The Problem

Calorie tracking is broken. Existing apps require you to search a database, manually type every ingredient, estimate portion sizes, and do mental math — all while your food goes cold. The result? **95% of users quit within a week.**

**AI Calorie Tracker eliminates every manual step.** Point your camera at any meal and our Vision AI pipeline identifies every food item, maps it to a deterministic nutrition database, and delivers an accurate macro breakdown in seconds — no search, no typing, no guessing.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🤖 **Vision AI Meal Scanning** | Cloudflare Workers AI identifies food items from a photo in real time |
| 🧮 **Deterministic Nutrition** | Structured food DB — no hallucinated calories, ever |
| 📊 **Dynamic Macro Dashboard** | Animated daily rings for calories, protein, carbs, fat |
| 🔥 **Streak Engine** | Consecutive-day logging streaks with smart fallback UI |
| 🧠 **AI Nutrition Coach** | Personalized insights based on your real-time macro balance |
| 📈 **Weekly Performance Chart** | Mon–Sun calorie graph with goal deviation markers |
| ⚖️ **Weight Logging** | Historical weight tracking with trend analysis |
| 🎯 **Personalized Onboarding** | Mifflin-St Jeor + activity multiplier → exact calorie & macro targets |
| 🔐 **Firebase Auth + Sync** | Multi-device real-time data sync via Cloud Firestore |

---

## 🎬 App Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Onboarding │───▶│    Goals    │───▶│  Activity   │───▶│    Diet     │
│  Biometrics │    │  lose_fat   │    │   Level     │    │ Preference  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                  │
                                                                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Dashboard  │◀───│  Nutrition  │◀───│  AI Vision  │◀───│ Personalized│
│  + Streaks  │    │  Analysis   │    │  Pipeline   │    │    Plan     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🧠 AI Pipeline Architecture

The core innovation is a **two-stage AI pipeline** that separates vision inference from nutrition calculation — solving the fundamental reliability problem with pure LLM nutrition generation.

```
📱 Device Camera
      │
      ▼
expo-file-system.readAsBase64()          ← reliable local file read
      │
      ▼ JSON body { base64, mimeType }   ← NO FormData (Hermes-safe)
      │
      ▼
Express Backend (Node.js)
      │
      ├── Stage 1: Cloudflare Workers AI
      │   Model: @cf/meta/llama-3.2-11b-vision-instruct
      │   Task: food NAME identification only
      │   Output: { "foods": ["banana", "rice", "chicken"] }
      │
      └── Stage 2: Deterministic Nutrition DB (backend)
          Input: food names from Stage 1
          Process: normalize → alias → lookup → sum
          Output: exact calories, protein, carbs, fat
                │
                ▼
          Firestore (real-time sync)
                │
                ▼
          📱 Dashboard updates instantly
```

**Why two stages?** Vision LLMs are excellent at identification but unreliable at producing consistent JSON nutrition values. Splitting the task makes Stage 1 near-perfect (simple classification) and Stage 2 deterministic (no model involved). Zero hallucinated macros.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Expo)                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Camera  │  │Dashboard │  │ History  │  │ Profile  │  │
│  │ Screen   │  │  Screen  │  │  Screen  │  │  Screen  │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘  │
│       │              │                                      │
│  ┌────▼──────────────▼──────────────────────────────────┐  │
│  │           Zustand State (useMealStore)                │  │
│  │     meals · goals · streak · userProfile             │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          │                            │
          ▼                            ▼
┌─────────────────┐          ┌──────────────────────┐
│  Express Server │          │   Firebase Services   │
│  (Node.js)      │          │                      │
│                 │          │  ┌─────────────────┐ │
│  POST           │          │  │  Firebase Auth  │ │
│  /analyze-food  │          │  └─────────────────┘ │
│                 │          │  ┌─────────────────┐ │
│  Food DB        │          │  │   Firestore     │ │
│  (150+ items)   │          │  │  (real-time)    │ │
└────────┬────────┘          └──────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Cloudflare Workers AI  │
│  llama-3.2-11b-vision   │
│  Free tier · 10k/day    │
└─────────────────────────┘
```

---

## 🛠 Tech Stack

**Frontend**
- React Native + Expo SDK 56
- TypeScript (strict)
- React Navigation (Stack + Bottom Tabs)
- React Native Reanimated 3
- Expo Blur + Expo Camera
- Zustand (persistent state via AsyncStorage)

**Backend**
- Node.js + Express
- Cloudflare Workers AI (vision inference)
- Deterministic Food Nutrition DB (150+ items)

**Infrastructure**
- Firebase Authentication
- Cloud Firestore (real-time sync)
- Expo File System (base64 image pipeline)

---

## ⚡ Technical Challenges Solved

**1. Hermes Bridgeless FormData bug**  
Expo SDK 56 enables Hermes Bridgeless mode by default. Native `FormData` multipart serialization is broken in this mode — silently producing malformed payloads. Solution: pure JSON body with base64 string, bypassing `FormData` entirely.

**2. LLM nutrition hallucination**  
Vision LLMs produce inconsistent JSON when asked to estimate nutrition — zero calories, impossible portions, malformed output. Solution: the two-stage pipeline where AI only identifies food names and a deterministic DB computes all nutrition values.

**3. Android physical device networking**  
`localhost` and `10.0.2.2` don't work on physical Android devices over USB. Backend must bind to `0.0.0.0` and frontend must target the machine's LAN IP. Documented clearly in setup.

**4. Firebase `updateDoc` silent failure**  
`updateDoc` throws if the document doesn't exist yet — caught silently, leaving `onboardingCompleted` unset forever. Solution: `setDoc` with `{ merge: true }` which creates or updates regardless of prior existence.

**5. SplashScreen stale closure bug**  
Reading `profile.onboardingCompleted` from a React closure captured before Firestore resolves always returned `false`. Solution: read directly from Zustand store state (`getState().profile`) after the async listener fires.

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Expo Go app on Android/iOS
- Firebase project
- Cloudflare account (free)

### 1. Clone & install

```bash
git clone https://github.com/Madhav-Soni/AI-Calorie-Tracker-Build.git
cd AI-Calorie-Tracker-Build
npm install
```

### 2. Configure environment

Create `.env` in the project root:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudflare Workers AI
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
```

### 3. Start the backend

```bash
cd backend
node server.js
# ✅ Backend on port 3000
```

> **Android physical device**: replace `localhost` with your machine's LAN IP in `services/foodAnalysis.ts`.  
> Find it: `ifconfig | grep "inet " | grep -v 127` (Mac/Linux) or `ipconfig` (Windows)

### 4. Start the app

```bash
npx expo start --clear
```

Scan the QR code with Expo Go.

---

## 📊 Nutrition Database

The backend ships with 150+ hand-verified food entries across 10 categories:

| Category | Examples |
|---|---|
| 🍎 Fruits | Apple, Banana, Mango, Avocado, Blueberry |
| 🥦 Vegetables | Broccoli, Spinach, Sweet Potato, Corn |
| 🍚 Grains | Rice, Pasta, Oats, Naan, Roti, Dosa |
| 🍗 Proteins | Chicken, Salmon, Tuna, Eggs, Tofu, Shrimp |
| 🧀 Dairy | Greek Yogurt, Cheese, Milk |
| 🍔 Fast Food | Pizza, Burger, Fries, Burrito, Sushi |
| 🇮🇳 Indian Food | Biryani, Dal, Paneer, Butter Chicken, Samosa |
| 🍪 Snacks | Chips, Chocolate, Nuts, Peanut Butter |
| ☕ Drinks | Coffee, Juice, Smoothie |
| 🍰 Desserts | Cake, Ice Cream, Donut |

All values sourced from USDA nutritional data. Fully extensible — add entries in `backend/server.js`.



## 🔒 Privacy & Security

- All images are processed in memory — no image is stored on any server
- Base64 payloads are discarded immediately after inference
- Firebase Auth handles all authentication (no passwords stored in Firestore)
- Firestore security rules enforce per-user data isolation
- No third-party analytics or ad SDKs

---

## 💡 Monetization Potential

| Tier | Features | Price |
|---|---|---|
| **Free** | 5 AI scans/day, basic tracking | $0 |
| **Pro** | Unlimited scans, AI coach, weekly reports | $4.99/mo |
| **Team** | Family sharing (5 users), shared goals | $9.99/mo |
| **Clinical** | API access, EHR integration, white-label | Custom |

---

## 🏆 Competitive Edge

| Feature | AI Calorie Tracker | MyFitnessPal | Cronometer | Lose It |
|---|---|---|---|---|
| Photo scanning | ✅ Zero-tap | ⚠️ Premium | ❌ | ⚠️ Premium |
| No manual search | ✅ | ❌ | ❌ | ❌ |
| Hallucination-free AI | ✅ Two-stage | N/A | N/A | N/A |
| Real-time sync | ✅ Firestore | ✅ | ✅ | ✅ |
| Fully open source | ✅ | ❌ | ❌ | ❌ |
| Indian food DB | ✅ | ⚠️ Limited | ⚠️ | ⚠️ |

---

## 🤝 Contributing

Contributions are welcome. The highest-impact areas:

1. **Expand the food database** — add items to `FOOD_DB` in `backend/server.js`
2. **Improve AI prompt** — better food identification for edge cases
3. **Portion size estimation** — use image metadata to infer serving sizes
4. **UI components** — new chart types, animations, themes

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: description"
git push origin feature/your-feature
# open a PR
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">

**Built by [Madhav Soni](https://github.com/Madhav-Soni)**

*If this project helped you, leave a ⭐ — it helps more people find it.*

</div>

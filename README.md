# Financia

**Bias Detector + Trading Coach** — 

> Upload your trades. Detect overtrading, loss aversion & revenge trading. Get personalized interventions, financial literacy lessons, brokerage recommendations, and a Rest Mode to prevent spiraling.

---

## 🎯 One-Liner

*"Upload your trades → we detect overtrading, loss aversion & revenge trading → get a personalized coaching plan, literacy modules, brokerage comparison (featuring National Bank Direct Brokerage), and a Rest Mode that blocks you from spiraling."*

---

## 🏗️ Architecture

| Layer | Stack |
|-------|-------|
| **Mobile App** | Expo (React Native) · TypeScript · Expo Router |
| **State** | `useReducer` + `AppContext` |
| **Charts** | react-native-gifted-charts |
| **CSV Parsing** | PapaParse |
| **Backend API** | Express · TypeScript · Zod |
| **LLM** | Google Gemini (coaching language & literacy lessons) |
| **Theme** | Dark Navy "Bank-Grade" palette |

---

## 📱 Screens

### Onboarding
- **Welcome** — App intro with "Link Partner Bank (Demo)" or "Continue as Guest"
- **Partner Bank Selection** — 6 Canadian banks (TD, RBC, BMO, Scotia, CIBC, NBC)
- **Fake Login** — Simulated banking login with disclaimer
- **Fake MFA** — 6-digit verification code entry

### Core Flow
- **Import Trades** — Upload CSV or load sample dataset (~191 trades)
- **Analyzing** — Animated progress through parsing, metrics, and coaching

### Dashboard (6 Tabs)
| Tab | Description |
|-----|-------------|
| 📊 **Insights** | Bias Risk Score (0–100), detected biases with severity badges |
| 📈 **Charts** | Trades/day, time between trades, revenge patterns, hold times |
| ✅ **Plan** | Action plan + Rest Mode (15m / 30m / 1h / 2h cooldown timer) |
| 📚 **Learn** | Financial literacy modules personalized to your biases |
| 🏦 **Broker** | Brokerage fee comparison with NBC Direct Brokerage highlight |
| 🛡️ **ETFs** | Safer ETF alternatives based on your risk profile |

---

## 🧠 Bias Detection

All detection is **deterministic** — no LLM guessing:

| Bias | Signal | Severity |
|------|--------|----------|
| **Overtrading** | Trades/day vs. healthy baseline | LOW / MEDIUM / HIGH |
| **Loss Aversion** | Avg hold time on losers vs. winners | LOW / MEDIUM / HIGH |
| **Revenge Trading** | Trades within 30 min after a loss | LOW / MEDIUM / HIGH |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo`)

### Frontend (Expo App)

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Open in:
- **Web**: Press `w` in the terminal
- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Expo Go**: Scan the QR code

### Backend (Express API)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env
echo "PORT=3001" >> .env

# Start the server
npx ts-node src/index.ts
```

> The backend is optional — the app includes a full fallback system that works without an API key.

---

## 📂 Project Structure

```
QHacks2026/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (AppContext + Theme)
│   ├── index.tsx               # Redirect → onboarding
│   ├── import.tsx              # CSV upload / sample data
│   ├── analyzing.tsx           # Analysis progress screen
│   ├── onboarding/
│   │   ├── welcome.tsx         # Welcome screen
│   │   ├── partnerSelect.tsx   # Bank selection
│   │   ├── fakeLogin.tsx       # Simulated login
│   │   └── fakeMfa.tsx         # Simulated MFA
│   └── (tabs)/
│       ├── insights.tsx        # Bias insights
│       ├── charts.tsx          # Visual analysis
│       ├── plan.tsx            # Action plan + Rest Mode
│       ├── learn.tsx           # Financial literacy
│       ├── brokerage.tsx       # Fee comparison
│       └── safer.tsx           # ETF alternatives
├── src/
│   ├── lib/
│   │   ├── theme.ts            # Colors, spacing, typography
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── csv.ts              # CSV parser
│   │   ├── sampleData.ts       # Demo dataset
│   │   ├── metrics.ts          # Trade metrics engine
│   │   ├── biases.ts           # Deterministic bias detection
│   │   ├── brokerage.ts        # Fee schedule comparison
│   │   └── risk.ts             # Risk profile + ETF recs
│   ├── context/
│   │   └── AppContext.tsx       # Global state (useReducer)
│   ├── components/
│   │   ├── PrimaryButton.tsx
│   │   ├── BiasCard.tsx
│   │   ├── SeverityBadge.tsx
│   │   ├── MetricRow.tsx
│   │   ├── ChartCard.tsx
│   │   └── DisclaimerBanner.tsx
│   └── api/
│       ├── coach.ts            # Backend API client
│       └── fallback.ts         # Offline fallback data
├── backend/
│   ├── src/
│   │   ├── index.ts            # Express server
│   │   ├── routes/coach.ts     # POST /api/coach
│   │   └── lib/
│   │       ├── prompt.ts       # Gemini prompt engineering
│   │       ├── schema.ts       # Zod validation
│   │       └── fallback.ts     # Server-side fallback
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── tsconfig.json
└── app.json
```

---

## ⚖️ Ethics & Disclaimers

- 🔒 **No real banking credentials** — all login flows are simulated for demo purposes
- 📊 **Not financial advice** — bias detection is educational, not a recommendation to trade or not trade
- 🏦 **Brokerage fees are illustrative** — not real quotes; always verify with the provider
- 🤖 **LLM outputs are supplementary** — core bias detection is deterministic and evidence-based
- 🧪 **Hackathon prototype** — not production-ready software

---

## 🏆 Built for QHacks 2026

National Bank Challenge · Queen's University

---

*Made with ☕ and conviction that better self-awareness leads to better financial decisions.*

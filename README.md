# PulseBoard — AgriIntel Farm Intelligence Platform

A full-stack farm management dashboard with live sensor data, AI-powered insights, multi-language support, and direct chef-to-farmer ordering.

**Live:** [pulseboard-api-silk.vercel.app](https://pulseboard-api-silk.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| **Farm Dashboard** | Live KPIs — yield, water, power, delivery · real-time sensor WebSocket |
| **Freshness Tracker** | AI shelf-life prediction · batch QR codes · climate simulator |
| **Herb Stock Market** | Live prices for 9 herbs · refreshes every 60s |
| **Waste Predictor** | Flash sale builder — turns excess stock into revenue |
| **AI Advisor** | Groq Llama 70B + Mistral Small · full live farm context injected per query |
| **Chef Connect** | Chef feedback reaches the farm directly · shapes every harvest |
| **Simple Mode** | Stripped-down farmer/chef view with WhatsApp ordering |
| **Voice Harvest Log** | Speech-to-text FAB · Groq AI interprets and speaks back in your language |
| **AI Photo Inspection** | Upload herb photo → AI detects quality, wilt & damage |
| **9 Languages** | English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Lucide React icons
- Axios (with fallback interceptor for offline resilience)

**Backend**
- FastAPI (Python) — deployed as Vercel serverless function
- Motor (async MongoDB driver) — lazy client init for cold-start performance
- httpx for async AI API calls

**AI**
- [Groq](https://groq.com) — Llama 70B (primary chat + voice harvest)
- [Mistral](https://mistral.ai) — Mistral Small (chat fallback)
- [Google Gemini](https://ai.google.dev) — additional fallback

**Database**
- MongoDB Atlas (Motor async client)

**Deployment**
- Vercel — frontend static build + Python ASGI serverless function in one project

---

## Project Structure

```
pulseboard/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── pages/          # Dashboard, AIAdvisor, SimpleView, etc.
│   │   ├── components/     # Sidebar, TopBar
│   │   ├── context/        # LangContext (9 langs), ThemeContext, AuthContext
│   │   ├── lib/            # fallback.js (offline data)
│   │   └── api.js          # Axios instance with fallback interceptor
│   ├── public/
│   │   └── sw.js           # Kill-switch service worker
│   ├── .env                # Local dev (VITE_API_URL=http://localhost:8001)
│   └── .env.production     # Production build (VITE_API_URL= empty → same-origin)
│
├── backend/                # FastAPI app
│   ├── main.py             # App entry, lifespan, /health, WebSocket
│   ├── database.py         # Lazy Motor client init
│   ├── config.py           # Settings (env vars)
│   ├── routes/             # auth, kpis, analytics, ai, sensors, freshness, market, waste, ml
│   └── services/
│       └── ai_router.py    # Groq → Mistral → Gemini fallback chain
│
├── api/
│   └── index.py            # Vercel ASGI entry point
└── vercel.json             # Build config + routes
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas cluster (or local MongoDB)

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create backend/.env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/agriintel
DB_NAME=agriintel
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
GOOGLE_API_KEY=...
SECRET_KEY=your-secret-key

uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install

# frontend/.env already has:
# VITE_API_URL=http://localhost:8001

npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment (Vercel)

The project deploys as a single Vercel project — frontend static files served from root, backend as a Python serverless function.

### Environment Variables (set in Vercel dashboard)

| Variable | Description |
|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (e.g. `agriintel`) |
| `GROQ_API_KEY` | Groq API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `GOOGLE_API_KEY` | Google Gemini API key |
| `SECRET_KEY` | JWT secret for auth |

### Atlas Network Access
MongoDB Atlas → Security → Network Access → Add `0.0.0.0/0` (required for Vercel's dynamic IPs)

### Deploy
```bash
git push origin main   # Vercel auto-deploys on push
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Backend status + MongoDB + AI key check |
| GET | `/kpis/` | Farm KPIs (yield, water, power, delivery) |
| GET | `/sensors/` | Live sensor snapshot |
| WS | `/ws/sensors` | Real-time sensor WebSocket stream |
| GET | `/freshness/` | Herb freshness predictions |
| GET | `/market/` | Live herb prices |
| GET | `/waste/` | Excess stock + flash sale recommendations |
| POST | `/ai/chat` | AI chat (Groq → Mistral fallback) |
| POST | `/ai/recommendations` | Prioritised farm action recommendations |
| POST | `/ai/demand-alerts` | Demand spike alerts |
| POST | `/ai/seasonal` | Seasonal planting advice |
| POST | `/ml/predict` | ML yield/freshness prediction |

---

## Language Support

All UI text is translated across 9 Indian languages via `LangContext`:

`English` · `தமிழ்` · `हिंदी` · `తెలుగు` · `ಕನ್ನಡ` · `മലയാളം` · `বাংলা` · `मराठी` · `ગુજરાતી`

Voice input and text-to-speech also use the selected language locale.

---

## License

MIT

# FaceAuth AI — Enterprise Biometric Authentication

AI-powered facial authentication system with real-time monitoring, threat detection, and a premium dark UI.

## Architecture

```
faceauth-ai/
├── frontend/          # React 19 + TypeScript + Vite + Tailwind CSS 4
│   ├── src/
│   │   ├── components/   # UI components (Dashboard, Enroll, Auth, etc.)
│   │   ├── utils/        # Face detection utility
│   │   ├── api.ts        # API client
│   │   └── types.ts      # TypeScript interfaces
│   ├── .env.example
│   └── vite.config.ts
├── backend/           # FastAPI + PostgreSQL + pgvector
│   ├── app/
│   │   ├── api/          # API routes (enroll, auth, logs, users)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── services/     # InsightFace recognition service
│   │   ├── utils/        # Fernet encryption for embeddings
│   │   └── db/           # Database connection & schema
│   ├── .env.example
│   └── requirements.txt
└── README.md
```

## Features

- **Face Enrollment** — Register users with 5+ facial samples
- **Face Authentication** — Real-time face matching with 3-frame validation
- **Dashboard** — Live auth feed, system health, threat alerts, analytics charts
- **Admin Panel** — PIN-protected administration with user management
- **Activity Logs** — Filterable authentication history
- **Security** — Encrypted embeddings at rest, rate limiting, input validation, CORS, security headers
- **Responsive** — Mobile-friendly with hamburger menu

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | Python 3.14, FastAPI, Uvicorn, SQLAlchemy |
| Database | PostgreSQL + pgvector (via Neon) |
| Face Recognition | InsightFace (buffalo_l model) |
| Encryption | Fernet (symmetric) |

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL with pgvector extension (or Neon account)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL and ENCRYPTION_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (leave empty for local dev)
npm run dev
```

### Build for Production

```bash
cd frontend
npm run build
# The built files will be in frontend/dist/
# The backend will serve them automatically
```

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
5. Build command: `npm run build`
6. Output directory: `dist`

### Backend → Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL` = your Neon PostgreSQL URL
   - `CORS_ORIGINS` = `https://your-frontend.vercel.app`
   - `ENCRYPTION_KEY` = a 32-character encryption key
   - `ENV` = `production`

### Database → Neon PostgreSQL

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to backend `.env` as `DATABASE_URL`

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (empty for local dev) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `ENCRYPTION_KEY` | 32-byte key for Fernet encryption |
| `FACE_MATCH_THRESHOLD` | Similarity threshold (default: 0.72) |
| `ENV` | `development` or `production` |
| `PORT` | Server port (default: 8000) |

## Security

- Face embeddings encrypted with Fernet before storage
- Rate limiting on `/enroll` (10/min) and `/auth` (30/min)
- Input validation on all forms
- CORS restricted to configured origins
- Security headers (HSTS, X-Frame-Options, etc.)
- DevTools detection with warning overlay
- Source maps disabled in production
- Console.log stripped in production builds
- Right-click disabled in production
- Debug shortcuts blocked in production

## License

MIT

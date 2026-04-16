# Self-host (home server)

This project is a Vite + React SPA that currently depends on **Base44** for auth, database entities, and integrations.

## Option A (fastest): self-host frontend, keep Base44 backend

### 1) Configure env

Edit `.env.local` and ensure:

- `VITE_BASE44_APP_ID=...`
- `VITE_BASE44_BACKEND_URL=https://base44.app`
- `VITE_BASE44_APP_BASE_URL=https://base44.app` (enables dev `/api` proxy for OAuth callbacks)

### 2) Build + run with Docker (recommended)

On your home server (Linux/Windows with Docker):

```bash
docker compose up -d --build
```

Then open:

- `http://<server-ip>:8080`

Notes:

- This Docker setup includes an Nginx reverse proxy for `/api/*` and `/ws-user-apps/socket.io/*` to `https://base44.app` to support Google OAuth callback routes like `/api/apps/auth/final-callback`.

### 3) Without Docker (quick test)

```bash
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Open:

- `http://<server-ip>:4173`

## Deploy on Vercel (static + Base44 backend)

### 1) Add Vercel rewrites

This repo includes `vercel.json` that proxies:

- `/api/*` -> `https://base44.app/api/*` (required for Google OAuth callback `/api/apps/auth/final-callback`)

### 2) Set environment variables in Vercel

In Vercel Project → Settings → Environment Variables:

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_BACKEND_URL` = `https://base44.app`
- `VITE_BASE44_APP_BASE_URL` = `https://base44.app`

### 3) Build settings

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Option B (real “no Base44”): replace the backend

Code currently calls:

- `base44.auth.*` (login/logout/me)
- `base44.entities.*` (Order, Product, ShippingMethod, ChatMessage, etc.)
- `base44.integrations.Core.*` (UploadFile, SendEmail, SendSMS, InvokeLLM, ...)

To fully self-host you must implement replacements (DB + auth + file storage + email/SMS, etc.) and then refactor `src/api/*` + pages/components to use your own API.

If you tell me what backend you prefer (e.g. Supabase self-host, Appwrite, PocketBase, Express+Postgres), I can map the Base44 entities in `base44/entities/*.jsonc` into tables and generate an API + client wrapper.

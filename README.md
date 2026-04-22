# ForgeFlow AI

ForgeFlow AI is a full-stack AI content calendar generator. It turns a company brief, weekly focus, audience, tone, platform mix, and posting cadence into a structured multi-platform publishing calendar, then exports the result as a polished Excel workbook.

The app is built for content strategists, founders, marketers, agencies, and operators who need to move from rough campaign direction to usable publishing plans quickly.

## What It Does

- Generates content calendar rows for LinkedIn, Instagram, Twitter/X, and YouTube.
- Lets users define company context, weekly focus, tone, target audience, CTA style, platforms, posts per day, number of days, and Excel file name.
- Shows expected row count before generation.
- Displays generated row count after generation.
- Returns platform summary counts from the backend.
- Previews generated calendar rows in the dashboard.
- Downloads a styled Excel workbook with bold headers, borders, wrapped text, frozen header row, widened columns, and table formatting.
- Uses OpenAI for generation, with a structured fallback engine if AI generation is unavailable.
- Includes a refined animated frontend with light/dark theme support.

## Tech Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- CSS animations and theme variables
- Next.js API routes as a proxy layer to the backend

Backend:

- FastAPI
- Uvicorn
- LangChain OpenAI
- OpenAI chat model
- Pydantic
- OpenPyXL

## Project Structure

```text
ForgeFlow_AI/
  backend/
    app/
      config.py
      generator.py
      main.py
      schemas.py
      utils.py
    .env.example
    requirements.txt
    run_server.py
  frontend/
    app/
      api/
      globals.css
      layout.tsx
      page.tsx
    components/
      generator-dashboard.tsx
    lib/
      api.ts
      types.ts
    .env.example
    package.json
  .gitignore
  README.md
```

## Environment Variables

Real environment files are intentionally ignored by Git. Use the example files as templates.

### Backend

Create `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
APP_NAME=ForgeFlow AI
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3010,http://127.0.0.1:3010
OUTPUT_DIR=outputs
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_NAME=ForgeFlow AI
NEXT_PUBLIC_PORTFOLIO_URL=https://sam-ojo.com
NEXT_PUBLIC_CREATOR_NAME=Samuel Ojo
BACKEND_API_BASE_URL=http://127.0.0.1:8010
```

`BACKEND_API_BASE_URL` is used by the frontend API proxy routes. In production, set it to your deployed backend URL.

## Local Development

### 1. Start The Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run_server.py
```

The backend runs locally at:

```text
http://127.0.0.1:8010
```

Health check:

```text
http://127.0.0.1:8010/health
```

### 2. Start The Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev -- --hostname 127.0.0.1 --port 3010
```

Open:

```text
http://127.0.0.1:3010
```

## Deployment

### Deploy The Frontend To Vercel

The frontend can be deployed to Vercel as a Next.js app.

Recommended Vercel settings:

- Framework Preset: Next.js
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: leave default

Add these environment variables in Vercel:

```env
NEXT_PUBLIC_APP_NAME=ForgeFlow AI
NEXT_PUBLIC_PORTFOLIO_URL=https://sam-ojo.com
NEXT_PUBLIC_CREATOR_NAME=Samuel Ojo
BACKEND_API_BASE_URL=https://your-deployed-backend-url.com
```

### Deploy The Backend

The backend is a FastAPI service. Host it on a Python-friendly platform such as Render, Railway, Fly.io, DigitalOcean, or a VPS.

Backend production environment variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
APP_NAME=ForgeFlow AI
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
OUTPUT_DIR=outputs
```

Typical production start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deploying the backend, copy the public backend URL into Vercel as `BACKEND_API_BASE_URL`.

## GitHub Preparation

Before pushing:

```bash
git init
git add .
git status
git commit -m "Initial ForgeFlow AI release"
```

Make sure `git status` does not show any real `.env` file.

## Security Notes

- Do not commit `.env`, `.env.local`, API keys, generated Excel files, `.next`, or `node_modules`.
- The root `.gitignore` excludes local environment files, generated backend outputs, build artifacts, dependency folders, and cache files.
- If a real API key was ever committed or shared publicly, rotate it before deploying.

## Useful Commands

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

Backend:

```bash
python run_server.py
python -m compileall app
```

## Creator

ForgeFlow AI was designed and built by Samuel Ojo.

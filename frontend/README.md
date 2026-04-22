# ForgeFlow AI Frontend

A clean Next.js + TypeScript frontend rebuilt to avoid the localStorage crash and keep the UI polished.

## Setup

1. Copy `.env.example` to `.env.local`
2. Update the values if needed
3. Install dependencies
4. Start development server

```bash
npm install
npm run dev
```

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_NAME=ForgeFlow AI
NEXT_PUBLIC_PORTFOLIO_URL=https://your-portfolio-link.com
NEXT_PUBLIC_CREATOR_NAME=Sam Ujo
```

## Notes

- This version does not use `localStorage`
- It is built for the backend contract:
  - `GET /health`
  - `POST /generate`
  - `GET /download/{file_name}`

# ForgeFlow AI Frontend

The Next.js frontend for ForgeFlow AI.

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
NEXT_PUBLIC_APP_NAME=ForgeFlow AI
NEXT_PUBLIC_CREATOR_NAME=Samuel Ojo
BACKEND_API_BASE_URL=http://127.0.0.1:8010
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
DEMO_USER_ID=local-demo-user
```

## Notes

- This version does not use `localStorage`
- The clickable Samuel Ojo footer link points directly to `https://samuel-ojo.vercel.app`.
- It is built for the backend contract:
  - `GET /health`
  - `POST /generate`
  - `GET /history`
  - `GET /download/{file_name}`

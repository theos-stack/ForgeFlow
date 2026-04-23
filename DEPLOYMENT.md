# ForgeFlow AI Deployment

This guide covers the current deployment shape:

- Backend: FastAPI on AWS Lightsail
- Frontend: Next.js on Vercel

Real `.env` files must stay off GitHub. Put production values directly into Lightsail and Vercel environment settings.

## 1. Portfolio Footer Link

Only `Samuel Ojo` is clickable in the UI. The prefix text is plain text.
The link is hardcoded in the frontend and points to:

```text
https://samuel-ojo.vercel.app
```

## 2. Backend Update On AWS Lightsail

SSH into the Lightsail server:

```bash
ssh ubuntu@YOUR_LIGHTSAIL_PUBLIC_IP
```

Go to the deployed project folder:

```bash
cd /path/to/ForgeFlow_AI
git pull origin main
cd backend
```

Activate the backend virtual environment:

```bash
source venv/bin/activate
```

Install or update backend dependencies:

```bash
pip install -r requirements.txt
```

Create or update `backend/.env` on the server:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
APP_NAME=ForgeFlow AI
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
OUTPUT_DIR=outputs
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=forgeflow_ai
```

Restart the backend service.

If you use systemd:

```bash
sudo systemctl restart forgeflow-backend
sudo systemctl status forgeflow-backend --no-pager
```

If you use PM2:

```bash
pm2 restart forgeflow-backend
pm2 status
```

Check the backend after restart:

```bash
curl https://your-backend-domain.com/health
```

Expected signs:

- `status` is `ok`
- `ai_configured` is `true`
- `mongo_configured` is `true` if MongoDB is set
- `storage_backend` is `mongodb` when MongoDB is connected

## 3. Vercel Frontend Update

In Vercel, open the ForgeFlow AI project.

Set the root directory:

```text
frontend
```

Use the default Next.js build settings:

```text
Build Command: npm run build
Output Directory: default
```

Add or update these Vercel environment variables:

```env
NEXT_PUBLIC_APP_NAME=ForgeFlow AI
NEXT_PUBLIC_CREATOR_NAME=Samuel Ojo
BACKEND_API_BASE_URL=https://your-backend-domain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
```

Redeploy the frontend after changing environment variables.

## 4. Clerk Production URLs

In Clerk, add your production frontend domain to the allowed URLs.

Use your Vercel domain for:

- sign-in redirect URL
- sign-up redirect URL
- after sign-in URL
- after sign-up URL

## 5. MongoDB Atlas Check

After generating a calendar in production, open MongoDB Atlas:

1. Go to your cluster.
2. Click `Browse Collections`.
3. Open the database named `forgeflow_ai`.
4. Open the collection named `generation_events`.
5. Confirm a new document appears after generation.

Each saved document should include:

- `user_id`
- `company_summary`
- `weekly_focus`
- `platforms`
- `total_rows`
- `file_name`
- `generation_mode`
- `created_at`

If `/health` says `storage_backend` is `local_json`, the backend did not connect to MongoDB. Recheck `MONGODB_URI`, install `pymongo`, then restart the backend.

## 6. Final Smoke Test

After deploying both sides:

1. Open the Vercel frontend.
2. Sign in with Google.
3. Generate a one-day calendar.
4. Confirm the banner does not say AI fallback.
5. Open the dashboard and confirm the generation appears.
6. Download the Excel file.
7. Click `Samuel Ojo` in the footer and confirm it opens the portfolio website.

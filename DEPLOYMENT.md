# Deployment structure

This repository contains two deployable applications:

## Frontend: Vercel

Use this folder as the Vercel project root:

```text
client/client
```

Settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`

`client/client/vercel.json` already provides the React Router fallback.

## Backend: Vercel

Create a separate Vercel project for the backend and use this folder as its project root:

```text
Workforce-backend/server
```

The included `server/vercel.json` configures the Express app as a Vercel Node function. Leave the build command empty or use the default, and do not use `npm start` as the production command.

Set these variables in Vercel Project Settings > Environment Variables. Use a MongoDB Atlas URI whose network access allows Vercel:

```text
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_production_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=https://YOUR-FRONTEND-DOMAIN.vercel.app
NODE_ENV=production
TIMEZONE=Asia/Karachi
SETUP_SECRET=your_setup_secret
```

Do not upload `server/.env` or commit production secrets.

After deployment, verify:

```text
https://YOUR-BACKEND-DOMAIN.vercel.app/api/health
```

The response should be JSON with `success: true` and `database: "connected"`.

After the backend gets a public URL, set:

```text
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Then set the frontend `VITE_API_URL` to the backend URL ending in `/api` and redeploy the frontend.

## Do not deploy

The root `config/` and `controllers/` folders are legacy duplicates and are not imported by the active server. Keep them out of deployment unless they are intentionally migrated later. Never upload `node_modules/`, `dist/`, or any `.env` file.

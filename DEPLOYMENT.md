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

## Backend: Render or Railway

Deploy this folder as a Node.js web service:

```text
server
```

Commands:

- Build command: `npm install`
- Start command: `npm start`

Set the variables from `server/.env.example` in the hosting provider dashboard. Do not upload `server/.env`.

After the backend gets a public URL, set:

```text
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Then set the frontend `VITE_API_URL` to the backend URL ending in `/api` and redeploy the frontend.

## Do not deploy

The root `config/` and `controllers/` folders are legacy duplicates and are not imported by the active server. Keep them out of deployment unless they are intentionally migrated later. Never upload `node_modules/`, `dist/`, or any `.env` file.

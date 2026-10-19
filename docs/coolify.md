# Deploy tempo (Støttehjulet) on Coolify

Coolify deploys this repo as a **Docker Compose** stack. The `web` service is the public entrypoint; it proxies `/api` to the API container so one domain is enough.

## 1. Prerequisites

- Coolify instance with Docker
- This repository connected (Origin or GitHub)
- A domain pointed at your Coolify server (or Coolify’s generated URL)

## 2. Create the resource

1. In Coolify: **New Resource** → **Docker Compose**
2. Select the **tempo** repository and branch `main`
3. Base directory: `/` (repo root)
4. Compose file: `docker-compose.yml`
5. Assign your domain to the **`web`** service (port **80**)
6. Do **not** publish `db`. Publishing `api` (3848) is optional — only if you want a separate API hostname for a future mobile app

## 3. Environment variables

Set these in the Coolify service environment (see also [`.env.example`](../.env.example)):

| Variable | Required | Notes |
|----------|----------|--------|
| `SECRET_KEY` | Yes | Long random string (JWT signing) |
| `POSTGRES_PASSWORD` | Yes | Strong password |
| `SEED_ADMIN_EMAIL` | Recommended | Initial admin login |
| `SEED_ADMIN_PASSWORD` | Recommended | Change after first login |
| `SEED_ADMIN_NAME` | Optional | Default `Administrator` |
| `CORS_ORIGINS` | Optional | Default `*` (same-origin web is fine) |
| `VITE_API_URL` | Leave empty | Empty = browser calls `/api` on same host |
| `POSTGRES_USER` / `POSTGRES_DB` | Optional | Defaults: `aarshjul` |

After changing build-related vars (`VITE_API_URL`), trigger a **rebuild**.

## 4. Deploy

Click **Deploy**. Coolify builds `api` and `web`, starts Postgres, and routes HTTPS to `web`.

- App: `https://your-domain/`
- OpenAPI (proxied): `https://your-domain/docs`
- Health: `https://your-domain/api/health`

## 5. First login

Use the seeded admin credentials you set (`SEED_ADMIN_*`). Create additional users under **Brukere**.

## 6. Persistence

Postgres data lives in the Docker volume `pgdata`. Keep Coolify backups enabled for that volume if you need restore.

## 7. Updates

Push to `main` and redeploy (or enable Coolify auto-deploy on push). Schema is created on API startup; there is no separate migration step yet.

## Local parity

```bash
docker compose up --build
```

Open http://localhost:3847 — same proxy behaviour as Coolify.

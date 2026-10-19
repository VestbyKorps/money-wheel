# Støttehjulet

Årshjul for et musikkorps — spor søknadsfrister for penge- og materialstøtte.

Systemet er delt i et **headless API** og en **web-frontend**, slik at mobilapp senere kan snakke med samme API. Alt kjøres med Docker Compose.

## Arkitektur

| Tjeneste | Teknologi | Port |
|----------|-----------|------|
| `api` | FastAPI + SQLAlchemy + PostgreSQL | 3848 |
| `web` | React (Vite) + Tailwind | 3847 |
| `db` | PostgreSQL 16 | intern |

### Domene

- **Støtteordning** — f.eks. kommunal støtte, MVA-kompensasjon, instrumentfond
- **Frist** — årlig (eller engangs) søknadsdato på årshjulet, med sjekkliste og påminnelsesdager
- **Søknad** — sporingsinstans per år (status, ansvarlig, notater, beløp)
- **Bruker** — `admin` (kan opprette brukere/admin, ordninger, frister) eller `member`

## Kjør med Docker Compose

```bash
docker compose up --build
```

- Nettside: http://localhost:3847  
- API (via proxy): http://localhost:3847/api/health  
- OpenAPI: http://localhost:3847/docs (også direkte på :3848)

Standard admin: `admin@korps.example` / `admin123`  
Demo-medlem: `styre@korps.example` / `styre123`

Endre hemmeligheter via miljøvariabler (se [`.env.example`](.env.example)).

## Deploy med Coolify

Steg-for-steg: [docs/coolify.md](docs/coolify.md).

Kortversjon: **New Resource → Docker Compose** → denne repoen → `docker-compose.yml` → sett domene på tjenesten **`web`** (port 80). Sett minst `SECRET_KEY` og `POSTGRES_PASSWORD`. La `VITE_API_URL` være tom (samme origin via nginx-proxy).

## Lokal utvikling (uten Docker)

### API

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3848
```

SQLite brukes som standard (`aarshjul.db` i `api/`).

### Web

```bash
cd web
npm install
npm run dev
```

Vite proxyer `/api` til API på port 3848. Åpne http://localhost:3847

## API-oversikt

- `POST /api/auth/login/json` — innlogging
- `GET /api/auth/me` — innlogget bruker
- `GET|POST|PATCH /api/users` — brukeradmin (admin)
- `GET|POST|PATCH|DELETE /api/schemes` — støtteordninger
- `GET|POST|PATCH|DELETE /api/deadlines` — frister
- `GET|POST|PATCH /api/applications` — søknadssporing
- `GET /api/wheel?year=2026` — ferdig årshjul for UI/mobil

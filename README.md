# auto-lincoln-api-nest

REST API of **Auto Lincoln** — an admin panel for an auto parts catalogue
(learning project). NestJS + Prisma + PostgreSQL. Runs on
`http://localhost:3002`, every route is under `/api`.

This is the only backend. The HTTP contract (zod schemas, route names, cookie
name) lives in `../auto-lincoln-contracts` (`@auto-lincoln/contracts`); the web
app is `../auto-lincoln-web` (`:5173`).

## Stack

NestJS 12 (native ESM) · TypeScript 6 · Prisma 7 (`@prisma/adapter-pg`) ·
PostgreSQL 17 in Docker · zod 4 · jose (JWT) · cookie-parser.

## Getting started

Requirements: Node 24+, Docker.

```bash
npm install
cp .env.example .env          # then set JWT_SECRET: openssl rand -base64 48
docker compose up -d          # PostgreSQL on :5432
npx prisma migrate dev        # apply migrations
npx prisma generate           # client → src/db/generated/prisma
npm run dev                   # http://localhost:3002/api/health
```

### Environment

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `3002` | HTTP port |
| `CORS_ORIGIN` | `http://localhost:5173` | web app origin allowed to send cookies |
| `DATABASE_URL` | `postgresql://autolincoln:autolincoln@localhost:5432/autolincoln?schema=public` | PostgreSQL |
| `JWT_SECRET` | — | signs the session JWT |

The API fails on startup if a variable is missing (`src/config/env.ts`).

### Test accounts

| Role | Email | Password |
| --- | --- | --- |
| admin | `admin@autolincoln.local` | `admin12345` |
| manager | `test@autolincoln.local` | `test12345` |

Local only. They are already in the Docker volume. `prisma/seed.ts` is not in
this repo yet (it is still in `../архів/auto-lincoln-contracts/prisma/`), so
after `prisma migrate reset` or `docker compose down -v` there are no users.

## Commands

| Command | What it does |
| --- | --- |
| `docker compose up -d` | start PostgreSQL |
| `npm run dev` | `nest start --watch` |
| `npm run build` | build to `dist/` (`tsconfig.build.json`) |
| `npm start` | run `dist/main.js` |
| `npx prisma migrate dev --name <name>` | create and apply a migration |
| `npx prisma generate` | regenerate the Prisma client |
| `npx tsc --noEmit -p tsconfig.build.json` | type-check |

## API

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/health` | 200 `{ status: 'ok' }` (runs `SELECT 1`) |
| POST | `/api/auth/login` | 200 `{ id, email, name }` + `al_session` cookie · 400 · 401 |
| GET | `/api/auth/me` | 200 current user · 401 — *in progress* |
| POST | `/api/auth/logout` | 204, cookie cleared — *planned* |

Errors: `{ message, statusCode, error? }`.

**Session:** HS256 JWT (7 days, payload `{ sub: userId, role }`) in the
`al_session` cookie — `httpOnly`, `sameSite: 'lax'`, `path: '/'`, `secure` in
production. The token is never in a response body.

Try it with curl:

```bash
curl -c jar.txt -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@autolincoln.local","password":"admin12345"}'
curl -b jar.txt http://localhost:3002/api/auth/me
```

## Project structure

```
prisma/                     schema.prisma, migrations (not app code)
prisma.config.ts            Prisma CLI config
src/
├── main.ts                 bootstrap: cookie-parser, /api prefix, CORS
├── app.module.ts
├── config/env.ts           required env variables
├── core/                   infrastructure
│   └── prisma/             PrismaService + global PrismaModule
├── common/                 reusable by any feature
│   └── pipes/              ZodValidationPipe (validates @Body with contract schemas)
├── modules/                one folder per feature
│   ├── health/
│   └── auth/
│       ├── auth.module.ts · auth.controller.ts · auth.service.ts
│       ├── guards/         AuthGuard — reads the cookie, sets req.session
│       ├── lib/            password.ts (scrypt), session.ts (JWT, cookie options)
│       ├── mappers/        DB model → contract type
│       └── types/          express.d.ts — adds req.session
└── db/generated/           Prisma client (generated, gitignored)
```

Request pipeline: middleware (cookie-parser) → guard → pipe → controller.

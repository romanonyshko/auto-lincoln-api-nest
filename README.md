# auto-lincoln-api-nest

REST API of **Auto Lincoln** — an admin panel for an auto parts catalogue
(learning project). NestJS + Prisma + PostgreSQL. Runs on
`http://localhost:3002`, every REST route is under `/api`; the support chat is
a WebSocket at `ws://localhost:3002/ws/chat`.

This is the only backend. The HTTP contract (zod schemas, route names, cookie
name) lives in `../auto-lincoln-contracts` (`@auto-lincoln/contracts`); the web
app is `../auto-lincoln-web` (`:5173`).

## Stack

NestJS 12 (native ESM) · TypeScript 6 · Prisma 7 (`@prisma/adapter-pg`) ·
PostgreSQL 17 in Docker · zod 4 · jose (JWT) · cookie-parser ·
`@nestjs/platform-ws` (WebSocket, library `ws`).

## Getting started

Requirements: Node 24+, Docker.

```bash
npm install
cp .env.example .env          # then set JWT_SECRET: openssl rand -base64 48
docker compose up -d          # PostgreSQL on :5432
npx prisma migrate dev        # apply migrations
npx prisma generate           # client → src/db/generated/prisma
npx prisma db seed            # demo data for the dashboard
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

Local only. They are already in the Docker volume. `prisma/seed.ts` does not
create users yet (the old user seed is still in
`../архів/auto-lincoln-contracts/prisma/`), so after `prisma migrate reset` or
`docker compose down -v` there are no users.

## Commands

| Command | What it does |
| --- | --- |
| `docker compose up -d` | start PostgreSQL |
| `npm run dev` | `nest start --watch` |
| `npm run build` | build to `dist/` (`tsconfig.build.json`) |
| `npm start` | run `dist/main.js` |
| `npx prisma migrate dev --name <name>` | create and apply a migration |
| `npx prisma generate` | regenerate the Prisma client (run it after every migration) |
| `npx prisma db seed` | fill the dashboard tables with demo data (`prisma/seed.ts`, safe to re-run) |
| `npx tsc --noEmit -p tsconfig.build.json` | type-check |

## API

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/health` | 200 `{ status: 'ok' }` (runs `SELECT 1`) |
| POST | `/api/auth/login` | 200 `{ id, email, name }` + `al_session` cookie · 400 · 401 |
| GET | `/api/auth/me` | 200 `{ id, email, name }` · 401 |
| POST | `/api/auth/logout` | 204, cookie cleared (no auth required) |
| GET | `/api/dashboard` | 200 `DashboardResponse` · 401 |

**Dashboard** (`DashboardResponse` in the contracts) is built from these tables:

| Field | Source |
| --- | --- |
| `glance` | `count()` of `news`, `reviews`, `pages` |
| `latestNews` | newest `news` by `publishedAt`, or `null` |
| `latestReview` | newest `reviews` by `createdAt` with its news title, or `null` |
| `requests` | `requests` grouped by `status` (missing statuses → 0) |
| `stats` | `dashboard_stats` ordered by `order` |
| `activity` | `monthly_activity` ordered by `month` (`'Jan'`, `'Feb'`, …) |

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
curl -b jar.txt http://localhost:3002/api/dashboard
```

## Support chat (WebSocket)

`ws://localhost:3002/ws/chat` (`WS_ROUTES.chat` in the contracts). For now the
server greets the user and echoes every message back; nothing is stored.

**Connecting.** The browser sends the `al_session` cookie with the handshake
by itself. The server checks, in this order:

| Check | If it fails |
| --- | --- |
| `Origin` equals `CORS_ORIGIN` | closed with code `4403` |
| `al_session` is a valid session JWT | closed with code `4401` |

On success the first message is the greeting.

**Events** (JSON, schemas in `@auto-lincoln/contracts`, `chat/messages.ts`):

| Direction | Event | When |
| --- | --- | --- |
| client → server | `{ type: 'message:send', clientId, text }` | user sends a message; `clientId` is a uuid made by the client, `text` is trimmed, 1–1000 chars |
| server → client | `{ type: 'message:new', message }` | greeting on connect (no `clientId`) and the reply to `message:send` (same `text` and `clientId`) |
| server → client | `{ type: 'error', code: 'INVALID_JSON', message }` | the message is not JSON |
| server → client | `{ type: 'error', code: 'VALIDATION_ERROR', message }` | the JSON does not match `ClientChatEventSchema`; `message` is the first zod issue |

`message` is a `ChatMessage`: `{ id, clientId?, author: 'user' | 'support', text, sentAt }`
(`id` and `sentAt` are set by the server). Errors keep the connection open.

**Limitations:** no history — a reconnect starts an empty chat with a new
greeting; one user talks only to the server, not to other users.

Try it with [wscat](https://github.com/websockets/wscat) (take the cookie value
from `jar.txt` after the login above):

```bash
npx wscat -c ws://localhost:3002/ws/chat \
  -H "Origin: http://localhost:5173" \
  -H "Cookie: al_session=<token>"
> {"type":"message:send","clientId":"6f1c2a9e-1b7d-4c1e-9a43-3f0d8a2b5c71","text":"hi"}
```

## Project structure

```
prisma/                     schema.prisma, migrations, seed.ts (not app code)
prisma.config.ts            Prisma CLI config
src/
├── main.ts                 bootstrap: cookie-parser, /api prefix, CORS, WsAdapter
├── app.module.ts
├── config/env.ts           required env variables
├── core/                   infrastructure
│   └── prisma/             PrismaService + global PrismaModule
├── common/                 reusable by any feature
│   └── pipes/              ZodValidationPipe (validates @Body with contract schemas)
├── modules/                one folder per feature
│   ├── health/
│   ├── dashboard/          GET /api/dashboard — service (Promise.all) + mappers/
│   ├── chat/               ws /ws/chat — gateway (handshake auth, validation, send)
│   │                       + service (greeting, echo) + constants
│   └── auth/
│       ├── auth.module.ts · auth.controller.ts · auth.service.ts
│       ├── guards/         AuthGuard — reads the cookie, sets req.session
│       ├── decorators/     @CurrentSession() — gives the controller req.session
│       ├── lib/            password.ts (scrypt), session.ts (JWT, cookie options)
│       ├── mappers/        DB model → contract type
│       └── types/          express.d.ts — adds req.session
└── db/generated/           Prisma client (generated, gitignored)
```

Request pipeline: middleware (cookie-parser) → guard → pipe → controller.
The WebSocket handshake bypasses this pipeline: the chat gateway checks Origin
and the cookie itself.

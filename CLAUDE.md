# CLAUDE.md

NestJS REST API of "Auto Lincoln" (admin panel for an auto parts catalogue;
a learning project). Port **3002**.

## One backend (since 2026-09-25)

This is **the only backend**. The two-backend setup (Express :3001 + Nest
:3002 with the same contract) is paused: `auto-lincoln-api-express` lives in
`../архів/`, nothing is implemented there and there is no parity check.
Decision record: `../context/05-decisions.md` §21 — it overrides any
"both APIs" / Express / backend-switcher wording in older docs
(`../context/01-overview.md`, `02-workflow.md`, generated `4x-api-nest-*`).

```
~/Documents/programing/auto-lincoln/
  auto-lincoln-api-nest/    ← this repo: API + database (Prisma)
  auto-lincoln-contracts/   ← @auto-lincoln/contracts: HTTP contract only (zod schemas)
  auto-lincoln-web/         ← web app :5173
```

Order for an API change: contracts → this repo → web.

## Stack

NestJS 12 (native ESM, top-level `await`) · TypeScript 6 (`nodenext`,
`verbatimModuleSyntax`, decorators + `emitDecoratorMetadata`) · Prisma 7
(`prisma-client` generator, `@prisma/adapter-pg`) · PostgreSQL 17 in Docker ·
zod 4 · jose (JWT) · WebSockets via `@nestjs/platform-ws` (`WsAdapter`, library
`ws`) · `cookie` (parses the cookie header on the WS handshake).

## Commands

| Command | What it does |
| --- | --- |
| `docker compose up -d` | start PostgreSQL |
| `npm run dev` | `nest start --watch` |
| `npm run build` | `nest build` (uses `tsconfig.build.json`) → `dist/` |
| `npm start` | `node dist/main.js` |
| `npx prisma migrate dev --name <name>` | new migration |
| `npx prisma generate` | client → `src/db/generated/prisma` (gitignored); Prisma 7 `migrate dev` does not run it |
| `npx prisma db seed` | `tsx prisma/seed.ts` — dashboard demo data, clears and refills its tables |

## Layout

- `prisma/` (root) — `schema.prisma`, `migrations/`, `seed.ts`; read by
  `prisma.config.ts`. Not app code, not compiled. The seed creates its own
  `PrismaClient` (no Nest DI).
- `src/config/env.ts` — required env variables.
- `src/core/prisma/` — `PrismaService` (extends the generated `PrismaClient`)
  and a `@Global()` `PrismaModule`. `src/core/` = infrastructure.
- `src/common/pipes/zod-validation.pipe.ts` — validates `@Body()` with a schema
  from the contracts; message is one string (`z.prettifyError`) to match
  `ApiErrorSchema`. `src/common/` = reusable by any feature.
- `src/modules/<feature>/` — one folder per feature: `*.module.ts`,
  `*.controller.ts`, `*.service.ts` at the top; helpers in subfolders.
- `src/modules/auth/` — `guards/auth.guard.ts`, `decorators/`,
  `lib/password.ts` (scrypt `salt:keyHex`), `lib/session.ts` (HS256 JWT, 7 days,
  cookie options, `Session` type), `mappers/to-login-response.ts`,
  `types/express.d.ts` (adds `req.session`).
- `src/modules/dashboard/` — service returns raw Prisma results (8 queries in
  one `Promise.all`); `mappers/to-dashboard-response.ts` turns them into
  `DashboardResponse` (`Date` → ISO / `'Jan'` with `timeZone: 'UTC'`,
  `null` → `undefined` for optional fields, missing request statuses → 0).
- `src/modules/chat/` — support chat over WebSocket (echo for now).
  `chat.gateway.ts` is the transport: `@WebSocketGateway({ path: WS_ROUTES.chat })`
  → `ws://localhost:3002/ws/chat` (the global `/api` prefix does not apply to
  gateways). `handleConnection` checks `Origin` (`close(4403)`), then the
  `al_session` cookie via `authenticate()` (`close(4401)`), stores the session
  in a `WeakMap<WebSocket, Session>`, sends the greeting and listens with
  `client.on('message')`: `JSON.parse` → `INVALID_JSON`,
  `ClientChatEventSchema.safeParse` → `VALIDATION_ERROR`, otherwise
  `message:new` with the echo. Every outgoing event goes through
  `send(client, event: ServerChatEvent)`. `chat.service.ts` is the logic
  (`greeting()`, `reply(event)`, private `createMessage()` — `id` and `sentAt`
  are generated here) and knows nothing about sockets. `chat.constants.ts` —
  `CHAT_GREETING`. No DB, no history.
- `UserRole` and other enums come from `src/db/generated/prisma/enums.js`.
- `tsconfig.json` is for the editor (src + prisma + `prisma.config.ts`);
  `tsconfig.build.json` builds only `src`.

## State

Done: Prisma wired up, `GET /api/health` (runs `SELECT 1`),
`POST /api/auth/login` (200 + `al_session` cookie / 401 / 400),
`GET /api/auth/me` (`AuthGuard` + `@CurrentSession()`, 200 / 401),
`POST /api/auth/logout` (204, no guard, `clearCookie` with `SESSION_COOKIE_OPTIONS`),
`GET /api/dashboard` (`AuthGuard`, 200 / 401; tables `news`, `reviews`, `pages`,
`requests` + enum `RequestStatus`, `dashboard_stats`, `monthly_activity`;
demo data from `prisma/seed.ts`),
WebSocket support chat `ws://localhost:3002/ws/chat` (Origin + cookie auth,
greeting on connect, echo reply, `INVALID_JSON` / `VALIDATION_ERROR` errors).
Next: support chat in the web (`/support`); add users to `prisma/seed.ts` (the old seed is in
`../архів/auto-lincoln-contracts/prisma/`; users exist only in the Docker volume).

## Rules

- **DI classes use a value import.** `import type { PrismaService }` compiles
  but Nest fails at runtime with `can't resolve dependencies (?)`. The editor's
  auto-import tends to add `type` — check it. Inject `PrismaService`, never
  `PrismaClient`.
- Types in decorated parameters (`@Body() body: LoginRequest`,
  `@Res() res: Response` from `express`) use `import type` (TS1272).
- Controllers handle HTTP; services return `null` instead of throwing HTTP errors.
- DB models never leave the API as-is — map them to contract types.
- Set `@HttpCode` on POST routes (login 200, logout 204).
- Cookie `al_session`: `httpOnly`, `sameSite: 'lax'`, `path: '/'`, `secure` in production.
- Relative imports end in `.js`. One module per feature (in `src/modules/`), kebab-case files.

### WebSocket gateways

- `cookie-parser` and CORS do not apply to the WS handshake: read the cookie
  from `req.headers.cookie` (`parseCookie` from `cookie` v2 — there is no
  `parse`) and compare `req.headers.origin` with `env.corsOrigin` by hand.
- Close codes: `4403` — foreign Origin, `4401` — no valid session. The web
  relies on the difference (`4401` → login).
- `import type { WebSocket } from 'ws'`. Without the import TypeScript picks the
  global browser-style `WebSocket` from Node, which has no `.on()`.
- Incoming messages: raw `client.on('message')`, not `@SubscribeMessage` —
  `WsAdapter` expects `{ event, data }` and silently drops invalid JSON. Validate
  with the contract schema (`ClientChatEventSchema`), not the type.
- After `client.close(...)` or sending an `error` event — `return`. `close()`
  only starts closing; the value returned from an event handler goes nowhere.
- `nest start --watch` sometimes does not re-emit `dist/app.module.js` after a
  new module is added (the gateway answers 404) — restart `npm run dev`.

## How to work with me

- I write the code myself (learning mode): plan first and wait for my
  confirmation, then point to the files, a minimal example and why. Write code
  only when I ask.
- Reply in Ukrainian.

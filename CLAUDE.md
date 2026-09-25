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
zod 4 · jose (JWT).

## Commands

| Command | What it does |
| --- | --- |
| `docker compose up -d` | start PostgreSQL |
| `npm run dev` | `nest start --watch` |
| `npm run build` | `nest build` (uses `tsconfig.build.json`) → `dist/` |
| `npm start` | `node dist/main.js` |
| `npx prisma migrate dev --name <name>` | new migration |
| `npx prisma generate` | client → `src/db/generated/prisma` (gitignored) |

## Layout

- `prisma/` (root) — `schema.prisma`, `migrations/`; read by `prisma.config.ts`.
  Not app code, not compiled.
- `src/prisma/` — `PrismaService` (extends the generated `PrismaClient`) and a
  `@Global()` `PrismaModule`.
- `src/common/zod-validation.pipe.ts` — validates `@Body()` with a schema from
  the contracts; message is one string (`z.prettifyError`) to match `ApiErrorSchema`.
- `src/auth/` — `password.ts` (scrypt `salt:keyHex`), `session.ts` (HS256 JWT,
  7 days), `auth.service.ts`, `auth.controller.ts`, `to-login-response.ts`.
- `tsconfig.json` is for the editor (src + prisma + `prisma.config.ts`);
  `tsconfig.build.json` builds only `src`.

## State

Done: Prisma wired up, `GET /api/health` (runs `SELECT 1`),
`POST /api/auth/login` (200 + `al_session` cookie / 401 / 400).
Next: `GET /api/auth/me` + `AuthGuard` + `@CurrentSession()`,
`POST /api/auth/logout` (204, no guard); then move the web to the new contracts.

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
- Relative imports end in `.js`. One module per feature, kebab-case files.

## How to work with me

- I write the code myself (learning mode): plan first and wait for my
  confirmation, then point to the files, a minimal example and why. Write code
  only when I ask.
- Reply in Ukrainian.

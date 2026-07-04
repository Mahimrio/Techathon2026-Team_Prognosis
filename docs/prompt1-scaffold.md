# Prompt 1 — Monorepo Scaffold

## Structure
```
F:\IUT Hackathon\
├── package.json              # npm workspaces root, concurrently dev script
├── .gitignore                # node_modules/, dist/, *.tsbuildinfo, .vite/, coverage/, .env, .env.local
├── .env.example              # Backend + Bot env vars (sectioned)
├── vitest.workspace.ts       # Single vitest workspace covering all 3 sub-projects
│
├── backend/
│   ├── package.json          # @officevolt/backend — Express + Socket.IO + tsx
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── models/
│       │   ├── device.ts         # Device type/interface
│       │   └── roomFixture.ts    # 3 rooms × (2 fans + 3 lights) — canonical fixture
│       ├── simulator/index.ts
│       ├── alerts/index.ts
│       ├── routes/index.ts
│       ├── sockets/index.ts
│       └── index.ts
│
├── dashboard/
│   ├── package.json          # @officevolt/dashboard — React + Vite + Tailwind
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example          # VITE_BACKEND_URL only (separate from root .env)
│   ├── vitest.config.ts
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/socket.ts
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
├── bot/
│   ├── package.json          # @officevolt/bot — discord.js v14 + tsx
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── commands/
│       ├── services/llm.ts
│       └── index.ts
│
└── docs/                     # System diagram, schematic assets, README images
```

## Key Decisions
| Area | Choice | Rationale |
|------|--------|-----------|
| Workspace manager | npm workspaces | Zero extra deps, built-in, sufficient for hackathon scale |
| Test config | Single `vitest.workspace.ts` at root + per-workspace `vitest.config.ts` | `npm test` at root runs everything; per-workspace still works in CI |
| Dev launch | `concurrently` in root dev script | One command starts backend + dashboard + bot; watch mode on all three |
| Env files | Root `.env.example` (sectioned) + separate `dashboard/.env.example` | Vite only reads from its own project root; `VITE_` vars never share a file with secrets |

## Dev Scripts
- `npm run dev` — starts backend (tsx watch), dashboard (vite HMR), bot (tsx watch) via concurrently
- `npm test` — runs vitest across all workspaces
- `npm run dev -w backend` / `-w dashboard` / `-w bot` — per-workspace dev

## Git Setup
- Repo: `https://github.com/Mahimrio/Techathon2026-Team_Prognosis` (public)
- Initial commit: `chore: scaffold monorepo structure` (38 files)
- Branch: `main`

## Dummy Data Constraint
Only two records for personal data:
```ts
{ name: "Nafisa Rahman", email: "nafisa.rahman@yahoo.com", phone: "+8801812345678" }
{ name: "Tanvir Hossain", email: "tanvir.hossain@yahoo.com", phone: "+8801912345678" }
```

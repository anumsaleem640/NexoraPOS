# NexoraPOS

Unified headless Point-of-Sale and e-commerce platform.

## Overview
NexoraPOS powers an Admin Dashboard, Customer Storefront, and Native Mobile Application through one centralized Next.js backend API.

```text
Admin SPA ────────┐
Storefront ───────┼──> NexoraPOS Backend API ──> data.enc
Mobile App ───────┘
```

## Repository
- `backend/` — Next.js App Router API
- `admin/` — React + Vite admin SPA
- `website/` — Next.js customer storefront
- `mobile/` — React Native CLI application

## Core Constraint
NexoraPOS uses no database. Persistent state is stored in encrypted `data.enc`.

## Required Environment
`ENCRYPTION_KEY=<32-byte-or-longer-secret>`

Never commit secrets.

## Development
```bash
cd backend && npm install && npm run dev
cd admin && npm install && npm run dev
cd website && npm install && npm run dev
cd mobile && npm install
```

## Documentation Order
1. README.md
2. AGENTS.md
3. PRD.md
4. ARCHITECTURE.md
5. TECH_STACK.md
6. API.md
7. DATABASE.md
8. UI_GUIDELINES.md
9. TASKS.md
10. TESTING.md

## Important Rules
Do not add a database, cloud persistence service, prohibited UI library, Expo, or direct frontend access to `data.enc`. Do not duplicate backend business logic or commit secrets.

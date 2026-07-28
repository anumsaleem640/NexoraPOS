# Product Requirements Document (PRD)

## Project Name
NexoraPOS

## Version
1.0.0 — Production Blueprint

## Document Role
This document is the Single Source of Truth (SSOT) for product requirements, system boundaries, non-negotiable constraints, and high-level behavior.

## 1. Product Overview
NexoraPOS is a unified, headless point-of-sale and e-commerce ecosystem powered by one centralized backend API and three client applications:
- Admin Dashboard
- Customer Storefront
- Native Mobile Application

The backend is authoritative for authentication, authorization, users, products, categories, inventory, orders, customers, settings, and persistent state.

## 2. Core Architecture
- Backend: Next.js App Router API using TypeScript and Node.js.
- Admin: React + Vite client-side SPA.
- Website: standalone Next.js storefront using SSR/SSG/hybrid rendering.
- Mobile: React Native CLI without Expo.
- Persistence: one encrypted server-side `data.enc` file.
- API: versioned under `/api/v1/...`.

## 3. Non-Negotiable Rules
### Unified Backend
All clients communicate exclusively with the centralized backend API. Frontends never access the persistence layer directly.

### Zero-Database Persistence
No SQL, NoSQL, SQLite, Redis, Firebase, Supabase, or external database is permitted. Persistent state is stored in `data.enc`.

### Cryptographic Isolation
Use Node.js `crypto` with AES-256-CBC. Load the key from `process.env.ENCRYPTION_KEY`. Hard-fail startup if the key is missing or shorter than 32 bytes. Generate a cryptographically secure random IV for every encryption operation.

### Persistence Safety
The persistence engine must provide atomic writes, mutex/file-lock protection, corruption detection, schema validation, safe recovery, and encrypted backups where applicable.

### Admin Constraints
Use React + Vite + TypeScript. No external UI component libraries. Prefer CSS Modules.

### Storefront
Use Next.js with SSR/SSG/hybrid rendering, SEO metadata, structured data where applicable, responsive design, and accessible HTML.

### Mobile
Use React Native CLI with native iOS/Android builds. Expo is not permitted.

## 4. Monorepo
```text
nexorapos/
├── backend/
├── admin/
├── website/
├── mobile/
├── README.md
├── PRD.md
├── AGENTS.md
├── ARCHITECTURE.md
├── TECH_STACK.md
├── UI_GUIDELINES.md
├── API.md
├── DATABASE.md
├── TESTING.md
├── TASKS.md
├── TODO.md
├── ROADMAP.md
├── DECISIONS.md
└── CHANGELOG.md
```

## 5. Domain Modules
- Authentication
- Authorization
- Users
- Products
- Categories
- Inventory
- Orders
- Customers
- Settings

## 6. Business Logic
Authoritative business logic lives only in the backend. The backend owns inventory availability, order totals, taxes, discounts, permissions, and order status transitions.

## 7. API
All public endpoints use `/api/v1/...`. Breaking changes require a new API version.

Standard success:
```json
{"success":true,"data":{}}
```

Standard error:
```json
{"success":false,"error":{"code":"RESOURCE_NOT_FOUND","message":"The requested resource was not found."}}
```

## 8. Security
Validate all API input. Authenticate and authorize protected operations server-side. Never expose encryption keys, secrets, internal filesystem paths, or sensitive authentication data.

## 9. Non-Functional Requirements
The system must be performant, reliable, maintainable, and structured so persistence can later be replaced without rewriting clients.

## 10. Definition of Done
A feature is complete only when requirements, implementation, validation, authorization, persistence, tests, documentation, and applicable client UI are complete, with no prohibited technology introduced.

## 11. Success Criteria
NexoraPOS 1.0 is production-ready when all clients use the centralized API, no frontend accesses `data.enc`, encryption and authorization are enforced, inventory and orders remain consistent, critical tests pass, and documentation matches implementation.

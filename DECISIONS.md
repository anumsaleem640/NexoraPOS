# NexoraPOS Architecture Decision Records

## ADR-001 — Centralized Backend
Status: Accepted.
Use one centralized Next.js backend API for all clients to provide one source of truth and consistent business logic.

## ADR-002 — File-Based Persistence
Status: Accepted.
Version 1.0 uses one encrypted `data.enc` file because zero-database persistence is an explicit requirement. This requires atomic writes, concurrency control, corruption handling, backups, and persistent filesystem storage.

## ADR-003 — AES-256-CBC
Status: Accepted.
Use AES-256-CBC because it is explicitly required by the product specification. The implementation must carefully manage keys, IVs, and integrity validation.

## ADR-004 — React + Vite Admin
Status: Accepted.
The admin is a dedicated client-side React SPA built with Vite.

## ADR-005 — No External UI Component Library
Status: Accepted.
The Admin Dashboard uses internally developed UI components.

## ADR-006 — React Native CLI
Status: Accepted.
The mobile application uses React Native CLI without Expo for native build control.

## ADR-007 — Versioned API
Status: Accepted.
All public API routes begin with `/api/v1`. Breaking changes require a new version.

## ADR-008 — Backend as Business Authority
Status: Accepted.
The backend is the sole authority for business rules. Client-side calculations are presentation-only.

## ADR-009 — Repository Abstraction
Status: Accepted.
Persistence is isolated behind repositories so storage can change without rewriting clients or business logic.

## ADR-010 — Persistent Production Storage
Status: Accepted.
Production requires persistent filesystem storage for `data.enc`. Ephemeral deployment is not acceptable without a persistent volume.

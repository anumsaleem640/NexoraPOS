# NexoraPOS Architecture

## Overview
NexoraPOS uses a centralized headless architecture.

```text
Admin SPA ────────┐
Storefront ───────┼──> Backend API ──> Persistence
Mobile ───────────┘
```

## Backend
The backend owns API routing, authentication, authorization, validation, business logic, persistence, and encryption.

Suggested structure:
```text
backend/
├── app/api/v1/
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── inventory/
│   ├── orders/
│   ├── customers/
│   └── settings/
└── lib/
    ├── db.ts
    ├── crypto.ts
    ├── auth.ts
    ├── mutex.ts
    ├── validation.ts
    └── errors.ts
```

## Layers
- API Layer: HTTP, auth, authorization, validation, responses.
- Service Layer: business rules and domain workflows.
- Repository Layer: CRUD and persistence access.
- Persistence Layer: serialization, encryption, file access, atomic writes.

## Data Flow
Client → API → Authentication → Authorization → Validation → Service → Repository → Serialize → Encrypt → Atomic Write → Response.

## Client Responsibilities
Clients handle presentation, interaction, local UI state, forms, API communication, and safe caching. They are not authoritative for business state.

## Persistence
`data.enc` is encrypted server-side and accessed only through the persistence abstraction.

## Concurrency
All writes pass through a centralized mutex. Concurrent writes must not corrupt state.

## Authentication
Authentication is centralized in the backend. Protected requests are validated server-side.

## Deployment
Production requires persistent filesystem storage. Ephemeral filesystem deployment is not acceptable without configured persistent storage.

## Future Migration
Repository abstractions allow future migration to another persistence engine without rewriting clients or changing API contracts.

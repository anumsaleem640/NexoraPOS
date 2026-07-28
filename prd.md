# Product Requirements Document (PRD)
## Project Name: NexoraPOS
## Version: 1.0.0 (Production Blueprint)

---

## 1. System Architecture & Core Constraints

NexoraPOS is a headless, unified point-of-sale and e-commerce ecosystem. It utilizes a single central backend engine to feed three distinct frontend platforms. 

### 1.1 Non-Negotiable Engineering Rules
*   **Unified Backend:** Powered exclusively by Next.js API Routes using the **App Router** framework. All client applications communicate with this singular API layer.
*   **Zero-Database Persistence:** The system must not connect to any SQL, NoSQL, or external cloud database. All state data (users, access tokens, stock control, order slips, global settings) is persisted in a single, local, server-side binary file named `data.enc`.
*   **Cryptographic Isolation:** Data encryption and decryption happen strictly on the server side using the built-in Node.js `crypto` module (**AES-256-CBC**). The encryption key must be loaded dynamically via `process.env.ENCRYPTION_KEY`. The system must hard-crash on startup if this key is missing or under 32 bytes.
*   **Admin Dashboard Constraints:** Built as a pure client-side vanilla React Single Page Application (SPA) compiled via Vite. **No external UI component libraries (e.g., Material UI, Ant Design, Shadcn) are permitted.** All styling must be written using raw CSS Modules or Styled Components.
*   **Customer Storefront Web:** A standalone Next.js app running alongside the API layer, leveraging Hybrid SSR/SSG rendering architectures for ultra-high performance SEO execution.
*   **Mobile App Execution:** A native React Native CLI compilation target utilizing explicit native runtime bindings (no Expo wrappers) that interacts directly with the unified Next.js API layer.

---

## 2. Directory & Monorepo Topology

The workspace is organized as a clean, structured monorepo framework:

```text
nexorapos/
├── backend/                  # Unified Next.js Server Core (App Router)
│   ├── app/
│   │   └── api/              # Strictly versioned API endpoints (/api/v1/...)
│   └── lib/
│       ├── db.ts             # Cryptographic file system engine & Mutex lock
│       └── auth.ts           # Token processing & validation subroutines
├── admin/                    # Vanilla React SPA (Vite-backed, CSS Modules)
├── website/                  # Customer Facing Next.js Digital Storefront
├── mobile/                   # React Native CLI Mobile Workspace
└── prd.md                    # Core Single Source of Truth (SSOT)
# NexoraPOS Persistence Specification

## Terminology
NexoraPOS does not use a traditional database. This document describes encrypted file persistence.

Primary file: `data.enc`.

## Storage Rules
Persistent state is stored in one encrypted server-side file. It is never directly accessible by Admin, Website, Mobile, or public HTTP requests.

## Logical Data Model
```json
{
  "users": [],
  "sessions": [],
  "products": [],
  "categories": [],
  "inventory": [],
  "orders": [],
  "customers": [],
  "settings": []
}
```

The schema must be strongly typed and validated.

## Encryption
Use AES-256-CBC with `process.env.ENCRYPTION_KEY`. The key must contain at least 32 bytes. Generate a cryptographically secure random IV for every encryption operation.

## File Envelope
The encrypted file should contain a documented envelope equivalent to:
`MAGIC | VERSION | IV | AUTHENTICATION_METADATA | CIPHERTEXT`

## Atomic Writes
Read → modify in memory → validate → serialize → encrypt → write temporary file → flush/close → atomically replace `data.enc`.

Never overwrite the primary file in place.

## Concurrency
All mutations use a mutex. Only one write may modify persistent state at a time.

## Corruption
If the file cannot be decrypted or validated:
1. Log a safe diagnostic.
2. Do not expose encrypted content.
3. Do not silently overwrite.
4. Fail safely.
5. Follow recovery procedures.

## Backups
Maintain rotating encrypted backups where production policy requires them, e.g. `data.enc.bak.1`.

## Repository Abstraction
Use `ProductRepository`, `InventoryRepository`, `OrderRepository`, `UserRepository`, `CustomerRepository`, and `SettingsRepository` or equivalent interfaces.

## Data Integrity
Invalid state must never become the new primary persisted state.

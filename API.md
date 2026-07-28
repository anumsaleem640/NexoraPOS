# NexoraPOS API Specification

## Base URL
Development: `http://localhost:<PORT>/api/v1`
Production: `https://<backend-domain>/api/v1`

## Response Format
Success:
```json
{"success":true,"data":{}}
```

Error:
```json
{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Invalid request."}}
```

## Authentication
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Users
- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`

## Products
- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

## Categories
- `GET /categories`
- `POST /categories`
- `GET /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

## Inventory
- `GET /inventory`
- `GET /inventory/:productId`
- `POST /inventory/adjustments`

## Orders
- `GET /orders`
- `POST /orders`
- `GET /orders/:id`
- `PATCH /orders/:id`

The backend validates product existence, availability, inventory, prices, taxes, discounts, and totals.

## Customers
- `GET /customers`
- `POST /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `DELETE /customers/:id`

## Settings
- `GET /settings`
- `PATCH /settings`

## HTTP Status Codes
200, 201, 204, 400, 401, 403, 404, 409, 422, 500.

## Authentication Requirements
Protected endpoints require valid authentication. Authorization is evaluated server-side.

## Versioning
Breaking changes require `/api/v2/...`. Do not silently break `/api/v1` clients.

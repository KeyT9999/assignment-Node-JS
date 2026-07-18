# 07_SmartWarehouse — WarePro

## Install and run
```bash
npm install
npm run seed
npm run dev
```
MongoDB transactions used by transfer require a replica set (Atlas already supports this). Server: `http://localhost:9999`.

## Accounts
| Role | Username | Password |
|---|---|---|
| warehouse_manager | manager1 | 123456 |
| stock_keeper | keeper1 | 123456 |
| auditor | auditor1 | 123456 |

## Testing sequence
1. Login manager, keeper and auditor; save each JWT.
2. Manager registers a user; verify keeper gets 403 and manager-role body gets 400.
3. Manager creates a product; repeat SKU for 409; query `GET /products?lowStock=true`.
4. Keeper imports stock, tests capacity 409, exports stock and tests insufficient-stock 409.
5. Manager transfers stock and tests same-warehouse 400/source-stock 409.
6. Manager/auditor query `/reports/stock-summary` and `/reports/transactions` with filters.

Endpoints: `POST /auth/login`, `POST /auth/register`, `GET|POST /products`, `POST /transactions/import`, `POST /transactions/export`, `POST /transactions/transfer`, `GET /reports/stock-summary`, `GET /reports/transactions`.

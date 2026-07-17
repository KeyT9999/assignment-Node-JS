# TranKimThang_foodDelivery

Offline-generated SDN302 MCR backend.

## Run

```bash
npm install
copy .env.example .env
npm start
```

Auth: `POST /auth/register`, `POST /auth/login`. Business APIs: `/orders`. Example roles: admin and customer. Use Bearer JWT for protected routes.

# Client Project Dashboard

Full-stack technical assessment implementation.

## Stack
- React + TypeScript + Vite
- Node.js + Express + TypeScript
- PostgreSQL + Prisma 7
- JWT access token + HttpOnly refresh cookie
- Socket.IO
- Zod
- node-cron

## Local setup
1. Start PostgreSQL:
   `docker compose up -d`
2. `cd backend`
3. `npm install`
4. Copy `.env.example` to `.env`
5. `npx prisma migrate dev --name init`
6. `npm run seed`
7. `npm run dev`
8. In another terminal: `cd frontend && npm install && npm run dev`

Backend: http://localhost:5000
Frontend: http://localhost:5173

## Demo users
- admin@example.com / Password123!
- pm1@example.com / Password123!
- pm2@example.com / Password123!
- dev1@example.com / Password123!
- dev2@example.com / Password123!
- dev3@example.com / Password123!
- dev4@example.com / Password123!

## Architecture
Socket.IO is used because it provides authenticated rooms, reconnection and presence with less custom infrastructure than native WebSocket. Activity is persisted in PostgreSQL before broadcasting, so reconnecting users can fetch the latest permitted events from the database.

node-cron is used for the assessment's overdue scheduler because this is a single-process internal dashboard and the job is lightweight. A queue such as BullMQ would be preferable if multiple workers or durable job execution were required.

Refresh tokens are stored hashed in PostgreSQL and the raw refresh token is stored only in an HttpOnly, Secure-in-production cookie. Access tokens are held in frontend memory rather than localStorage.

Authorization is enforced on the API. Resource queries are constrained by the authenticated user's role and ownership, not just by frontend visibility.

## Known limitations
- Socket presence is process-local; production multi-instance deployments should use a Socket.IO Redis adapter.
- For production, use a managed PostgreSQL service and a WebSocket-capable backend host. The React frontend can be deployed to Vercel.

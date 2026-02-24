# Chatter

A real-time chat application built with React 19, Node.js, Socket.IO, and PostgreSQL.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Real-time | Socket.IO (WebSockets) |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT in httpOnly cookies |
| State | Zustand |

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/chatter"
JWT_SECRET="a-long-random-secret-string-at-least-16-chars"
PORT=3000
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Run database migration

```bash
npm run db:migrate
```

Creates the tables and generates the Prisma client.

### 4. Start development servers

```bash
npm run dev
```

- Express API: `http://localhost:3000`
- Vite dev server: `http://localhost:5173`

Open `http://localhost:5173` in your browser.

## Features

- User registration and login with JWT sessions (httpOnly cookies)
- Public and private chat rooms
- Real-time messages via Socket.IO
- Direct messages between users
- Typing indicators in rooms and DMs
- Message history with cursor-based pagination
- User search for starting DMs

## Verification

1. Register two accounts in separate browser tabs
2. Create a room from account A, join from account B — verify real-time messages appear in both tabs
3. Open a DM from account A to account B — verify messages and typing indicators work
4. Refresh the page — session restores from cookie, messages persist from PostgreSQL

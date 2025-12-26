# Upcora


[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/sahi19484/Upcora/blob/main/LICENSE)

[![Repository size](https://img.shields.io/github/repo-size/sahi19484/Upcora)](https://github.com/sahi19484/Upcora)

AI-powered interactive learning platform that transforms study materials into engaging games. Upcora ingests documents, extracts structured content, and provides interactive, real-time experiences for learners and educators.

Table of contents
- [Why Upcora](#why-upcora)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment variables](#environment-variables)
  - [Install](#install)
  - [Local development](#local-development)
  - [Build & production](#build--production)
  - [Database / Prisma](#database--prisma)
- [Usage examples (API & CLI)](#usage-examples-api--cli)
- [Testing](#testing)
- [Code quality & formatting](#code-quality--formatting)
- [Deployment notes](#deployment-notes)
- [Contributing](#contributing)
- [License & contact](#license--contact)
- [Acknowledgements](#acknowledgements)

---

## Why Upcora
Upcora reduces the manual work involved in creating interactive study experiences by converting common study materials (PDF, DOCX, etc.) into structured question banks and gamified exercises. It is designed for educators, content creators, and edtech teams who want a repeatable pipeline from raw content to interactive learning.

## Key features
- Document ingestion and parsing (PDF, DOCX) using dedicated parsers.
- Content extraction and structuring to generate quizzes and games.
- Real-time multiplayer/interaction using Socket.IO.
- Simple authentication (JWT + bcrypt) and user management scaffolding.
- Database-first schema using Prisma for safe migrations.
- Built with TypeScript, Vite, and React for fast developer feedback loops.

## Technology stack (detected from repository)
- Language: TypeScript
- Frontend: React (Vite)
- Backend: Node.js + Express (server bundle via Vite)
- Real-time: Socket.IO
- ORM / Database: Prisma (@prisma/client) — likely Postgres or another SQL DB via DATABASE_URL
- Styling: Tailwind CSS
- Build tool: Vite (client & server build config present)
- Testing: Vitest
- Lint / Format: Prettier, TypeScript (tsc)
- Other notable libraries: multer (file uploads), pdf-parse, mammoth (DOCX), jszip, jsonwebtoken, bcryptjs

These choices were inferred from package.json, Vite config files, and the presence of a prisma folder.

## Repository layout (top-level)
- client/        — frontend sources (React + Vite)
- server/        — backend/Express sources
- prisma/        — Prisma schema & migrations
- public/        — static assets
- .dockerignore, netlify.toml, vite.config.ts, vite.config.server.ts, tailwind.config.ts
- package.json   — project scripts and dependencies

(If a file or folder above is missing or named differently, please point it out — the README will be updated.)

## Getting started

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- npm (or your preferred package manager)
- A database reachable via DATABASE_URL (Postgres recommended)
- Optional: Docker & docker-compose for containerized development

### Environment variables
Create a `.env` file at project root (copy from `.env.example` if provided). Minimum recommended variables:

```env
NODE_ENV=development
PORT=3000

# Prisma / Database
DATABASE_URL=postgresql://user:password@localhost:5432/upcora?schema=public

# Auth
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d

# Storage (if used)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

Do not commit secrets. Use GitHub Secrets / Vault / cloud secret managers in production.

### Install
Clone and install dependencies:

```bash
git clone https://github.com/sahi19484/Upcora.git
cd Upcora
npm install
```

### Local development
The repository uses Vite for development. The `dev` script runs the Vite dev server (client). If you have a server-side dev flow (server-side Vite config), refer to server/README or the server `dev` scripts (not present in package.json). Basic commands:

- Start dev server:
  ```bash
  npm run dev
  ```

- Type-check:
  ```bash
  npm run typecheck
  ```

### Build & production
Build both client and server bundles (as defined in package.json):

```bash
# build client + server
npm run build

# start the production server (runs built server bundle)
npm start
```

Under the hood:
- `build:client` → `vite build`
- `build:server` → `vite build --config vite.config.server.ts`
- `start` → `node dist/server/node-build.mjs`

### Database / Prisma
Prisma is present as a dependency and there is a prisma/ folder. Typical Prisma commands:

```bash
# generate client
npx prisma generate

# locally apply migrations (development)
npx prisma migrate dev --name init

# deploy migrations (production)
npx prisma migrate deploy
```

If you use seeds:
```bash
# run seed script if configured
npm run seed
```

(Replace the commands above with the project-specific migration/seed scripts if available.)

## Usage examples (API & CLI)

Health check:
```bash
curl -sS http://localhost:3000/health
```

Authenticate (example):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

File upload (DOCX/PDF) example (uses multer on the server):
```bash
curl -F "file=@./example.pdf" http://localhost:3000/api/upload
```

Socket.IO (client-side quick connect)
```js
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");
socket.on("connect", () => console.log("connected:", socket.id));
```

Document the concrete API routes and request/response shapes in a dedicated API.md or generate OpenAPI/Swagger from the server code.

## Testing
Run test suite:
```bash
npm test
# run vitest with watch or single-run flags if desired
```

For coverage and more advanced test flows, add vitest config or GitHub Actions steps to run coverage reporting.

## Code quality & formatting
- Formatting with Prettier:
  ```bash
  npm run format.fix
  ```
- Type checking:
  ```bash
  npm run typecheck
  ```

Add ESLint and pre-commit hooks (husky + lint-staged) if desired.

## Deployment notes
- Client is Vite-built static assets (can be served from Netlify, Vercel, or any static host). A `netlify.toml` exists in the repo for Netlify configuration.
- Server is a Node/Express bundle produced by Vite (`dist/server`). Deploy to any Node hosting (DigitalOcean App Platform, Heroku, AWS ECS, or a container).
- Recommended flow:
  1. Build assets in CI (client + server)
  2. Run Prisma migrations (production)
  3. Start the Node process with `node dist/server/node-build.mjs` or wrap with a process manager.

Example Docker (basic):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
ENV NODE_ENV=production
CMD ["node", "dist/server/node-build.mjs"]
```

## Contributing
Thank you for contributing! Suggested workflow:
1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Install & run tests locally
4. Commit with clear messages: `git commit -m "feat: add X"`
5. Push and open a PR

Please follow conventional commits and include tests for new features. If you want, I can add a `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` to standardize contribution flow.

## License & contact
This project is licensed under the MIT License. See [LICENSE](https://github.com/sahi19484/Upcora/blob/main/LICENSE).

Maintainer: [sahi19484](https://github.com/sahi19484)

For bugs/features: open an issue in this repository.

## Acknowledgements
Upcora pulls together a number of excellent open-source libraries and tools. See package.json for a full list of dependencies.



# Flicklet Community Hub Server

## Setup

1. Install dependencies: `pnpm install`
2. Generate Prisma client: `pnpm generate`
3. Run migrations: `pnpm migrate` (creates `init_community` migration)
4. Seed database: `pnpm seed`
5. Start server: `pnpm dev`

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 4000)

## API Routes

- `GET /health` - Health check endpoint returning `{ status: "ok", db: "connected" }`























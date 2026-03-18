# Catalog Service

Node.js + TypeScript API for the Collector catalog.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express
- **ORM**: TypeORM
- **Database**: PostgreSQL 15

## Environment Variables

| Variable      | Default         | Description             |
|---------------|-----------------|-------------------------|
| `PORT`        | `3000`          | HTTP server port        |
| `DB_HOST`     | `localhost`     | PostgreSQL host         |
| `DB_PORT`     | `5432`          | PostgreSQL port         |
| `DB_USER`     | `collector`     | Database username       |
| `DB_PASSWORD` | `password`      | Database password       |
| `DB_NAME`     | `collector_db`  | Database name           |
| `NODE_ENV`    | —               | Set `production` to disable SQL logging |

## Run Locally

```bash
# 1. Start infra (from monorepo root)
npm run local:up

# 2. Install dependencies (from this directory)
npm install

# 3. Run migrations
npm run migration:run

# 4. Start dev server
npm run dev
```

The service will be available at `http://localhost:3000`.

## Endpoints

| Method | Path      | Description        |
|--------|-----------|--------------------|
| GET    | `/health` | Health check       |

## Migrations

```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate -- src/migration/MigrationName
```

## Entities

### Article
- `id` (uuid, PK)
- `sellerId` (uuid)
- `title` (varchar 255)
- `description` (text)
- `price` (decimal 10,2)
- `status` (enum: EN_ATTENTE_MODERATION, REJETE_AUTO, EN_ATTENTE_ADMIN, REFUSE, PUBLIE)
- `contentCheckStatus` (enum: OK, KO, nullable)
- `contentCheckReasons` (jsonb, nullable)
- `createdAt` (timestamp)
- `publishedAt` (timestamptz, nullable)

### ArticleModeration
- `id` (uuid, PK)
- `articleId` (uuid, FK → articles)
- `adminId` (uuid)
- `decision` (enum: APPROVE, REFUSE)
- `reason` (text, nullable)
- `createdAt` (timestamp)

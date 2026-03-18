# Collector Monorepo

Welcome to the Collector project monorepo.

## Project Structure

```
collector/
├── apps/
│   └── web-app/              # React + Vite + TS + Tailwind
├── services/
│   ├── catalog-service/      # Express API + Prisma + PostgreSQL
│   └── moderation-worker/    # RabbitMQ worker (no HTTP)
├── infra/
│   ├── local/                # Docker Compose (dev environment)
│   │   ├── docker-compose.yml
│   │   ├── keycloak/         # Realm export JSON
│   │   ├── kong/             # Declarative gateway config
│   │   └── postgres/         # Init scripts
│   ├── k8s/                  # Kubernetes manifests (Minikube)
│   └── gitops/               # Kustomize overlays (ArgoCD)
├── .agents/workflows/        # Custom automation workflows
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Project documentation
```

## Commands

Run these commands from the root directory:

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `npm run local:up`         | Start all infra services (Docker Compose)|
| `npm run local:down`       | Stop infra services                      |
| `npm run build`            | Build all apps and services              |
| `npm run lint`             | Run ESLint across all workspaces         |
| `npm run test:unit`        | Run unit tests                           |
| `npm run test:integration` | Run integration tests                    |
| `npm run test:e2e`         | Run end-to-end tests                     |
| `npm run scan`             | Run npm audit and security scans         |

## Local Development Ports

| Service          | Port(s)                      |
|------------------|------------------------------|
| Web App (Vite)   | 5173                         |
| Kong Proxy       | 8000                         |
| Kong Admin       | 8001                         |
| Catalog Service  | 3000                         |
| PostgreSQL       | 5432                         |
| RabbitMQ         | 5672 (AMQP), 15672 (UI)     |
| Keycloak         | 8080                         |
| Grafana          | 3001                         |
| Loki             | 3100                         |
| Prometheus       | 9090                         |

## Quick Start

```bash
# 1. Start infrastructure
npm run local:up

# 2. Wait ~45s for Keycloak to boot, then test
curl http://localhost:8080/realms/collector

# 3. Install catalog-service deps and run migrations
cd services/catalog-service
npm install --legacy-peer-deps
$env:DATABASE_URL="postgresql://collector:password@localhost:5432/collector_db"
npx prisma migrate dev
npm run dev

# 4. Test health endpoint
curl http://localhost:3000/health

# 5. Test APIs (via Kong on :8000)
# Public Endpoint:
curl http://localhost:8000/api/catalog/catalog?page=1&limit=10

# Seller Endpoints:
curl -X POST http://localhost:8000/api/catalog/articles -H "Authorization: Bearer <SELLER_TOKEN>" ...
curl http://localhost:8000/api/catalog/me/articles -H "Authorization: Bearer <SELLER_TOKEN>"

# Admin Moderation Endpoints:
curl http://localhost:8000/api/catalog/admin/articles/pending -H "Authorization: Bearer <ADMIN_TOKEN>"
curl -X POST http://localhost:8000/api/catalog/admin/articles/<uuid>/approve -H "Authorization: Bearer <ADMIN_TOKEN>"
curl -X POST http://localhost:8000/api/catalog/admin/articles/<uuid>/refuse -H "Authorization: Bearer <ADMIN_TOKEN>" -d '{"reason":"Not authentic"}'
```

## Database Schema Isolation

PostgreSQL uses schema-level isolation to avoid conflicts:
- `public` schema → Catalog Service (Prisma migrations)
- `keycloak` schema → Keycloak (auto-managed)

## Documentation

- [Architecture](docs/architecture.md)
- [Authentication (Keycloak)](docs/auth.md)
- [API Gateway (Kong)](docs/gateway.md)
- [CI/CD](docs/ci-cd.md)
- [Events](docs/events.md)
- [Metrics & Observability](docs/metrics.md) (Loki & Prometheus)
- [Security](docs/security.md)
- [Remediation](docs/remediation.md)
- [Expertise & Team](docs/team/expertise.md)
- [Experimentation Bac-à-Sable](docs/research/experimentation.md)
- [Jury Summary (Grade A)](docs/jury_A_grade.md)

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>(<scope>): <subject>`

| Type       | Description                             |
|------------|-----------------------------------------|
| `feat`     | A new feature                           |
| `fix`      | A bug fix                               |
| `docs`     | Documentation only changes              |
| `style`    | Formatting, no code change              |
| `refactor` | Code change, no new feature or fix      |
| `perf`     | Performance improvement                 |
| `test`     | Adding or correcting tests              |
| `chore`    | Build process or tooling changes        |

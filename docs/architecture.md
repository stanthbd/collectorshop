# Architecture Overview

> [!TIP]
> Pour une installation complète à partir de zéro, suivez le **[Guide d'Installation (Setup Guide)](./setup.md)**.

This document outlines the architecture of the Collector project.

## Components

- **Web App** (`apps/web-app`): A React SPA frontend served by Vite, utilizing Tailwind CSS for styling.
  - [http://collector.dev.local/](http://collector.dev.local/) (App) / [http://collector.staging.local/](http://collector.staging.local/)
  - [http://keycloak.dev.local/](http://keycloak.dev.local/) (Auth) / [http://keycloak.staging.local/](http://keycloak.staging.local/)
  - [http://adminer.dev.local/](http://adminer.dev.local/) (DB Admin) / [http://adminer.staging.local/](http://adminer.staging.local/)
  - [http://grafana.dev.local/](http://grafana.dev.local/) (Monitoring) / [http://grafana.staging.local/](http://grafana.staging.local/)
  - [https://argocd.local/](https://argocd.local/) (Argo CD Dashboard)

## Usage
### Start
1. `minikube start`
2. `minikube tunnel` (keep terminal open)
3. Access URLs above.

### Stop
1. `Ctrl+C` in the tunnel terminal.
2. `minikube stop`

- **Catalog Service** (`services/catalog-service`): A Node.js + Express API that manages the central catalog of collectible items. Uses **Prisma** as ORM with PostgreSQL (`public` schema). Includes robust **RabbitMQ reconnection logic** to handle message broker transient failures.
- **Moderation Worker** (`services/moderation-worker`): A background worker built with Node.js that listens to RabbitMQ events.

## Disponibilité & Montée en charge (Scaling)
L'application est conçue pour la haute disponibilité :
- **Scaling Horizontal** : Les overlays Kubernetes (`staging` et `prod`) augmentent automatiquement le nombre de répliques.
  - `dev` : 1 instance.
  - `staging` : 2 instances (`catalog-service`).
  - `prod` : 3 instances (`catalog-service`).
- **Resilience Strategy** : Usage de `Liveness` et `Readiness` probes sur tous les services Dockerisés pour permettre l'auto-healing par Kubernetes.
- **Circuit Breaker** : Le `catalog-service` inclut une logique de reconnexion RabbitMQ robuste pour éviter les crashes en cascade.

## Infrastructure

- **API Gateway (Kong)**: Single entry point for all HTTP traffic. Runs in DB-less declarative mode. Validates JWT tokens via Keycloak's RSA public key. See [gateway.md](./gateway.md).
- **Message Broker (RabbitMQ)**: Facilitates asynchronous communication between the Catalog Service and the Moderation Worker.
- **Database (PostgreSQL)**: Shared PostgreSQL instance with schema isolation:
  - `public` schema → Catalog Service (managed by Prisma migrations)
  - `keycloak` schema → Keycloak (managed automatically by Keycloak)
- **Identity Provider (Keycloak)**: Provides OIDC authentication and role-based access. Realm `collector` with roles `seller` and `admin`. See [auth.md](./auth.md).

## Data Flow

```
Browser → Kong (:8000) → catalog-service (:3000) → PostgreSQL (public schema)
                                ↓
                           RabbitMQ → moderation-worker
```

## Observability

We use the PLG stack:
- **Promtail** collects container logs.
- **Loki** aggregates and indexes logs.
- **Grafana** (:3000): Provides dashboards for visualization (Loki & Metrics).

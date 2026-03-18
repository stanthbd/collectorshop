# Security Practices

This project implements a DevSecOps approach to minimize vulnerabilities.

## Core Principles

- **Network Security**: All public traffic funnels through Kong API Gateway.
- **Authentication**: Keycloak manages JWT tokens and user identities.
- **Dependency Scanning**: Enforced through `npm audit` during the CI pipeline.
- **Security Monitoring**: Prometheus & Loki alerts for identifying brute-force attempts on Keycloak or abnormal API traffic patterns.
- **Environment Parity**: Local testing matches production configurations through Docker Compose profiles.
- **Principle of Least Privilege**: Services access the DB with separated credentials. Worker operates with limited permissions based on role definitions.

## Auth Redirection & DNS Security
To prevent invalid redirects to internal Kubernetes hostnames (e.g., `dev-keycloak`), Keycloak is configured with an explicit `KC_HOSTNAME` and `KC_PROXY: edge` setting. This ensures that even when accessed through a port-forward on `localhost:8080`, the authentication flow remains consistent and secure.

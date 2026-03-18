# Deployment (GitOps)

This directory contains the Kubernetes manifests used by Argo CD (GitOps).

## Structure

- `deploy/argocd/`: Argo CD ApplicationSet / bootstrap manifests
- `deploy/apps/`: Kustomize bases for application components
- `deploy/environments/`: Kustomize overlays per environment (dev/staging/prod)

## Environments

Argo CD is expected to sync one or more overlays from `deploy/environments/*`.

## Secrets

- **Dev/minikube** can use plain `Secret` manifests (non-sensitive defaults).
- **Staging/Prod** should use a secret management solution (e.g. Sealed Secrets, SOPS, External Secrets).


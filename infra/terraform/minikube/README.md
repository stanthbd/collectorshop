# Terraform bootstrap (Minikube)

Installs platform components into a local Minikube cluster:

- `ingress-nginx`
- `argocd`
- `sealed-secrets` (for GitOps-friendly secrets)

## Prereqs

- Minikube running
- `kubectl` configured to point to Minikube
- Terraform installed

## Apply

```bash
cd infra/terraform/minikube
terraform init
terraform apply
```

After install, apply the Argo CD bootstrap manifest:

```bash
kubectl apply -n argocd -f ../../../../deploy/argocd/applicationset.yaml
```


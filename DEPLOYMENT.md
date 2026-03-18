# Minikube + Argo CD + GHCR (GitOps)

## 1) Bootstrap cluster add-ons (Terraform)

```powershell
cd infra/terraform/minikube
terraform init
terraform apply
```

This installs **Sealed Secrets** (and creates `sealed-secrets` namespace).  
Your cluster already has `argocd` and `ingress-nginx` namespaces running; this repo does **not** try to reinstall them to avoid conflicts.

## 2) Argo CD: grant repo access (if private repo)

If `https://github.com/stanthbd/collectorshop` is private, Argo CD needs credentials:

1. Copy `deploy/argocd/repository-secret.example.yaml` to `deploy/argocd/repository-secret.yaml`
2. Fill `username` + `password` (GitHub PAT with at least read access to the repo)
3. Apply:

```powershell
kubectl apply -f deploy/argocd/repository-secret.yaml
```

## 3) Argo CD bootstrap (ApplicationSet)

```powershell
kubectl apply -n argocd -f deploy/argocd/applicationset.yaml
```

Then check:

```powershell
kubectl get applications -n argocd
kubectl get pods -n collectorshop
```

## 4) Local ingress host

Add a hosts entry pointing to your Minikube IP:

```powershell
minikube ip
```

Add to `C:\Windows\System32\drivers\etc\hosts`:

```
<MINIKUBE_IP> collectorshop.local
```

Open `http://collectorshop.local/`.


.PHONY: help tf-init tf-plan tf-apply argocd-bootstrap argocd-repo-secret \
	build-images deploy-restart status urls argocd-password \
	rabbitmq-portforward argocd-portforward

# Windows-friendly Makefile: uses PowerShell for all commands.
# Prereqs: minikube, kubectl, terraform, docker, (GNU) make.

POWERSHELL := powershell -NoProfile -ExecutionPolicy Bypass -Command

TF_DIR := infra/terraform/minikube
ARGO_NS := argocd
APP_NS := collectorshop

help:
	@$(POWERSHELL) "Write-Host 'Targets:'; \
	Write-Host '  make tf-init            - terraform init'; \
	Write-Host '  make tf-plan            - terraform plan'; \
	Write-Host '  make tf-apply           - terraform apply'; \
	Write-Host '  make argocd-bootstrap   - apply deploy/argocd/applicationset.yaml'; \
	Write-Host '  make argocd-repo-secret - apply ArgoCD repo secret (set REPO_SECRET_FILE)'; \
	Write-Host '  make build-images       - build images into minikube docker'; \
	Write-Host '  make deploy-restart     - restart app deployments in $(APP_NS)'; \
	Write-Host '  make status             - show pods/services/ingress'; \
	Write-Host '  make urls               - show URLs + minikube ip'; \
	Write-Host '  make argocd-password    - print ArgoCD initial admin password'; \
	Write-Host '  make rabbitmq-portforward - port-forward RabbitMQ UI to localhost:15672'; \
	Write-Host '  make argocd-portforward   - port-forward ArgoCD UI to localhost:8080'; \
	Write-Host ''; \
	Write-Host 'Env vars:'; \
	Write-Host '  REPO_SECRET_FILE=deploy/argocd/repository-secret.yaml (optional, for private repo)'; \
	Write-Host '  MINIKUBE_PROFILE=minikube (optional)'; \
	Write-Host ''"

tf-init:
	@$(POWERSHELL) "cd '$(TF_DIR)'; terraform init"

tf-plan:
	@$(POWERSHELL) "cd '$(TF_DIR)'; terraform plan"

tf-apply:
	@$(POWERSHELL) "cd '$(TF_DIR)'; terraform apply"

argocd-bootstrap:
	@$(POWERSHELL) "kubectl apply -n '$(ARGO_NS)' -f 'deploy/argocd/applicationset.yaml'"

# Apply Argo CD repo credentials (for private repos).
# Usage: make argocd-repo-secret REPO_SECRET_FILE=deploy/argocd/repository-secret.yaml
argocd-repo-secret:
	@$(POWERSHELL) "if (-not $$env:REPO_SECRET_FILE) { throw 'REPO_SECRET_FILE is required'; }; \
	kubectl apply -f $$env:REPO_SECRET_FILE"

# Build images directly into Minikube Docker daemon (no registry pull needed).
build-images:
	@$(POWERSHELL) "$$profile = $$env:MINIKUBE_PROFILE; if (-not $$profile) { $$profile = 'minikube' }; \
	& minikube -p $$profile docker-env --shell powershell | Invoke-Expression; \
	docker build -t ghcr.io/stanthbd/collectorshop/catalog-service:dev services/catalog-service; \
	docker build -t ghcr.io/stanthbd/collectorshop/moderation-worker:dev services/moderation-worker; \
	docker build -t ghcr.io/stanthbd/collectorshop/web-app:dev apps/web-app"

deploy-restart:
	@$(POWERSHELL) "kubectl rollout restart -n '$(APP_NS)' deploy/catalog-service deploy/moderation-worker deploy/web-app; \
	kubectl get pods -n '$(APP_NS)'"

status:
	@$(POWERSHELL) "kubectl get applications -n '$(ARGO_NS)'; \
	kubectl get pods -n '$(APP_NS)'; \
	kubectl get svc -n '$(APP_NS)'; \
	kubectl get ingress -n '$(APP_NS)' -o wide"

urls:
	@$(POWERSHELL) "$$ip = (minikube ip); \
	Write-Host ('Minikube IP: ' + $$ip); \
	Write-Host 'App:'; \
	Write-Host '  http://collectorshop.local/'; \
	Write-Host '  http://collectorshop.local/api'; \
	Write-Host 'Argo CD:'; \
	Write-Host '  http://argocd.local/'; \
	Write-Host ''; \
	Write-Host 'Reminder: add hosts entries:'; \
	Write-Host ('  ' + $$ip + ' collectorshop.local'); \
	Write-Host ('  ' + $$ip + ' argocd.local')"

argocd-password:
	@$(POWERSHELL) "$$b64 = kubectl -n '$(ARGO_NS)' get secret argocd-initial-admin-secret -o jsonpath='{.data.password}'; \
	[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($$b64))"

rabbitmq-portforward:
	@$(POWERSHELL) "kubectl -n '$(APP_NS)' port-forward svc/rabbitmq 15672:15672"

argocd-portforward:
	@$(POWERSHELL) "kubectl -n '$(ARGO_NS)' port-forward svc/argocd-server 8080:80"


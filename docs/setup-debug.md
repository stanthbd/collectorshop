# 🔧 Debug & Diagnostic - Collector Platform

Ce document regroupe toutes les commandes pour diagnostiquer et dépanner votre cluster **Minikube**.

---

## 🧭 1. État de Santé du Cluster
Vérifiez d'abord que le socle (Minikube) est solide.

```powershell
# État de Minikube
minikube status

# Infos et nœuds du cluster
kubectl cluster-info
kubectl get nodes

# Ressources consommées (CPU/RAM)
kubectl top nodes
```

---

## 📦 2. Gestion des Pods
Vérifiez ce qui tourne (ou ce qui crash).

```powershell
# Liste globale (Tous les namespaces)
kubectl get pods -A

# Focus sur le projet (DEV)
kubectl get pods -n collector-dev
kubectl get pods -n collector-dev --field-selector=status.phase!=Running

# Détails complets d'un pod (Cherchez la section "Events" à la fin)
kubectl describe pod <nom-du-pod> -n collector-dev
```

---

## 📡 3. Les Événements (Le Radar 🛰️)
Si un pod ne démarre pas, la réponse est souvent ici (ex: `FailedScheduling`, `BackOff`).

```powershell
# Voir les dernières erreurs du namespace (Triées par temps)
kubectl get events -n collector-dev --sort-by='.lastTimestamp'
```

---

## 📜 4. Consultation des Logs
Pour comprendre les erreurs applicatives.

```powershell
# Logs d'un pod spécifique
kubectl logs <nom-du-pod> -n collector-dev

# Logs filtrés par application
kubectl logs -l app=<nom-application> -n collector-dev --tail=100

# Logs en temps réel (Streaming)
kubectl logs -f -l app=<nom-application> -n collector-dev

# Logs de l'instance PRÉCÉDENTE (Si le pod a crashé et redémarré)
kubectl logs -l app=<nom-application> -n collector-dev --previous
```

---

## 🌐 5. Réseau : Services & Ingress
Vérifiez que les "portes" sont bien ouvertes.

```powershell
# Lister Services et Ingress (Global)
kubectl get svc,ingress -A

# Détails d'un Service spécifique (Vérifiez la ligne "Endpoints")
kubectl describe svc <nom-service> -n collector-dev

# Voir les routes Ingress (URLs externes)
kubectl get ingress -n collector-dev
```

---

## 🚀 6. Argo CD & Accès
Le cerveau du déploiement GitOps.

```powershell
# Vérifier les pods et applications Argo
kubectl get pods -n argocd
kubectl get application -n argocd

# 🔑 Récupérer le mot de passe 'admin' (PowerShell)
kubectl -n argocd get secret argocd-initial-admin-secret `
-o jsonpath="{.data.password}" `
| % { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

---

## ⚡ 7. Diagnostics Spécifiques (Senior)

### A. Diagnostic RabbitMQ 🐰
```powershell
# Vérifier l'état interne, la mémoire et les alarmes (Memory High Watermark)
kubectl exec -it -n collector-dev dev-rabbitmq-0 -- rabbitmqctl status
```

### B. Accès Direct (Port-Forwarding 🚪)
```powershell
# Accéder à la DB en direct (Tunnel local sur 5432)
kubectl port-forward svc/dev-catalog-db 5432:5432 -n collector-dev

# Accéder au RabbitMQ Manager en direct (port 15672)
kubectl port-forward svc/dev-rabbitmq 15672:15672 -n collector-dev
```

---

## 📦 8. Namespaces & Images Docker
```powershell
# Lister les namespaces
kubectl get namespaces

# Voir l'image utilisée par un pod
kubectl get pod <nom-pod> -n collector-dev -o jsonpath='{.spec.containers[*].image}'

# Vérifier que le secret GHCR existe bien dans le namespace
kubectl get secret ghcr-login-secret -n collector-dev
```

---

## 🔐 9. Gestion des Secrets
```powershell
# Lister tous les secrets
kubectl get secrets -A

# Voir les détails d'un secret
kubectl describe secret <nom-secret> -n collector-dev
```

---

## 🔄 10. Actions de Récupération
```powershell
# Relancer proprement un déploiement
kubectl rollout restart deployment <nom-deployment> -n collector-dev

# Forcer la suppression d'un pod coincé
kubectl delete pod <nom-pod> -n collector-dev --force --grace-period=0

# Supprimer TOUT le contenu du projet (Reset local)
kubectl delete all --all -n collector-dev
```

---

## ⚠️ FAQ : Erreurs Classiques

| Erreur | Cause probable | Solution |
| :--- | :--- | :--- |
| `ImagePullBackOff` | Secret GHCR manquant ou Token expiré | Vérifiez `kubectl get secret ghcr-login-secret` |
| `CrashLoopBackOff` | Erreur de code / BDD non prête | Regardez `kubectl logs --previous` |
| `503 Unavailable` | Tunnel Minikube coupé ou Hosts mal rempli | Relancez `minikube tunnel` |
| `Connection Refused` | Le service cible n'est pas encore prêt | Attendre 2 min (RMQ et DB sont lents) |

---

## 📊 Résumé Rapide
```powershell
kubectl get pods -A
kubectl get svc -A
kubectl get events -n collector-dev
watch kubectl get pods -n collector-dev
```

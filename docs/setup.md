# 🚀 Guide d'Installation Complet (A à Z)

Ce guide permet de réinstaller l'intégralité de la plateforme sur un cluster Minikube local.

## 1. Pré-requis
- **Git** installé
- **Repo cloné**
- **Minikube** & **Kubectl** installés.
- **GitHub PAT** (Personal Access Token) avec les droits `repo` et `read:packages`.
- **Fichier Hosts** configuré (`C:\Windows\System32\drivers\etc\hosts`) :
```text
  # Global
127.0.0.1 argocd.local

  # Dev
127.0.0.1 collector.dev.local
127.0.0.1 keycloak.dev.local
127.0.0.1 adminer.dev.local
127.0.0.1 grafana.dev.local
127.0.0.1 rabbitmq.dev.local

  # Staging
127.0.0.1 collector.staging.local
127.0.0.1 keycloak.staging.local
127.0.0.1 adminer.staging.local
127.0.0.1 grafana.staging.local
127.0.0.1 rabbitmq.staging.local

  # Prod
127.0.0.1 collector.prod.local
127.0.0.1 keycloak.prod.local
127.0.0.1 adminer.prod.local
127.0.0.1 grafana.prod.local
127.0.0.1 rabbitmq.prod.local
```

---

## 🟢 Étape A : Démarrer le projet de zéro (A à Z)

### 1. Lancer le Cluster Kubernetes
Allouez suffisamment de ressources pour faire tourner tous les services :
```powershell
minikube start --addons=ingress
```

# Installation d'Argo CD (GitOps Mode)
L'installation est maintenant entièrement déclarative. Une seule commande installe Argo CD et applique les correctifs de stabilité (limites de ressources).

```powershell
# Déploiement d'Argo CD (Install + Patches)
kubectl apply -k infra/argocd/overlays/dev
```

### 3. Configurer les Accès (Secrets)

### A. Accès au Dépôt Git (Argo CD)
Remplacez `<VOTRE_TOKEN>` par votre PAT GitHub :
```powershell
@"
apiVersion: v1
kind: Secret
metadata:
  name: collector-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  url: https://github.com/StanislasTHBD/collector.git
  password: <VOTRE_TOKEN>
  username: StanislasTHBD
"@ | kubectl apply -f -
```

### B. Accès aux Images (GHCR)
Kubernetes a besoin de ce secret pour télécharger les images des microservices :
```powershell
# Création des namespaces
kubectl create namespace collector-dev
kubectl create namespace collector-staging
kubectl create namespace collector-prod

# Création du secret de pull (À faire pour CHAQUE namespace)
foreach ($ns in "collector-dev", "collector-staging", "collector-prod") {
  kubectl create secret docker-registry ghcr-login-secret `
    --docker-server=ghcr.io `
    --docker-username=StanislasTHBD `
    --docker-password=<VOTRE_TOKEN> `
    --namespace=$ns
}
```

### 4. Déployer les réglages réseaux (Ingress)
```powershell
kubectl apply -k infra/k8s/management
```

### 5. Ouvrir l'accès (Le Tunnel)
Ouvrez un **nouveau terminal** et laissez cette commande tourner :
```powershell
minikube tunnel
```

---

## 🔴 Étape B : Arrêter le projet

### 1. Quitter le Tunnel
Faites `Ctrl+C` dans le terminal où tourne le tunnel.

### 2. Mettre en pause le cluster
Si vous voulez libérer les ressources de votre PC tout en gardant vos données :
```powershell
minikube stop
```

### 3. Tout supprimer (Reset Total)
Si vous voulez repartir sur une base 100% propre la prochaine fois :
```powershell
minikube delete
```

---

## 🔍 URLs Utiles (Uniquement DEV)

Une fois le tunnel démarré, accédez aux services ici :

| Service | URL (Dev) | URL (Staging) | URL (Prod) | Identifiants |
| :--- | :--- | :--- | :--- | :--- |
| **Argo CD** | [https://argocd.local](https://argocd.local) | - | - | `admin` / (initial secret) |
| **Application** | [.dev.local](http://collector.dev.local) | [.staging.local](http://collector.staging.local) | [.prod.local](http://collector.prod.local) | - |
| **Auth** | [.dev.local](http://keycloak.dev.local) | [.staging.local](http://keycloak.staging.local) | [.prod.local](http://keycloak.prod.local) | `admin` / `admin` |
| **RabbitMQ** | [.dev.local](http://rabbitmq.dev.local) | [.staging.local](http://rabbitmq.staging.local) | [.prod.local](http://rabbitmq.prod.local) | `collector` / `password` |
| **Adminer** | [.dev.local](http://adminer.dev.local) | [.staging.local](http://adminer.staging.local) | [.prod.local](http://adminer.prod.local) | - |

# Récupérer le mot de passe ArgoCD
kubectl -n argocd get secret argocd-initial-admin-secret `
-o jsonpath="{.data.password}" `
| % { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

---

> [!TIP]
> **Problème de connexion ?** 
> Si un service affiche `503` ou `Connection Refused`, attendez 2-3 minutes. Les bases de données et RabbitMQ sont les plus longs à démarrer.

# Protocole d'Expérimentation (Bac à Sable)

## Objectifs de l'expérimentation
L'objectif de ce POC était de valider la faisabilité technique d'une architecture micro-services résiliente et observable, déployable de manière reproductible sur des environnements Cloud (AWS) ou locaux (Minikube).

## Technologies et Plateformes Testées
- **Orchestration** : Kubernetes (Minikube pour le bac à sable local).
- **Infrastructure as Code (IaC)** : Terraform (avec modules SOLID).
- **Distribution de trafic** : API Gateway (Kong) / Ingress Nginx.
- **Observability Stack** : PLG Stack (Promtail, Loki, Grafana).
- **Communication Interservices** : RabbitMQ (Asynchrone).

## Interactions Validées
1. **Flux Trafic** : Ingress -> Kong -> Catalog Service -> DB.
2. **Flux Événementiel** : Catalog Service -> RabbitMQ -> Moderation Worker.
3. **Flux Observabilité** : Container Logs -> Promtail -> Loki -> Grafana.

## Difficultés Rencontrées et Solutions
- **Détection des logs dans Minikube** : Les chemins `/var/log/pods` varient selon le driver. 
  - *Solution* : Implémentation d'une règle de relabeling dynamic dans Promtail utilisant les métadonnées de l'API Kubernetes.
- **DRY en environnement Multi-Overlay** : Duplication massive de la configuration Promtail dans les overlays Kustomize.
  - *Solution* : Migration vers une variable d'environnement `${LOKI_HOST}` portée par le pod et patchée par overlay, permettant de garder un `resources.yaml` de base unique.
- **Persistance des données** : Perte des données Loki au redémarrage des pods.
  - *Solution* : Configuration d'un stockage filesystem local (PVC) pour Loki dans le cluster.

## Résultats de l'adoption
L'adoption de Kubernetes et Terraform est validée. Le passage du bac à sable local (Minikube) à la production (EKS) est facilité par l'usage des `overlays` Kustomize et des `modules` Terraform SOLID.

# Dossier de Synthèse - Grade A (Jury)

Ce document récapitule les preuves apportées pour valider l'expertise DevOps sur le projet Collector.

## 1. Expertise Technique & POC
- **Architecture Micro-services** : [architecture.md](./architecture.md) (Découpage, Communication RabbitMQ).
- **Expérimentation Bac à Sable** : [experimentation.md](./research/experimentation.md) (Validation des choix techniques).
- **Hosting & Orchestration** : [setup.md](./setup.md) (Utilisation de Minikube/Kubernetes et Terraform).

## 2. Livraison Continue & Scaling
- **Pipeline CI/CD** : [ci-cd.md](./ci-cd.md) (Schéma et conformité SecDevOps).
- **Disponibilité & Scaling** : Démontré par les répliques différentiées dans [infra/k8s/overlays/prod/kustomization.yaml](../infra/k8s/overlays/prod/kustomization.yaml).

## 3. Assurance Qualité & Sécurité
- **Indicateurs Qualité** : [metrics.md](./metrics.md) (4 indicateurs définis utilisant Loki et **Prometheus**).
- **Processus de Test** : [tests.md](./tests.md) (Tests unitaires, intégration, sécurité).
- **Remédiation & Sécurité** : [remediation.md](./remediation.md) et [security.md](./security.md) (Plan de gestion des risques).

## 4. Gestion d'Équipe
- **Compétences & Formation** : [expertise.md](./team/expertise.md) (Identification des manques et plan d'action).

---
*Note : Toutes les configurations techniques (Kubernetes, Terraform) respectent les principes **SOLID**, **KISS**, **DRY** et **SAFE**.*

# Indicateurs de Qualité Logicielle (KPIs)

Nous suivons 4 indicateurs clés alignés sur les objectifs de performance et fiabilité.

| Indicateur | Cible | Objectif Qualité | Mesure |
| :--- | :--- | :--- | :--- |
| **Taux d'erreur API** | < 1% | **Fiabilité** | Grafana (Loki parser `level="error"`) |
| **Temps de réponse (p95)** | < 300ms | **Performance** | Kong Logs / Metrics |
| **Disponibilité (Up-time)** | 99.9% | **Disponibilité** | Kubernetes Liveness Probes |
| **Dette technique** | < 5% | **Maintenabilité** | SonarQube / ESLint report |

## Observabilité : Stack PLGP
Nous utilisons la stack **Promtail / Loki / Grafana / Prometheus (PLGP)** pour centraliser les logs et les métriques :
- **Loki** : Agrégation des logs (LogQL).
- **Prometheus** : Collecte des métriques via scraping des annotations `prometheus.io/scrape`.
- **Grafana** : Visualisation unifiée via les deux datasources.

### Accès aux tableaux de bord (Local)
1. `minikube tunnel` (pour le Service de type NodePort/LoadBalancer)
2. Visitez [http://grafana.dev.local](http://grafana.dev.local)
3. Dashboard : "Collector Business Metrics" (Provisionné automatiquement via Kustomize).

# Remediation Process

Guidelines for addressing system incidents:

## Process
1. **Identify**: Monitor Grafana dashboards (Loki & Prometheus) for unexpected spikes in errors or resource consumption.
2. **Contain**: If a service like the Moderation Worker fails repeatedly, gracefully scale it down to prevent RabbitMQ starvation.
3. **Investigate**: Trace requests via Kong logs to pinpoint the fault location.
4. **Resolve**: Apply fixes, roll forward using the CI pipeline.
5. **Review**: Write post-mortems for major outages in this directory.

## Predefined Playbooks
- *DB Connection Issues*: Restart Postgres pod, check Keycloak connection strings.
- *Message Queue Backup*: Add more Moderation Worker replicas if Prometheus shows a spike in pending messages or RabbitMQ memory usage.
- *Resource Exhaustion*: If Prometheus metrics show pods nearing CPU/Memory limits, trigger HPA or manual scaling.
- *RabbitMQ Connection Lost*: The `catalog-service` now features automatic reconnection. If errors persist, check the `rabbitmq` pod logs.
- *Service Access Issues*: Use the following commands in separate terminals to re-establish access:
  - `kubectl port-forward svc/dev-kong -n collector-dev 8000:8000 --address 0.0.0.0`
  - `kubectl port-forward svc/dev-keycloak -n collector-dev 8080:8080 --address 0.0.0.0`
  - `kubectl port-forward svc/dev-grafana -n collector-dev 3000:3000 --address 0.0.0.0`
  - `kubectl port-forward svc/argocd-server -n argocd 8443:443 --address 0.0.0.0`

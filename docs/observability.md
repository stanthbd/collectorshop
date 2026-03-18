# Observability Stack 📊

This project utilizes a modern, lightweight observability stack perfectly suited for containerized environments: **Pino**, **Promtail**, **Loki**, and **Grafana**. 

You can access the main Grafana interface by navigating to [http://localhost:3000](http://localhost:3000) using the default credentials (`admin` / `admin`).

---

## 🏗 Architecture

1. **Pino**: High-performance JSON logger. Both `catalog-service` and `moderation-worker` emit structured `stdout`/`stderr` JSON logs containing context such as `articleId`, `service`, `level`, and `userId`.
2. **Distributed Tracing (AsyncLocalStorage)**: An HTTP middleware injects a unique `traceId` into the Node.js `AsyncLocalStorage`. This ID is automatically picked up by Pino for every log. It is also propagated across asynchronous boundaries via RabbitMQ `x-trace-id` headers, allowing you to trace an article's journey from HTTP request to background worker and back.
3. **Promtail**: The agent running alongside our containers. It scrapes the Docker daemon's JSON log files (or Kubernetes Pod logs), parses our application's JSON payload to extract labels (like `service` and `level`), and pushes them to Loki.
4. **Loki**: Grafana's natively integrated, horizontally-scalable log aggregation system.
5. **Grafana**: The visualization layer, auto-provisioned on startup with a "Minimal Observability" dashboard featuring business metrics, a data table, and error rates per service.

### Kubernetes Deployment
If you are deploying to a Kubernetes cluster, a unified manifest containing the ConfigMaps, Deployments, and DaemonSets is available at `infra/k8s/observability.yaml`.

---

## 🔎 LogQL Demonstration Queries

When presenting this architecture, you can use Grafana's **Explore** view (menu: *Explore* -> select *Loki* data source) to demonstrate powerful querying capabilities.

### 1. View all logs for a specific service
Retrieve a raw tail of logs coming from the catalog application.
```logql
{container=~".*catalog-service.*"}
```

### 2. Parse JSON and filter by specific Log Level
Since Pino logs in JSON, we can parse the line dynamically and filter by `level` (50 = Error in standard Pino).
```logql
{container=~".*catalog-service.*|.*moderation-worker.*"} | json | level >= 50
```

### 3. Track the lifecycle of a specific Request via TraceId
Because we inject a `traceId` at the edge and pass it via RabbitMQ headers, we can filter across all microservices to reconstruct a single user interaction that spans multiple decoupled workers.
```logql
{container=~".*"} | json | traceId="<insert-uuid>"
```

### 4. Track by ArticleId
```logql
{container=~".*"} | json | articleId="1234-abcd"
```
*This demonstrates business tracing capabilities purely through structured logging context.*

### 4. Count the number of Moderation Decisions over Time
Calculate how many articles are approved vs. rejected over the last 5 minutes.
```logql
sum by (status) (count_over_time({container=~".*moderation-worker.*"} | json | status!="" [5m]))
```

### 5. Find all Rejected Articles and output their title
Filter the stream to show only `REJECTED` logs, extract the reasons, and format the output line to clearly read the rejection status.
```logql
{container=~".*moderation-worker.*"} | json | status="REJECTED" | line_format "Reject reason: {{.reasons}} for article {{.articleId}}"
```

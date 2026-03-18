# Event-Driven Architecture

The project leverages RabbitMQ for asynchronous domain events processing.

## Current Setup

### Excange
- **Name**: `collector.events`
- **Type**: `topic`

### Moderation Workflow

1. The Catalog Service publishes an event when a new article is created.
2. The Moderation Worker consumes the event off the exchange asynchronously.
3. The Moderation Worker runs a pure-logic content check (forbidden words, links, email, phone limits).
4. The Moderation Worker publishes the result back to the exchange.
5. (Future) Catalog Service will consume the result to update the article status.

---

## Event Payloads

### `article.created`

Published by `catalog-service`.
Consumed by `moderation-worker` (queue: `moderation_queue`).

```json
{
  "articleId": "uuid-v4",
  "sellerId": "uuid-v4",
  "title": "Vintage Watch",
  "description": "A beautiful watch."
}
```

### `article.moderation.result`

Published by `moderation-worker`.
Consumed by `catalog-service` (future).

```json
{
  "articleId": "uuid-v4",
  "decision": "OK", // or "KO"
  "reasons": [
    "Contains forbidden word: arnaque"
  ] // Empty if OK
}
```

---

## Resilience & Error Handling

- **Automatic Reconnection**: The `catalog-service` uses a custom RabbitMQ wrapper that automatically re-establishes connection and re-creates channels/exchanges if the broker becomes unavailable.
- **Worker Robustness**: `moderation-worker` implements a fail-fast approach combined with Kubernetes `RestartPolicy` and exponential backoff to ensure message processing resumes as soon as connectivity is restored.

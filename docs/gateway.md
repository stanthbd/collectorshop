# API Gateway (Kong)

Kong runs in DB-less (declarative) mode with a versioned `kong.yml` config.

## Routes

| Route                    | Upstream                            | Auth       | Role     |
|--------------------------|-------------------------------------|------------|----------|
| `GET /api/catalog`       | `catalog-service/catalog`           | None       | Public   |
| `GET /api/articles`      | `catalog-service/articles`          | JWT        | seller   |
| `POST /api/articles`     | `catalog-service/articles`          | JWT        | seller   |
| `GET /api/me/articles`   | `catalog-service/me/articles`       | JWT        | seller   |
| `/api/admin/articles/*`  | `catalog-service/admin/articles/*`  | JWT        | admin    |

## How Auth Works

1. The client gets a JWT from Keycloak (see [auth.md](./auth.md)).
2. The client passes the JWT in the `Authorization: Bearer <token>` header.
3. Kong's **jwt** plugin validates the token signature against Keycloak's RSA public key.
4. If the token is valid, Kong proxies the request to the upstream service.
5. If the token is invalid or missing on a protected route, Kong returns `401 Unauthorized`.

> **Note**: Kong OSS (free) does not have a built-in RBAC plugin to check JWT claims.
> Role enforcement (checking `realm_access.roles`) must be done at the **service level** (Express middleware / NestJS guards).
> Kong handles **authentication** (is the JWT valid?), services handle **authorization** (does the user have the required role?).

## Setup: Keycloak Public Key

After starting Keycloak, you need to extract its RSA public key and paste it into `kong.yml`:

```bash
# Get the public key from Keycloak
curl -s http://localhost:8080/auth/realms/collector | python -m json.tool | findstr public_key
```

Copy the key value and wrap it in PEM format inside `infra/local/kong/kong.yml`:

```yaml
consumers:
  - username: keycloak-jwt
    jwt_secrets:
      - key: http://localhost:8080/auth/realms/collector
        algorithm: RS256
        rsa_public_key: |
          -----BEGIN PUBLIC KEY-----
          <PASTE_KEY_HERE>
          -----END PUBLIC KEY-----
```

Then reload Kong:
```bash
docker compose -f infra/local/docker-compose.yml restart kong
```

## Example Curl Commands (via Kong)

All requests go through Kong on **port 8000**.

### Public: Browse catalog
```bash
curl -s http://localhost:8000/api/catalog
```

### Seller: List my articles
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/realms/collector/protocol/openid-connect/token \
  -d "client_id=collector-web&username=seller1&password=seller1&grant_type=password" \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/articles
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/me/articles
```

### Admin: Manage articles
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/realms/collector/protocol/openid-connect/token \
  -d "client_id=collector-web&username=admin1&password=admin1&grant_type=password" \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/admin/articles
```

### Expect 401 on protected route without token
```bash
curl -s http://localhost:8000/api/articles
# => {"message":"Unauthorized"}
```

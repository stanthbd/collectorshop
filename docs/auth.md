# Authentication (Keycloak)

This project uses Keycloak for IAM (Identity and Access Management), implementing OpenID Connect (OIDC).

## Auth (Keycloak)
- **Admin**: [http://keycloak.dev.local/](http://keycloak.dev.local/) (`admin`/`admin`)
- **Realm**: `collector`
- **Clients**:
  - `collector-web` (Public) - For the React SPA
  - `collector-api` (Confidential) - For backend API authentication

## Default Users

| Username | Password | Role     |
|----------|----------|----------|
| seller1  | seller1  | seller   |
| admin1   | admin1   | admin    |

## Test Token

You can use the ROPC (Resource Owner Password Credentials) flow to quickly get a token for testing APIs.

### As Seller

```bash
curl -X POST http://keycloak.dev.local/realms/collector/protocol/openid-connect/token \
  -d "client_id=collector-web&username=seller1&password=seller1&grant_type=password"
```

## JWT Claims Expected

When your backend verifies the token, the roles will appear under `realm_access.roles`:

```json
{
  "exp": 1713000000,
  "iat": 1713000000,
  "jti": "8c0...",
  "iss": "http://localhost:8080/auth/realms/collector",
  "sub": "b2f...",
  "typ": "Bearer",
  "azp": "collector-web",
  "preferred_username": "seller1",
  "email_verified": true,
  "realm_access": {
    "roles": [
      "default-roles-collector",
      "offline_access",
      "uma_authorization",
      "seller"
    ]
  }
}
```

*Note: The actual roles array contains default Keycloak roles alongside our custom application roles (`seller` or `admin`). Your API Guards should check for the presence of your custom roles.*

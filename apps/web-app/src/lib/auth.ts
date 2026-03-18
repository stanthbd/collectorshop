const TOKEN_KEY = 'collector_access_token';
const ID_TOKEN_KEY = 'collector_id_token';

// Global auth state cache
let accessToken: string | null = null;
let idToken: string | null = null;
let parsedToken: Record<string, unknown> | null = null;

/**
 * Initializes Keycloak (simplified redirect flow for POC).
 * Reads from URL hash if returning from login, otherwise tries localStorage.
 */
export function initAuth() {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const token = params.get('access_token');
        const incomingIdToken = params.get('id_token');

        if (token) {
            setToken(token);
        }
        if (incomingIdToken) {
            idToken = incomingIdToken;
            localStorage.setItem(ID_TOKEN_KEY, incomingIdToken);
        }

        if (token) {
            // Clean up URL without triggering a reload
            window.history.replaceState(null, '', window.location.pathname);
        }
    } else {
        // Try to restore from local storage
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedIdToken = localStorage.getItem(ID_TOKEN_KEY);

        if (savedToken) {
            setToken(savedToken);
        }
        if (savedIdToken) {
            idToken = savedIdToken;
        }
    }
}

export function login() {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'collector';
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'collector-web';

    const redirectUri = encodeURIComponent(window.location.origin);
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Implicit flow: ask for both id_token and token (access_token)
    // The scope must include openid to get the id_token
    // OIDC requires a nonce when requesting an id_token via implicit flow
    const url = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token%20token&scope=openid%20profile&nonce=${nonce}`;
    window.location.href = url;
}

/**
 * Authenticate directly via Keycloak Resource Owner Password Credentials (ROPC)
 */
export async function loginWithCredentials(username: string, password: string): Promise<void> {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'collector';
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'collector-web';

    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', 'openid profile');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    if (!response.ok) {
        throw new Error('Identifiants invalides ou erreur serveur.');
    }

    const data = await response.json();

    if (data.access_token) {
        setToken(data.access_token);
    }
    if (data.id_token) {
        idToken = data.id_token;
        localStorage.setItem(ID_TOKEN_KEY, data.id_token);
    }
}

export function logout() {
    const currentIdToken = idToken || localStorage.getItem(ID_TOKEN_KEY);

    // Clear state and storage locally
    accessToken = null;
    idToken = null;
    parsedToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);

    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'collector';
    const redirectUri = encodeURIComponent(window.location.origin + '/');

    let url = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUri}`;

    // Keycloak >= 18 requires id_token_hint for logout without confirmation prompt
    if (currentIdToken) {
        url += `&id_token_hint=${currentIdToken}`;
    }

    window.location.href = url;
}

export function getAccessToken(): string | null {
    if (!accessToken) {
        initAuth(); // Ensure it's loaded if called before App mount
    }
    // Proactive expiration check: if the token is expired, silently log out
    if (accessToken && isTokenExpired()) {
        silentLogout();
        return null;
    }
    return accessToken;
}

/**
 * Returns true if the stored JWT access token is expired.
 */
export function isTokenExpired(): boolean {
    if (!parsedToken) return true;
    const exp = parsedToken.exp as number | undefined;
    if (!exp) return false;
    // exp is in seconds; add a 10s buffer to account for clock drift
    return Date.now() / 1000 > exp - 10;
}

/**
 * Silently clears the local session and redirects to /login.
 * Used when the token has expired — no Keycloak logout redirect needed
 * because the server-side session is already invalid.
 */
export function silentLogout() {
    accessToken = null;
    idToken = null;
    parsedToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    window.location.href = '/login';
}

export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

function setToken(token: string) {
    accessToken = token;
    localStorage.setItem(TOKEN_KEY, token);

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        parsedToken = JSON.parse(jsonPayload) as Record<string, unknown>;

    } catch (e) {
        console.error('Failed to parse token', e);
        // Clear invalid token
        accessToken = null;
        parsedToken = null;
        idToken = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ID_TOKEN_KEY);
    }
}

export function getUserRoles(): string[] {
    if (!parsedToken) {
        const token = getAccessToken();
        if (token && !parsedToken) {
            setToken(token); // Force re-parse if we only had the string
        }
    }

    if (!parsedToken || typeof parsedToken.realm_access !== 'object' || !parsedToken.realm_access) return [];
    const realmAccess = parsedToken.realm_access as { roles?: string[] };
    return realmAccess.roles || [];
}

export function hasRole(role: string): boolean {
    return getUserRoles().includes(role);
}

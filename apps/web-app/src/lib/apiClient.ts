import { getAccessToken, silentLogout } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number>;
}

/**
 * Generic Fetch Wrapper that replaces Axios.
 * Handles base URL, JSON parsing, error throwing, and token injection.
 */
export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;

    // Build Query String
    let url = `${BASE_URL}${endpoint}`;
    if (params) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                urlParams.append(key, String(value));
            }
        });
        const queryString = urlParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    // Handle Token Injection
    const token = getAccessToken();
    const authHeaders: Record<string, string> = {};
    if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Handle Default Headers
    const baseHeaders = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
    };

    const config: RequestInit = {
        method: customConfig.method || 'GET',
        headers: {
            ...baseHeaders,
            ...(headers as Record<string, string>),
        },
        ...customConfig,
    };

    try {
        const response = await fetch(url, config);

        // Parse JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            let errorMessage = 'Une erreur est survenue';

            if (data?.message) {
                errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
            } else if (typeof data === 'string') {
                errorMessage = data;
            } else if (data && typeof data === 'object') {
                errorMessage = JSON.stringify(data);
            } else if (response.statusText) {
                errorMessage = response.statusText;
            }

            // Format detailed validation errors (e.g. from Zod)
            if (data?.errors && Array.isArray(data.errors)) {
                const details = data.errors.map((err: { path?: string[]; message?: string }) => {
                    const path = err.path ? err.path.join('.') : '';
                    return path ? `${path}: ${err.message}` : err.message;
                }).join(' | ');
                errorMessage = `${errorMessage} - ${details}`;
            }

            // 401 = token expired or invalid: silently clear session and redirect to login
            if (response.status === 401) {
                silentLogout();
                throw new Error('Session expirée. Redirection vers la page de connexion...');
            }

            throw new Error(errorMessage);
        }

        return data as T;
    } catch (err) {
        console.error(`[apiClient] Request to ${url} failed:`, err);
        throw err;
    }
}

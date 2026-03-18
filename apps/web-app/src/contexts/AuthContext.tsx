import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    isAuthenticated,
    getUserRoles,
    loginWithCredentials as authLoginWithCredentials,
    logout as authLogout,
    initAuth
} from '../lib/auth';

import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [roles, setRoles] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize once
        initAuth();

        // Call asynchronous-like resolution to avoid synchronous setState inside useEffect 
        // which triggers "cascading renders" React error.
        Promise.resolve().then(() => {
            setIsAuth(isAuthenticated());
            setRoles(getUserRoles());
            setInitialized(true);
        });
    }, []);

    const login = async (username: string, password: string) => {
        await authLoginWithCredentials(username, password);
        // Update state to trigger re-renders natively instead of relying on manual reload
        setIsAuth(isAuthenticated());
        setRoles(getUserRoles());
    };

    const logout = () => {
        authLogout();
        setIsAuth(false);
        setRoles([]);
    };

    if (!initialized) {
        return null; // Await initial token check
    }

    return (
        <AuthContext.Provider value={{ isAuth, roles, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


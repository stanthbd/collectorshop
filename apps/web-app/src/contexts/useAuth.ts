import { createContext, useContext } from 'react';

export interface AuthContextType {
    isAuth: boolean;
    roles: string[];
    login: (u: string, p: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

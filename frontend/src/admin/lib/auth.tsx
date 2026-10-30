// src/admin/lib/auth.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, getAuthToken, setAuthToken, type AdminUser } from "./api";

interface AuthState {
    user: AdminUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async (): Promise<boolean> => {
        const ok = await auth.tryRefresh();
        if (!ok) {
            setUser(null);
            return false;
        }
        try {
            const me = await auth.me();
            setUser(me.user);
            return true;
        } catch {
            setAuthToken(null);
            setUser(null);
            return false;
        }
    }, []);

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    const login = useCallback(async (email: string, password: string) => {
        const result = await auth.login(email, password);
        setAuthToken(result.accessToken);
        setUser(result.user);
    }, []);

    const logout = useCallback(async () => {
        try { await auth.logout(); } finally {
            setAuthToken(null);
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}

export { getAuthToken };
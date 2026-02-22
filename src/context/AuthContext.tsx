import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
    useEffect,
} from "react";
import type { AxiosError } from "axios";
import {
    getMe as fetchCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
    refresh as refreshRequest,
} from "@/services/authService";
import type { ApiErrorResponse, AuthUser, LoginRequest } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
    status: AuthStatus;
    user: AuthUser | null;
    error: string | null;
    isAuthenticated: boolean;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    getMe: () => Promise<void>;
    hasRole: (role: string) => boolean;
    hasAuthority: (authority: string) => boolean;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthPayload = AuthUser & { userId?: number };

const normalizeTokenValue = (value: string): string => value.trim();

const normalizeAuthUser = (next: AuthPayload): AuthUser => ({
    id: next.id ?? next.userId ?? 0,
    username: next.username,
    roles: next.roles,
    permissions: next.permissions,
    accessToken: next.accessToken,
});

const roleVariants = (role: string): string[] => {
    const normalized = normalizeTokenValue(role);
    if (!normalized) {
        return [];
    }

    const withRolePrefix = normalized.startsWith("ROLE_")
        ? normalized
        : `ROLE_${normalized}`;
    const withoutRolePrefix = normalized.startsWith("ROLE_")
        ? normalized.replace(/^ROLE_/, "")
        : normalized;

    return Array.from(new Set([withRolePrefix, withoutRolePrefix]));
};

const hasMatch = (targetValues: string[], sourceValues: string[]) =>
    targetValues.some((targetValue) => sourceValues.includes(targetValue));

const withExistingToken = (next: AuthUser, previous: AuthUser | null): AuthUser => ({
    id: next.id ?? previous?.id ?? 0,
    username: next.username,
    roles: next.roles,
    permissions: next.permissions,
    accessToken: next.accessToken ?? previous?.accessToken,
});

const getAxiosMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const apiMessage = axiosError.response?.data?.message;
        if (typeof apiMessage === "string") {
            return apiMessage;
        }
    }
    return error instanceof Error ? error.message : fallback;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<AuthUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const getMe = useCallback(async () => {
        try {
            const response = await fetchCurrentUser();
            setUser((previous) => withExistingToken(normalizeAuthUser(response), previous));
            setStatus("authenticated");
        } catch {
            try {
                const refreshed = await refreshRequest();
                setUser((previous) => withExistingToken(normalizeAuthUser(refreshed), previous));
                setStatus("authenticated");
            } catch {
                setUser(null);
                setStatus("unauthenticated");
            }
        }
    }, []);

    const login = useCallback(async (request: LoginRequest) => {
        clearError();
        try {
            const response = await loginRequest(request);
            setUser((previous) => withExistingToken(normalizeAuthUser(response), previous));
            setStatus("authenticated");
        } catch (err) {
            const message = getAxiosMessage(err, "로그인 실패");
            setError(message);
            setUser(null);
            setStatus("unauthenticated");
            throw err;
        }
    }, [clearError]);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
            setStatus("unauthenticated");
        }
    }, []);

    const refresh = useCallback(async () => {
        clearError();
        try {
            const response = await refreshRequest();
            setUser((previous) => withExistingToken(normalizeAuthUser(response), previous));
            setStatus("authenticated");
        } catch (err) {
            const message = getAxiosMessage(err, "토큰 갱신 실패");
            setError(message);
            setUser(null);
            setStatus("unauthenticated");
            throw err;
        }
    }, [clearError]);

    const hasRole = useCallback(
        (role: string) => hasMatch(roleVariants(role), user?.roles ?? []),
        [user]
    );

    const hasAuthority = useCallback(
        (authority: string) => hasMatch([normalizeTokenValue(authority)], user?.permissions ?? []),
        [user]
    );

    useEffect(() => {
        void getMe();
    }, [getMe]);

    const value = useMemo(
        () => ({
            status,
            user,
            error,
            isAuthenticated: status === "authenticated",
            login,
            logout,
            refresh,
            getMe,
            hasRole,
            hasAuthority,
            clearError,
        }),
        [
            status,
            user,
            error,
            login,
            logout,
            refresh,
            getMe,
            hasRole,
            hasAuthority,
            clearError,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}

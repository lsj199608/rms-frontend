import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
    children?: ReactNode;
    requiredRoles?: string[];
    requiredPermissions?: string[];
}

export function ProtectedRoute({
    children,
    requiredRoles = [],
    requiredPermissions = [],
}: ProtectedRouteProps) {
    const { status, hasRole, hasAuthority } = useAuth();
    const hasRequiredRoles = requiredRoles.length === 0 || requiredRoles.some(hasRole);
    const hasRequiredPermissions = requiredPermissions.length === 0 || requiredPermissions.some(hasAuthority);
    const isAllowed = hasRequiredRoles && hasRequiredPermissions;

    if (status === "loading") {
        return (
            <div className="flex min-h-[240px] items-center justify-center">
                <p className="text-sm text-muted-foreground">세션 로딩중...</p>
            </div>
        );
    }

    if (status !== "authenticated") {
        return <Navigate to="/login" replace />;
    }

    if (!isAllowed) {
        return (
            <div className="mx-auto w-full max-w-xl py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>접근 권한이 없습니다.</CardTitle>
                        <CardDescription>현재 계정 권한으로 접근할 수 없는 화면입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            필요한 권한: {requiredRoles.join(", ")} {requiredPermissions.join(", ")}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children ?? <Outlet />}</>;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function DashboardHome() {
    const { user, refresh } = useAuth();

    const handleRefresh = async () => {
        try {
            await refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">로그인 사용자</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">username: {user?.username ?? "-"}</p>
                        <p className="mt-2 text-xs text-muted-foreground">roles: {user?.roles.join(", ") ?? "-"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">권한</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{user?.permissions.join(", ") ?? "-"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">토큰 갱신</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleRefresh} variant="outline">
                            Refresh 토큰 재발급
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">상태</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            로그인 상태: <span className="text-foreground">Active</span>
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>RBAC API 동작을 확인하려면 Users/Admin 페이지로 이동하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        권한이 필요한 요청은 백엔드의 /api/admin/** 또는 /api/users/**에서 테스트할 수 있습니다.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

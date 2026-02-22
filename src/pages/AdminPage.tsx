import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminDashboard } from "@/services/adminService";

interface DashboardMessage {
  scope: string;
  message: string;
}

export default function AdminPage() {
    const [dashboard, setDashboard] = useState<DashboardMessage | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await fetchAdminDashboard();
            setDashboard(data);
        } catch (err) {
            setError("ADMIN API 호출 실패");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Admin</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard API</CardTitle>
                    <CardDescription>권한: ROLE_ADMIN</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <button
                        onClick={() => {
                            void load();
                        }}
                        className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
                    >
                        {isLoading ? "조회중..." : "관리자 데이터 조회"}
                    </button>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {dashboard && (
                        <p className="rounded-md bg-muted p-3 text-sm">
                            {dashboard.scope} / {dashboard.message}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

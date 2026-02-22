import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, status, error, clearError } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated && status !== "loading") {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearError();
        setIsSubmitting(true);
        try {
            await login({ username, password });
            navigate("/");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>RMS 로그인</CardTitle>
                    <CardDescription>아이디/비밀번호로 로그인하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">username</label>
                            <Input
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                autoComplete="username"
                                placeholder="admin"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">password</label>
                            <Input
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                type="password"
                                placeholder="Admin!234"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "로그인 중..." : "로그인"}
                        </Button>
                    </form>
                    <p className="mt-4 text-xs text-muted-foreground">
                        테스트 계정: admin / Admin!234, user / User!234
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
    createUser,
    deleteUser,
    fetchRoles,
    fetchUsers,
    type RoleItem,
    type UserCreateRequest,
    type UserItem,
    updateUser,
} from "@/services/userService";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/auth";

interface EditForm {
    id: number;
    username: string;
    password: string;
    enabled: boolean;
    roleIds: number[];
}

const emptyCreateForm: UserCreateRequest = {
    username: "",
    password: "",
    enabled: true,
    roleIds: [],
};

export default function UsersPage() {
    const { hasAuthority, hasRole } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [createForm, setCreateForm] = useState<UserCreateRequest>(emptyCreateForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingForm, setEditingForm] = useState<EditForm | null>(null);

    const canWrite = hasAuthority("USER_WRITE") || hasRole("ADMIN");
    const readableAuthority = hasAuthority("USER_READ");
    const canSubmitCreate = canWrite
        && createForm.username.trim().length > 0
        && createForm.password.trim().length > 0;

    const getApiErrorMessage = (error: unknown, fallback: string) => {
        if (typeof error === "object" && error !== null && "response" in error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            const message = axiosError.response?.data?.message;
            if (typeof message === "string") {
                return message;
            }
        }
        return fallback;
    };

    const roleByUser = useCallback(
        (userRoles: string[]) =>
            roles.filter((role) => userRoles.includes(role.roleName)).map((role) => role.id),
        [roles],
    );

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const [usersData, roleData] = await Promise.all([fetchUsers(), fetchRoles()]);
            setUsers(usersData);
            setRoles(roleData);
        } catch (e) {
            setError("사용자/권한 목록 조회 실패");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (readableAuthority) {
            void loadData();
        }
    }, [readableAuthority, loadData]);

    const resetCreate = () => {
        setCreateForm(emptyCreateForm);
    };

    const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canWrite) {
            return;
        }
        if (!createForm.username.trim() || createForm.password.length < 6) {
            setError("username(필수)과 password(6자 이상)가 필요합니다.");
            return;
        }

        try {
            setError("");
            await createUser(createForm);
            resetCreate();
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "사용자 생성 실패"));
            console.error(e);
        }
    };

    const startEditing = (user: UserItem) => {
        if (!canWrite) {
            return;
        }
        setEditingId(user.id);
        setEditingForm({
            id: user.id,
            username: user.username,
            password: "",
            enabled: user.enabled,
            roleIds: roleByUser(user.roles),
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingForm(null);
    };

    const saveEditing = async () => {
        if (!editingForm || !canWrite) {
            return;
        }
        if (!editingForm.username.trim()) {
            setError("사용자명은 필수입니다.");
            return;
        }
        if (editingForm.password && editingForm.password.length < 6) {
            setError("비밀번호는 6자 이상 또는 비우기로 유지하세요.");
            return;
        }

        try {
            setError("");
            await updateUser(editingForm.id, {
                username: editingForm.username,
                password: editingForm.password || undefined,
                enabled: editingForm.enabled,
                roleIds: editingForm.roleIds,
            });
            setEditingId(null);
            setEditingForm(null);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "사용자 수정 실패"));
            console.error(e);
        }
    };

    const handleDelete = async (userId: number, username: string) => {
        if (!canWrite) {
            return;
        }
        if (!window.confirm(`${username} 사용자를 삭제할까요?`)) {
            return;
        }

        try {
            await deleteUser(userId);
            await loadData();
        } catch (e) {
            setError(getApiErrorMessage(e, "사용자 삭제 실패"));
            console.error(e);
        }
    };

    const toggleRoleInList = (current: number[], roleId: number, checked: boolean) => {
        if (checked) {
            return Array.from(new Set([...current, roleId]));
        }
        return current.filter((id) => id !== roleId);
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Users</h1>
            <Card>
                <CardHeader>
                    <CardTitle>사용자 관리 (RBAC)</CardTitle>
                    <CardDescription>
                        읽기 권한: USER_READ / 수정/삭제/생성 권한: USER_WRITE
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {isLoading ? <p className="text-sm text-muted-foreground">로딩중...</p> : null}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {!readableAuthority ? (
                        <p className="text-sm text-destructive">
                            사용자 목록 조회 권한이 없습니다.
                        </p>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b">
                                            <tr className="bg-muted/30 text-left">
                                                <th className="px-3 py-2">ID</th>
                                                <th className="px-3 py-2">사용자</th>
                                                <th className="px-3 py-2">활성</th>
                                                <th className="px-3 py-2">역할</th>
                                                <th className="px-3 py-2">액션</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b">
                                                    <td className="px-3 py-2 align-top">{user.id}</td>
                                                    <td className="px-3 py-2 align-top">
                                                        {editingId === user.id ? (
                                                            <Input
                                                                value={editingForm?.username ?? ""}
                                                                onChange={(event) =>
                                                                    setEditingForm((prev) =>
                                                                        prev
                                                                            ? { ...prev, username: event.target.value }
                                                                            : prev,
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            user.username
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        {editingId === user.id ? (
                                                            <label className="inline-flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editingForm?.enabled ?? false}
                                                                    onChange={(event) =>
                                                                        setEditingForm((prev) =>
                                                                            prev
                                                                                ? { ...prev, enabled: event.target.checked }
                                                                                : prev,
                                                                        )
                                                                    }
                                                                />
                                                                활성
                                                            </label>
                                                        ) : user.enabled ? (
                                                            "YES"
                                                        ) : (
                                                            "NO"
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        {editingId === user.id ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {roles.map((role) => (
                                                                    <label
                                                                        key={role.id}
                                                                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                (editingForm?.roleIds ?? []).includes(role.id)
                                                                            }
                                                                            onChange={(event) =>
                                                                                setEditingForm((prev) => {
                                                                                    if (!prev) {
                                                                                        return prev;
                                                                                    }
                                                                                    return {
                                                                                        ...prev,
                                                                                        roleIds: toggleRoleInList(
                                                                                            prev.roleIds,
                                                                                            role.id,
                                                                                            event.target.checked,
                                                                                        ),
                                                                                    };
                                                                                })
                                                                            }
                                                                        />
                                                                        {role.roleName}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.roles.map((roleName) => (
                                                                    <span
                                                                        key={roleName}
                                                                        className="rounded-md border px-2 py-1 text-xs"
                                                                    >
                                                                        {roleName}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                        {editingId === user.id ? (
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" onClick={saveEditing}>
                                                                    저장
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={cancelEditing}
                                                                >
                                                                    취소
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={!canWrite}
                                                                    onClick={() => startEditing(user)}
                                                                >
                                                                    수정
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    disabled={!canWrite}
                                                                    onClick={() => void handleDelete(user.id, user.username)}
                                                                >
                                                                    삭제
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <form className="space-y-3 rounded-md border p-4" onSubmit={handleCreateSubmit}>
                                <h2 className="text-sm font-medium">사용자 생성</h2>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm">username</label>
                                        <Input
                                            value={createForm.username}
                                            onChange={(event) =>
                                                setCreateForm((prev) => ({ ...prev, username: event.target.value }))
                                            }
                                            placeholder="user-1"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm">password</label>
                                        <Input
                                            type="password"
                                            value={createForm.password}
                                            onChange={(event) =>
                                                setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                                            }
                                            placeholder="******"
                                        />
                                    </div>
                                </div>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={createForm.enabled}
                                        onChange={(event) =>
                                            setCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))
                                        }
                                    />
                                    활성 계정
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createForm.roleIds.includes(role.id)}
                                                onChange={(event) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        roleIds: toggleRoleInList(
                                                            prev.roleIds,
                                                            role.id,
                                                            event.target.checked,
                                                        ),
                                                    }))
                                                }
                                            />
                                            {role.roleName}
                                        </label>
                                    ))}
                                </div>
                                <div>
                                <Button type="submit" disabled={!canSubmitCreate}>
                                    사용자 생성
                                </Button>
                                    {!canWrite ? (
                                        <p className="text-xs text-muted-foreground">
                                            USER_WRITE 권한이 없어 등록 버튼이 비활성화되어 있습니다.
                                        </p>
                                    ) : createForm.username.trim().length === 0 || createForm.password.trim().length === 0 ? (
                                        <p className="text-xs text-muted-foreground">
                                            username와 password를 입력해 주세요.
                                        </p>
                                    ) : null}
                            </div>
                            </form>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

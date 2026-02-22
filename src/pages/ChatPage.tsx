import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
    addRoomMembers,
    createChatRoom,
    fetchChatMessages,
    fetchChatRoomMembers,
    fetchChatRooms,
    removeRoomMember,
    sendChatMessageByApi,
    type ChatRoomMember,
    type ModifyChatRoomMembersRequest,
    type ChatRoom,
    type CreateChatRoomRequest,
} from "@/services/chatService";
import { fetchUsers, type UserItem } from "@/services/userService";
import { API_BASE_URL } from "@/api/axios";

interface LiveMessage {
    roomId: number;
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    createdAt: string;
    fromMe?: boolean;
}

interface WsFrame {
    type: string;
    roomId?: number;
    messageId?: number;
    senderId?: number;
    senderName?: string;
    content?: string;
    createdAt?: string;
    message?: string;
}

const withAccessToken = (url: string, accessToken?: string) => {
    if (!accessToken?.trim()) {
        return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}access_token=${encodeURIComponent(accessToken)}`;
};

const toWsUrl = (accessToken?: string) => {
    const baseApi = API_BASE_URL;
    const trimmedBase = baseApi.replace(/\/+$/, "");
    try {
        const url = new URL(baseApi);
        return withAccessToken(`${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}/ws/chat`, accessToken);
    } catch {
        const websocketBase = baseApi.startsWith("https://")
            ? baseApi.replace(/^https:\/\//, "wss://")
            : baseApi.replace(/^http:\/\//, "ws://");
        if (!websocketBase.includes("://")) {
            return withAccessToken(`ws://${trimmedBase.split("/")[0]}/ws/chat`, accessToken);
        }

        const withHostOnly = websocketBase.match(/^(wss?:\/\/[^/]+)/);
        return withAccessToken(withHostOnly ? `${withHostOnly[0]}/ws/chat` : `${trimmedBase}/ws/chat`, accessToken);
    }
};

const toTime = (value: string) =>
    new Date(value).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
    });

const getUserIdNumber = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }
    const id = Number(value);
    return Number.isNaN(id) ? null : id;
};

const isMineMessage = (
    senderId: number | null | undefined,
    senderName: string | null | undefined,
    currentUserId: number | undefined,
    currentUsername: string | undefined,
): boolean => {
    const senderIdNumber = getUserIdNumber(senderId);
    const currentIdNumber = getUserIdNumber(currentUserId);
    if (senderIdNumber !== null && currentIdNumber !== null) {
        return senderIdNumber === currentIdNumber;
    }
    return (
        Boolean(senderName) && Boolean(currentUsername) && senderName === currentUsername
    );
};

const normalizeRoomTime = (value: string) => value || "1970-01-01T00:00:00Z";

const reorderByRecentMessage = (rooms: ChatRoom[]) =>
    [...rooms].sort((a, b) => normalizeRoomTime(b.lastMessageAt).localeCompare(normalizeRoomTime(a.lastMessageAt)));

export default function ChatPage() {
    const { user, isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<LiveMessage[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomMembers, setNewRoomMembers] = useState<number[]>([]);
    const [roomMembers, setRoomMembers] = useState<ChatRoomMember[]>([]);
    const [isMemberOpen, setIsMemberOpen] = useState(false);
    const [inviteMembers, setInviteMembers] = useState<number[]>([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isMemberActionLoading, setIsMemberActionLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    const activeRoomIdRef = useRef<number | null>(null);
    const joinedRoomIdRef = useRef<number | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const socketTokenRef = useRef<string | null>(null);
    const messageListRef = useRef<HTMLDivElement | null>(null);
    const isManualDisconnectRef = useRef(false);

    const canRender = rooms.length > 0 && activeRoomId !== null;
    const activeRoom = useMemo(
        () => rooms.find((room) => room.id === activeRoomId) ?? null,
        [activeRoomId, rooms],
    );

    const filteredRooms = useMemo(
        () =>
            rooms.filter((room) => room.name.toLowerCase().includes(search.toLowerCase())),
        [search, rooms],
    );

    const availableInviteMembers = useMemo(
        () =>
            users.filter(
                (userItem) => !roomMembers.some((member) => member.id === userItem.id),
            ),
        [roomMembers, users],
    );

    const loadRooms = useCallback(async () => {
        try {
            const roomData = await fetchChatRooms();
            setRooms(roomData);
            setUnreadCounts((prev) =>
                roomData.reduce<Record<number, number>>((accumulator, room) => {
                    accumulator[room.id] = prev[room.id] ?? 0;
                    return accumulator;
                }, {}),
            );
            setError("");
            return roomData;
        } catch (err) {
            setError("채팅방 목록 조회 실패");
            console.error(err);
            return [];
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const userData = await fetchUsers();
            setUsers(userData.filter((item) => item.username !== user?.username));
        } catch (err) {
            console.error(err);
        }
    }, [user?.username]);

    const loadRoomMembers = useCallback(async () => {
        if (!activeRoomId) {
            setRoomMembers([]);
            return;
        }

        try {
            const memberData = await fetchChatRoomMembers(activeRoomId);
            setRoomMembers(memberData);
            setError("");
        } catch (err) {
            setError("채팅방 구성원 조회 실패");
            console.error(err);
        }
    }, [activeRoomId]);

    const handleToggleMemberPanel = () => {
        if (!activeRoomId) {
            return;
        }

        if (!isMemberOpen) {
            void loadRoomMembers();
        }
        setIsMemberOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!isMemberOpen) {
            setInviteMembers([]);
        }
    }, [isMemberOpen]);

    const bindSocketHandlers = useCallback((socket: WebSocket) => {
        socket.onopen = () => {
            setIsSocketConnected(true);
            if (activeRoomIdRef.current) {
                socket.send(JSON.stringify({ type: "join", roomId: activeRoomIdRef.current }));
            }
        };

        socket.onclose = (event) => {
            setIsSocketConnected(false);
            if (event.code !== 1000 && event.reason) {
                console.info(`WebSocket closed: ${event.code} / ${event.reason}`);
            } else if (event.code !== 1000 && event.code !== 1001) {
                console.info(`WebSocket closed with code: ${event.code}`);
            }
        };

        socket.onerror = (error) => {
            setIsSocketConnected(false);
            if (!isManualDisconnectRef.current) {
                console.error("WebSocket connection error", error);
            }
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as WsFrame;
                if (payload.type === "message") {
                    if (!payload.roomId || !payload.messageId || !payload.senderId) {
                        return;
                    }

                    const incoming: LiveMessage = {
                        roomId: payload.roomId,
                        id: payload.messageId,
                        senderId: payload.senderId,
                        senderName: payload.senderName ?? "알수없음",
                        content: payload.content ?? "",
                        createdAt: payload.createdAt ?? new Date().toISOString(),
                        fromMe:
                            isMineMessage(
                                payload.senderId,
                                payload.senderName,
                                user?.id,
                                user?.username,
                            ),
                    };

                    if (incoming.roomId === activeRoomIdRef.current) {
                        setUnreadCounts((prev) => ({
                            ...prev,
                            [incoming.roomId]: 0,
                        }));
                        setRooms((prev) =>
                            reorderByRecentMessage(
                                prev.map((room) =>
                                    room.id === incoming.roomId
                                        ? {
                                              ...room,
                                              lastMessage: incoming.content,
                                              lastMessageAt: incoming.createdAt,
                                          }
                                        : room,
                                ),
                            ),
                        );
                        setMessages((prev) =>
                            prev.some((message) => message.id === incoming.id)
                                ? prev
                                : [...prev, incoming],
                        );
                    } else {
                        setUnreadCounts((prev) => ({
                            ...prev,
                            [incoming.roomId]: (prev[incoming.roomId] ?? 0) + 1,
                        }));
                        setRooms((prev) =>
                            reorderByRecentMessage(
                                prev.map((room) =>
                                    room.id === incoming.roomId
                                        ? {
                                              ...room,
                                              lastMessage: incoming.content,
                                              lastMessageAt: incoming.createdAt,
                                          }
                                        : room,
                                ),
                            ),
                        );
                    }
                } else if (payload.type === "joined") {
                    joinedRoomIdRef.current = payload.roomId ?? null;
                } else if (payload.type === "left") {
                    if (payload.roomId === joinedRoomIdRef.current) {
                        joinedRoomIdRef.current = null;
                    }
                } else if (payload.type === "error") {
                    setError(payload.message ?? "채팅 오류");
                }
            } catch (err) {
                console.error(err);
            }
        };
    }, [user?.id, user?.username]);

    const getActiveToken = useCallback(() => user?.accessToken?.trim() ?? null, [user?.accessToken]);

    const connectWebSocket = useCallback(() => {
        const targetToken = getActiveToken();
        if (!isAuthenticated || !targetToken) {
            return;
        }

        if (socketRef.current) {
            if (
                socketTokenRef.current === targetToken &&
                (socketRef.current.readyState === WebSocket.OPEN ||
                    socketRef.current.readyState === WebSocket.CONNECTING)
            ) {
                bindSocketHandlers(socketRef.current);
                return;
            }
            isManualDisconnectRef.current = true;
            socketRef.current.close();
            socketRef.current = null;
            isManualDisconnectRef.current = false;
        }

        const socket = new WebSocket(toWsUrl(targetToken));
        socketRef.current = socket;
        socketTokenRef.current = targetToken;
        bindSocketHandlers(socket);
    }, [bindSocketHandlers, isAuthenticated, getActiveToken, user?.username]);

    const scrollToBottom = useCallback(() => {
        const list = messageListRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    }, []);

    useEffect(() => {
        void loadRooms();
        void loadUsers();
    }, [loadRooms, loadUsers]);

    useEffect(() => {
        if (!isAuthenticated || !getActiveToken()) {
            return;
        }

        connectWebSocket();
        return () => {
            joinedRoomIdRef.current = null;
        };
    }, [connectWebSocket, getActiveToken, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && getActiveToken()) {
            return;
        }

        if (!socketRef.current) {
            return;
        }

        isManualDisconnectRef.current = true;
        socketRef.current.close(1000, "auth state changed");
        socketRef.current = null;
        socketTokenRef.current = null;
        joinedRoomIdRef.current = null;
        isManualDisconnectRef.current = false;
    }, [getActiveToken, isAuthenticated]);

    useEffect(() => {
        if (!activeRoomId) {
            setRoomMembers([]);
            setInviteMembers([]);
            setIsMemberOpen(false);
            return;
        }
        setIsMemberOpen(false);
        void loadRoomMembers();
    }, [activeRoomId, loadRoomMembers]);

    useEffect(() => {
        activeRoomIdRef.current = activeRoomId;

        if (activeRoomId === null) {
            return;
        }

        setMessages([]);
        setUnreadCounts((prev) => ({
            ...prev,
            [activeRoomId]: 0,
        }));

        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }
        if (joinedRoomIdRef.current === activeRoomId) {
            return;
        }

        if (joinedRoomIdRef.current) {
            socket.send(JSON.stringify({ type: "leave", roomId: joinedRoomIdRef.current }));
        }

        joinedRoomIdRef.current = activeRoomId;
        socket.send(JSON.stringify({ type: "join", roomId: activeRoomId }));
    }, [activeRoomId]);

    useEffect(() => {
        if (rooms.length > 0 && activeRoomId === null) {
            const first = rooms[0];
            setActiveRoomId(first.id);
            return;
        }

        if (activeRoomId && !rooms.some((room) => room.id === activeRoomId)) {
            setActiveRoomId(rooms.length > 0 ? rooms[0].id : null);
            setMessages([]);
        }
    }, [rooms, activeRoomId]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeRoomId) {
                return;
            }

            setIsFetchingMessages(true);
            try {
                const messageData = await fetchChatMessages(activeRoomId);
                const next = messageData.map((message) => ({
                    roomId: message.roomId,
                    id: message.id,
                    senderId: message.senderId,
                    senderName: message.senderName,
                    content: message.content,
                    createdAt: message.createdAt,
                    fromMe: isMineMessage(
                        message.senderId,
                        message.senderName,
                        user?.id,
                        user?.username,
                    ),
                }));
                setMessages(next);
                setUnreadCounts((prev) => ({
                    ...prev,
                    [activeRoomId]: 0,
                }));
                setError("");
            } catch (err) {
                setMessages([]);
                setError("메시지 로딩 실패");
                console.error(err);
            } finally {
                setIsFetchingMessages(false);
            }
        };
        void fetchMessages();
    }, [activeRoomId, user?.id, user?.username]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isFetchingMessages, canRender, scrollToBottom]);

    const loadRoomsAndSelect = async () => {
        const roomData = await loadRooms();
        if (roomData.length > 0 && !roomData.find((room) => room.id === activeRoomId)) {
            setActiveRoomId(roomData[0].id);
        }
    };

    const onToggleMember = (userId: number) => {
        setNewRoomMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const onToggleInviteMember = (userId: number) => {
        setInviteMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const addMembers = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeRoomId || inviteMembers.length === 0) {
            setError("초대할 사용자를 선택해 주세요.");
            return;
        }

        setIsMemberActionLoading(true);
        try {
            const request: ModifyChatRoomMembersRequest = { memberIds: inviteMembers };
            await addRoomMembers(activeRoomId, request);
            setInviteMembers([]);
            setIsMemberOpen(false);
            await loadRoomMembers();
            await loadRoomsAndSelect();
            setError("");
        } catch (err) {
            setError("멤버 초대 실패");
            console.error(err);
        } finally {
            setIsMemberActionLoading(false);
        }
    };

    const removeMember = async (memberId: number) => {
        if (!activeRoomId) {
            return;
        }

        setIsMemberActionLoading(true);
        try {
            await removeRoomMember(activeRoomId, memberId);
            await loadRoomMembers();
            await loadRoomsAndSelect();
            if (memberId === user?.id) {
                setActiveRoomId(null);
            }
            setError("");
        } catch (err) {
            setError("멤버 제거 실패");
            console.error(err);
        } finally {
            setIsMemberActionLoading(false);
        }
    };

    const createRoom = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newRoomName.trim()) {
            setError("방 제목을 입력해 주세요.");
            return;
        }

        setIsLoading(true);
        const request: CreateChatRoomRequest = {
            name: newRoomName.trim(),
            memberIds: newRoomMembers,
        };

        try {
            const room = await createChatRoom(request);
            setNewRoomName("");
            setNewRoomMembers([]);
            setIsCreateOpen(false);
            await loadRoomsAndSelect();
            setActiveRoomId(room.id);
            setError("");
        } catch (err) {
            setError("채팅방 생성 실패");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeRoomId || !draft.trim()) {
            return;
        }

        const payload = draft.trim();
        setDraft("");
        setIsLoading(true);
        try {
            if (isSocketConnected && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                    JSON.stringify({
                        type: "send",
                        roomId: activeRoomId,
                        text: payload,
                    }),
                );
                return;
            }

            const saved = await sendChatMessageByApi(activeRoomId, { content: payload });
            setMessages((previous) => [
                ...previous,
                {
                    roomId: saved.roomId,
                    id: saved.id,
                    senderId: saved.senderId,
                    senderName: saved.senderName,
                    content: saved.content,
                    createdAt: saved.createdAt,
                    fromMe: true,
                },
            ]);
            setError("");
            await loadRoomsAndSelect();
        } catch (err) {
            setDraft(payload);
            setError("메시지 전송 실패");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-1rem)] bg-gradient-to-br from-slate-50 via-white to-cyan-100 p-3 sm:p-4">
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">채팅</h1>
                        <p className="text-sm text-slate-500">Telegram-style 채팅</p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isSocketConnected
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                    >
                        {isSocketConnected ? "실시간 연결됨" : isAuthenticated ? "오프라인" : "로그인 필요"}
                    </span>
                </div>
                <Card className="border border-slate-200/80 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-white/70">
                        <CardTitle>채팅방 목록 & 메시지</CardTitle>
                        <CardDescription>권한: USER_READ</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 xl:grid-cols-[300px_1fr]">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="채팅방 검색..."
                                />
                                <Button size="sm" onClick={() => setIsCreateOpen((prev) => !prev)}>
                                    방 생성
                                </Button>
                            </div>

                            {isCreateOpen ? (
                                <form className="space-y-3 rounded-xl border bg-white p-3 shadow-sm" onSubmit={createRoom}>
                                    <Input
                                        value={newRoomName}
                                        onChange={(event) => setNewRoomName(event.target.value)}
                                        placeholder="방 제목"
                                    />
                                    <div className="max-h-36 overflow-auto space-y-2 rounded-md border p-2">
                                        {users.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">참여할 수 있는 사용자가 없습니다.</p>
                                        ) : (
                                            users.map((member) => (
                                                <label
                                                    key={member.id}
                                                    className="flex items-center justify-between gap-2 text-sm"
                                                >
                                                    <span>{member.username}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={newRoomMembers.includes(member.id)}
                                                        onChange={() => onToggleMember(member.id)}
                                                    />
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                                            취소
                                        </Button>
                                        <Button size="sm" disabled={!newRoomName.trim() || isLoading} type="submit">
                                            {isLoading ? "생성중..." : "생성"}
                                        </Button>
                                    </div>
                                </form>
                            ) : null}

                            <div className="space-y-2">
                                {filteredRooms.map((room) => (
                                    <button
                                        type="button"
                                        key={room.id}
                                        onClick={() => setActiveRoomId(room.id)}
                                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                                            activeRoomId === room.id
                                                ? "border-sky-500/50 bg-sky-50 text-sky-900"
                                                : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium">{room.name}</p>
                                            {unreadCounts[room.id] ? (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                                    {unreadCounts[room.id]}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                            {room.lastMessage || "메시지 없음"}
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            참여 {room.memberCount}명
                                        </p>
                                    </button>
                                ))}
                                {filteredRooms.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">채팅방이 없습니다.</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Card className="min-h-[580px] border border-slate-200/80">
                                <CardHeader className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle>{activeRoom?.name ?? "채팅방을 선택하세요"}</CardTitle>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {isFetchingMessages ? "로딩 중" : "대기"}
                                        </span>
                                    </div>
                                    {activeRoom ? (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">참여자 ({roomMembers.length}명)</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    type="button"
                                                    onClick={handleToggleMemberPanel}
                                                >
                                                    {isMemberOpen ? "참여자 숨기기" : "참여자 보기"}
                                                </Button>
                                            </div>
                                            {isMemberOpen ? (
                                                <div className="space-y-2 rounded-md border p-2">
                                                    <p className="text-sm font-medium">참여자 목록</p>
                                                    <div className="space-y-1 rounded-md border p-2">
                                                        {roomMembers.length === 0 ? (
                                                            <p className="text-xs text-muted-foreground">참여자 정보가 없습니다.</p>
                                                        ) : (
                                                            roomMembers.map((member) => (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center justify-between gap-2 text-sm"
                                                                >
                                                                    <span>{member.username}</span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        type="button"
                                                                        disabled={isMemberActionLoading}
                                                                        onClick={() => void removeMember(member.id)}
                                                                    >
                                                                        {member.id === user?.id ? "나가기" : "내보내기"}
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <form className="space-y-2 rounded-md border p-2" onSubmit={addMembers}>
                                                        <p className="text-sm font-medium">멤버 초대</p>
                                                        <div className="max-h-36 overflow-auto space-y-2 rounded-md border p-2">
                                                            {availableInviteMembers.length === 0 ? (
                                                                <p className="text-xs text-muted-foreground">초대할 수 있는 사용자가 없습니다.</p>
                                                            ) : (
                                                                availableInviteMembers.map((member) => (
                                                                    <label
                                                                        key={member.id}
                                                                        className="flex items-center justify-between gap-2 text-sm"
                                                                    >
                                                                        <span>{member.username}</span>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={inviteMembers.includes(member.id)}
                                                                            onChange={() => onToggleInviteMember(member.id)}
                                                                        />
                                                                    </label>
                                                                ))
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setIsMemberOpen(false)}
                                                            >
                                                                닫기
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled={inviteMembers.length === 0 || isMemberActionLoading}
                                                                type="submit"
                                                            >
                                                                {isMemberActionLoading ? "초대 중..." : "초대"}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div
                                        ref={messageListRef}
                                        className="min-h-[360px] max-h-[460px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3"
                                    >
                                        {canRender ? (
                                            isFetchingMessages ? (
                                                <p className="text-sm text-muted-foreground">메시지를 가져오는 중...</p>
                                            ) : messages.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">메시지가 없습니다. 첫 메시지를 보내보세요.</p>
                                            ) : (
                                                messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`mb-2 flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                                                message.fromMe
                                                                    ? "bg-sky-500 text-white rounded-br-none"
                                                                    : "bg-white text-foreground border border-slate-200 rounded-bl-none"
                                                            }`}
                                                        >
                                                            {!message.fromMe ? (
                                                                <p className="mb-1 text-xs text-slate-500">{message.senderName}</p>
                                                            ) : null}
                                                            <p className="break-words">{message.content}</p>
                                                            <p className="mt-1 text-right text-[11px] opacity-80">
                                                                {toTime(message.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        ) : (
                                            <p className="text-sm text-muted-foreground">좌측에서 방을 선택하세요.</p>
                                        )}
                                    </div>
                                    <form className="flex gap-2" onSubmit={sendMessage}>
                                        <Input
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            placeholder={canRender ? "메시지 입력..." : "방을 먼저 선택하세요"}
                                            disabled={!canRender || isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!canRender || !draft.trim() || isLoading}
                                            size="sm"
                                        >
                                            전송
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
                {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            </div>
        </div>
    );
}

import api from '@/api/axios';

export interface ChatRoom {
    id: number;
    name: string;
    memberCount: number;
    lastMessage: string;
    lastMessageAt: string;
}

export interface ChatRoomMember {
    id: number;
    username: string;
}

export interface ModifyChatRoomMembersRequest {
    memberIds: number[];
}

export interface ChatMessage {
    roomId: number;
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    createdAt: string;
}

export interface CreateChatRoomRequest {
    name: string;
    memberIds: number[];
}

export interface SendChatMessageRequest {
    content: string;
}

export const fetchChatRooms = (): Promise<ChatRoom[]> =>
    api.get<ChatRoom[]>('/api/chat/rooms').then((res) => res.data);

export const createChatRoom = (request: CreateChatRoomRequest): Promise<ChatRoom> =>
    api.post<ChatRoom>('/api/chat/rooms', request).then((res) => res.data);

export const fetchChatMessages = (roomId: number): Promise<ChatMessage[]> =>
    api.get<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`).then((res) => res.data);

export const sendChatMessageByApi = (roomId: number, request: SendChatMessageRequest): Promise<ChatMessage> =>
    api.post<ChatMessage>(`/api/chat/rooms/${roomId}/messages`, request).then((res) => res.data);

export interface ChatRoomMembersResponse {
    members: ChatRoomMember[];
}

type ChatRoomMembersPayload = ChatRoomMember[] | ChatRoomMembersResponse;

export const fetchChatRoomMembers = (roomId: number): Promise<ChatRoomMember[]> =>
    api
        .get<ChatRoomMembersPayload>(`/api/chat/rooms/${roomId}/members`)
        .then((res) => (Array.isArray(res.data) ? res.data : res.data.members));

export const addRoomMembers = (roomId: number, request: ModifyChatRoomMembersRequest): Promise<ChatRoom> =>
    api.patch<ChatRoom>(`/api/chat/rooms/${roomId}/members`, request).then((res) => res.data);

export const removeRoomMember = (roomId: number, memberId: number): Promise<ChatRoom> =>
    api.delete<ChatRoom>(`/api/chat/rooms/${roomId}/members/${memberId}`).then((res) => res.data);

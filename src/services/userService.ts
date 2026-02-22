import api from '@/api/axios';

export interface UserItem {
    id: number;
    username: string;
    enabled: boolean;
    roles: string[];
}

export interface RoleItem {
    id: number;
    roleName: string;
}

export interface UserCreateRequest {
    username: string;
    password: string;
    enabled: boolean;
    roleIds: number[];
}

export interface UserUpdateRequest {
    username: string;
    password?: string;
    enabled: boolean;
    roleIds: number[];
}

export interface UserCreateResponse {
    id: number;
    username: string;
    enabled: boolean;
    roles: string[];
}

export const fetchUsers = (): Promise<UserItem[]> =>
    api.get<UserItem[]>('/api/users').then((res) => res.data);

export const fetchRoles = (): Promise<RoleItem[]> =>
    api.get<RoleItem[]>('/api/users/roles').then((res) => res.data);

export const createUser = (request: UserCreateRequest): Promise<UserCreateResponse> =>
    api.post<UserCreateResponse>('/api/users', request).then((res) => res.data);

export const updateUser = (id: number, request: UserUpdateRequest): Promise<UserCreateResponse> =>
    api.put<UserCreateResponse>(`/api/users/${id}`, request).then((res) => res.data);

export const deleteUser = (id: number): Promise<void> =>
    api.delete(`/api/users/${id}`).then(() => undefined);

import api from '@/api/axios';
import type { AuthUser, LoginRequest } from '@/types/auth';

const normalizeResponse = <T>(response: { data: T }): T => response.data;

export const login = (request: LoginRequest): Promise<AuthUser> =>
  api.post<AuthUser>('/api/auth/login', request).then(normalizeResponse);

export const logout = (): Promise<void> =>
  api.post('/api/auth/logout').then(() => undefined);

export const getMe = (): Promise<AuthUser> =>
  api.get<AuthUser>('/api/auth/me').then(normalizeResponse);

export const refresh = (): Promise<AuthUser> =>
  api.post<AuthUser>('/api/auth/refresh').then(normalizeResponse);

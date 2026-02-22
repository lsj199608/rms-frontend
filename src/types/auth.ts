export interface AuthUser {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
  accessToken?: string;
  userId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

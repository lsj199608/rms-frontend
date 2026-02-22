import api from '@/api/axios';

export interface AdminDashboardResponse {
  scope: string;
  message: string;
}

export const fetchAdminDashboard = () =>
  api.get<AdminDashboardResponse>('/api/admin/dashboard').then((res) => res.data);

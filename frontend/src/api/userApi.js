import axiosClient from './axiosClient';

export const userApi = {
  getUsers: (params = {}) => axiosClient.get('/users', { params }),
  updateUserRole: (id, role) => axiosClient.put(`/users/${id}/role`, { role }),
  getProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  getEngineerHistory: () => axiosClient.get('/users/history'),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
};

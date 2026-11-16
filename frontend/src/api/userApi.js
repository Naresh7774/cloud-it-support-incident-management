import axiosClient from './axiosClient';

export const userApi = {
  getUsers: (params = {}) => axiosClient.get('/users', { params }),
  updateUserRole: (id, role) => axiosClient.put(`/users/${id}/role`, { role }),
};

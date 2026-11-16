import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: (params) => axiosClient.get('/dashboard/stats', { params }),
  getSlaConfigs: () => axiosClient.get('/sla/configs'),
  updateSlaConfig: (data) => axiosClient.put('/sla/configs', data),
};

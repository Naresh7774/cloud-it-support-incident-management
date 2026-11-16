import axiosClient from './axiosClient';

export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard/stats'),
  getSlaConfigs: () => axiosClient.get('/sla/configs'),
  updateSlaConfig: (data) => axiosClient.put('/sla/configs', data),
};

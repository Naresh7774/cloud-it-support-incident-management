import axiosClient from './axiosClient';

export const analyticsApi = {
  getAnalytics: () => axiosClient.get('/analytics'),
};

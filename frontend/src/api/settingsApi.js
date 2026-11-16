import axiosClient from './axiosClient';

export const settingsApi = {
  getSettings: () => axiosClient.get('/settings'),
  updateSettings: (settings) => axiosClient.put('/settings', { settings }),
};

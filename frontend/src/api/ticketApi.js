import axiosClient from './axiosClient';

export const ticketApi = {
  getTickets: (params = {}) => axiosClient.get('/tickets', { params }),
  getTicketById: (id) => axiosClient.get(`/tickets/${id}`),
  createTicket: (data) => axiosClient.post('/tickets', data),
  updateStatus: (id, data) => axiosClient.put(`/tickets/${id}/status`, data),
  assignTicket: (id, engineerId) => axiosClient.put(`/tickets/${id}/assign`, { engineerId }),
  updatePriority: (id, priority) => axiosClient.put(`/tickets/${id}/priority`, { priority }),
  addComment: (id, data) => axiosClient.post(`/tickets/${id}/comments`, data),
  deleteComment: (ticketId, commentId) => axiosClient.delete(`/tickets/${ticketId}/comments/${commentId}`),
  deleteTicket: (id) => axiosClient.delete(`/tickets/${id}`),
};

import axios from 'axios';

const API_BASE_URL = 'http://171.233.238.34:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ContentApi = {
  getProfile: () => apiClient.get('/content/profile').then(res => res.data),
  getExperiences: () => apiClient.get('/content/experience').then(res => res.data),
  getSkills: () => apiClient.get('/content/skills').then(res => res.data),
};

export const ContactApi = {
  submitMessage: (data: { name: string; email: string; message: string }) =>
    apiClient.post('/contact/messages', data).then(res => res.data),
};

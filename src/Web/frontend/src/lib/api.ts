import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ContentApi = {
  getProfile: () => apiClient.get('/content/profile').then(res => {
    if (typeof res.data !== 'object' || !res.data) throw new Error('Invalid response');
    return res.data;
  }),
  getExperiences: () => apiClient.get('/content/experience').then(res => {
    if (typeof res.data !== 'object' || !res.data) throw new Error('Invalid response');
    return res.data;
  }),
  getSkills: () => apiClient.get('/content/skills').then(res => {
    if (typeof res.data !== 'object' || !res.data) throw new Error('Invalid response');
    return res.data;
  }),
};

export const ContactApi = {
  submitMessage: (data: { name: string; email: string; message: string }) =>
    apiClient.post('/contact/messages', data).then(res => res.data),
};

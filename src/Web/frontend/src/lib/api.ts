import axios from 'axios';

// Always use relative '/api' so requests seamlessly route through Nginx reverse-proxy
// regardless of domain, LAN IP, or port without CORS or network routing issues.
export const API_BASE_URL = '/api';

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
  submitMessage: (data: { name: string; email: string; message: string; companyTrap?: string }) =>
    apiClient.post('/contact/messages', data).then(res => res.data),
};


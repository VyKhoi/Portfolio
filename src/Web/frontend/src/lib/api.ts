import axios from 'axios';

// When running in development (via Vite proxy) or in production (via Nginx proxy),
// relative '/api' seamlessly routes to the .NET backend without any hardcoded IPs or ports.
export const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '')
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

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


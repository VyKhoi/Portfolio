// Always use relative '/api' so requests seamlessly route through Nginx reverse-proxy
// regardless of domain, LAN IP, or port without CORS or network routing issues.
export const API_BASE_URL = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`) as Error & { response?: { status: number } };
    error.response = { status: res.status };
    throw error;
  }

  return res.json() as Promise<T>;
}

export const ContentApi = {
  getProfile: () => request<any>('/content/profile'),
  getExperiences: () => request<any[]>('/content/experience'),
  getSkills: () => request<any[]>('/content/skills'),
};

export const ContactApi = {
  submitMessage: (data: { name: string; email: string; message: string; companyTrap?: string }) =>
    request<any>('/contact/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

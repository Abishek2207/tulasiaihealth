import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const terminology = {
  suggest: async (query: string) => {
    const res = await api.get(`/api/terminology/suggest`, { params: { q: query } });
    return res.data;
  },
  translate: async (source_code: string, source_system: string, target_system: string) => {
    const res = await api.post(`/api/terminology/translate`, {
      source_code,
      source_system,
      target_system,
    });
    return res.data;
  },
};

export const fhir = {
  uploadBundle: async (bundle: any) => {
    const res = await api.post(`/fhir/bundle/upload`, bundle);
    return res.data;
  },
};

export const patients = {
  generateQR: async (patientId: string, consentToken: string) => {
    return `data:image/png;base64,mockqrfor${patientId}`; // Mocked for UI, actual backend endpoint would be used
  }
};

export default api;

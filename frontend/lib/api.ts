/**
 * TulsiHealth — Centralized API Client
 * Typed fetch wrapper for all FastAPI backend endpoints
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    request<{ access_token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<any>('/api/auth/me'),
};

// ─── Patients ────────────────────────────────────────────────────────────────

export const patients = {
  list: (page = 1, limit = 20, search = '') =>
    request<{ patients: any[]; total: number }>(`/api/patients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  get: (id: string) => request<any>(`/api/patients/${id}`),

  create: (data: any) =>
    request<any>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<any>(`/api/patients/${id}`, { method: 'DELETE' }),

  getQR: (id: string) => request<{ qr_code: string; patient_id: string }>(`/api/patients/${id}/qr`),

  scan: (qrData: string) =>
    request<any>('/api/patients/scan', { method: 'POST', body: JSON.stringify({ qr_data: qrData }) }),

  getEncounters: (id: string) => request<any[]>(`/api/patients/${id}/encounters`),
};

// ─── FHIR ────────────────────────────────────────────────────────────────────

export const fhir = {
  getPatient: (id: string) => request<any>(`/fhir/Patient/${id}`),

  createCondition: (data: any) =>
    request<any>('/fhir/Condition', { method: 'POST', body: JSON.stringify(data) }),

  createEncounter: (data: any) =>
    request<any>('/fhir/Encounter', { method: 'POST', body: JSON.stringify(data) }),

  createObservation: (data: any) =>
    request<any>('/fhir/Observation', { method: 'POST', body: JSON.stringify(data) }),

  getAuditEvents: (patientId: string) =>
    request<any>(`/fhir/AuditEvent?patient=${patientId}`),
};

// ─── Terminology ─────────────────────────────────────────────────────────────

export const terminology = {
  search: (q: string, lang = 'en', limit = 10) =>
    request<{ results: any[]; total: number }>(
      `/api/terminology/search?q=${encodeURIComponent(q)}&lang=${lang}&limit=${limit}`
    ),

  translate: (fromSystem: string, code: string, toSystem: string) =>
    request<any>(
      `/api/terminology/translate?from=${fromSystem}&code=${encodeURIComponent(code)}&to=${toSystem}`
    ),

  getNamasteCode: (code: string) =>
    request<any>(`/api/terminology/namaste/${encodeURIComponent(code)}`),

  getICD11Code: (code: string) =>
    request<any>(`/api/terminology/icd11/${encodeURIComponent(code)}`),

  getConceptMap: () => request<any>('/api/terminology/concept-map'),
};

// ─── ML / AI ─────────────────────────────────────────────────────────────────

export const ml = {
  triage: (symptoms: string[], age: string, gender: string) =>
    request<any>(`/api/ml/triage?age=${age}&gender=${gender}`, {
      method: 'POST',
      body: JSON.stringify(symptoms),
    }),

  extractSymptoms: (text: string, language = 'en') =>
    request<{ extracted_codes: any[]; confidence_score: number }>('/api/ml/extract-symptoms', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    }),

  predictRecovery: (data: {
    age: number;
    chronic_conditions: string[];
    severity: string;
    current_medications?: string[];
  }) =>
    request<{ risk_score: number; risk_level: string; confidence: number; recommendations: string[] }>(
      '/api/ml/predict-recovery',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  recommendMedicines: (patient_profile: any, conditions: string[]) =>
    request<{ recommendations: any[]; disclaimer: string }>('/api/ml/recommend-medicines', {
      method: 'POST',
      body: JSON.stringify({ patient_profile, conditions }),
    }),

  medicineRecommend: (namasteCode: string) =>
    request<any>(`/api/ml/medicine-recommend?namaste_code=${encodeURIComponent(namasteCode)}`, {
      method: 'POST',
    }),
};

// ─── RAG / Chat ───────────────────────────────────────────────────────────────

export const rag = {
  chat: (message: string, language = 'en') =>
    request<{ response: string; sources?: any[] }>('/api/rag/chat', {
      method: 'POST',
      body: JSON.stringify({ message, language }),
    }),

  index: (documents: any[]) =>
    request<any>('/api/rag/index', {
      method: 'POST',
      body: JSON.stringify({ documents }),
    }),
};

// ─── Audit ────────────────────────────────────────────────────────────────────

export const audit = {
  getLogs: (limit = 50, page = 1) =>
    request<{ logs: any[]; total: number }>(`/api/audit/logs?limit=${limit}&page=${page}`),

  getPatientTimeline: (patientId: string) =>
    request<any[]>(`/api/audit/patient/${patientId}/timeline`),
};

// ─── Health ──────────────────────────────────────────────────────────────────

export const health = {
  check: () => request<{ status: string; services: Record<string, string> }>('/health'),
};

// ─── Default export ──────────────────────────────────────────────────────────

const api = { auth, patients, fhir, terminology, ml, rag, audit, health };
export default api;

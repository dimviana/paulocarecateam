
import { Student, Academy, User, NewsArticle, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog, ThemeSettings } from '../types';

const API_URL = '/api';

// --- Token Refresh Logic ---
let refreshTokenPromise: Promise<any> | null = null;

const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem('refreshToken');
  if (!currentRefreshToken) {
    throw new Error("No refresh token available");
  }
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: currentRefreshToken }),
  });
  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken); // Token rotation
  return data.accessToken;
};

/**
 * A generic wrapper around the Fetch API with automatic token refresh.
 * @param endpoint The API endpoint to call (e.g., '/students').
 * @param options The standard `fetch` options object.
 * @returns A promise that resolves with the JSON response.
 */
async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const makeRequest = async (): Promise<Response> => {
        const url = `${API_URL}${endpoint}`;
        const token = localStorage.getItem('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
    };

    let response = await makeRequest();

    if (response.status === 401) {
        // Potential token expiry, try to parse error code
        let errorBody;
        try {
            errorBody = await response.json();
        } catch (e) {
            // Not a JSON response, throw a standard error
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (errorBody.code === 'TOKEN_EXPIRED') {
            try {
                if (!refreshTokenPromise) {
                    refreshTokenPromise = refreshToken();
                }
                await refreshTokenPromise;
                refreshTokenPromise = null;
                // Retry the original request with the new token
                response = await makeRequest();
            } catch (refreshError) {
                 // Dispatch a global event for the app to handle logout
                 window.dispatchEvent(new Event('session-expired'));
                 throw new Error("Sua sessão expirou. Por favor, faça login novamente.");
            }
        }
    }

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (e) {
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
}

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export const api = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    // FIX: Send both old and new credential keys for backward compatibility
    // The deployed backend might expect `username` and `password`.
    // The current server.js expects `emailOrCpf` and `pass`.
    // Sending both ensures it works with either version.
    return fetchWrapper<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          emailOrCpf: email, 
          pass: password,
          username: email,
          password: password,
        }),
    });
  },

  loginGoogle: (token: string): Promise<AuthResponse> => {
    return fetchWrapper<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
  },
  
  logout: (): Promise<void> => {
      // The fetchWrapper will automatically add the access token
      return fetchWrapper('/auth/logout', { method: 'POST' });
  },

  validateSession: (): Promise<User> => fetchWrapper<User>('/auth/session'),

  registerAcademy: (data: { 
    name: string; 
    address: string;
    responsible: string;
    responsibleRegistration: string;
    email: string; 
    password?: string; 
  }): Promise<Academy> => {
    return fetchWrapper<Academy>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
  },

  getStudents: (): Promise<Student[]> => fetchWrapper<Student[]>('/students'),
  getAcademies: (): Promise<Academy[]> => fetchWrapper<Academy[]>('/academies'),
  getUsers: (): Promise<User[]> => fetchWrapper<User[]>('/users'),
  getNews: (): Promise<NewsArticle[]> => fetchWrapper<NewsArticle[]>('/news'),
  getGraduations: (): Promise<Graduation[]> => fetchWrapper<Graduation[]>('/graduations'),
  getSchedules: (): Promise<ClassSchedule[]> => fetchWrapper<ClassSchedule[]>('/schedules'),
  getAttendanceRecords: (): Promise<AttendanceRecord[]> => fetchWrapper<AttendanceRecord[]>('/attendance'),
  getProfessors: (): Promise<Professor[]> => fetchWrapper<Professor[]>('/professors'),
  getActivityLogs: (): Promise<ActivityLog[]> => fetchWrapper<ActivityLog[]>('/logs'),
  
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid', amount: number): Promise<Student> => {
    return fetchWrapper<Student>(`/students/${studentId}/payment`, {
        method: 'POST',
        body: JSON.stringify({ status, amount }),
    });
  },
  
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }): Promise<Student> => {
    const isNew = !student.id;
    const url = isNew ? '/students' : `/students/${student.id}`;
    const method = isNew ? 'POST' : 'PUT';
    return fetchWrapper<Student>(url, { method, body: JSON.stringify(student) });
  },

  deleteStudent: async (studentId: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/students/${studentId}`, { method: 'DELETE' });
    return { success: true };
  },

  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }): Promise<Academy> => {
    const isNew = !academy.id;
    const url = isNew ? '/academies' : `/academies/${academy.id}`;
    const method = isNew ? 'POST' : 'PUT';
    return fetchWrapper<Academy>(url, { method, body: JSON.stringify(academy) });
  },

  deleteAcademy: async (id: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/academies/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }): Promise<Graduation> => {
    const isNew = !grad.id;
    const url = isNew ? '/graduations' : `/graduations/${grad.id}`;
    const method = isNew ? 'POST' : 'PUT';
    return fetchWrapper<Graduation>(url, { method, body: JSON.stringify(grad) });
  },
  
  updateGraduationRanks: async (gradsWithNewRanks: { id: string, rank: number }[]): Promise<{ success: boolean }> => {
    await fetchWrapper('/graduations/ranks', {
        method: 'PUT',
        body: JSON.stringify(gradsWithNewRanks),
    });
    return { success: true };
  },

  deleteGraduation: async (id: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/graduations/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }): Promise<ClassSchedule> => {
    const isNew = !schedule.id;
    const url = isNew ? '/schedules' : `/schedules/${schedule.id}`;
    const method = isNew ? 'POST' : 'PUT';
    return fetchWrapper<ClassSchedule>(url, { method, body: JSON.stringify(schedule) });
  },

  deleteSchedule: async (id: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/schedules/${id}`, { method: 'DELETE' });
    return { success: true };
  },
  
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'> & { id?: string }): Promise<AttendanceRecord> => {
    return fetchWrapper<AttendanceRecord>('/attendance', {
        method: 'POST',
        body: JSON.stringify(record),
    });
  },

  deleteAttendanceRecord: async (id: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/attendance/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  saveProfessor: (prof: Omit<Professor, 'id'> & { id?: string }): Promise<Professor> => {
    const isNew = !prof.id;
    const url = isNew ? '/professors' : `/professors/${prof.id}`;
    const method = isNew ? 'POST' : 'PUT';
    return fetchWrapper<Professor>(url, { method, body: JSON.stringify(prof) });
  },

  deleteProfessor: async (id: string): Promise<{ success: boolean }> => {
    await fetchWrapper(`/professors/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  getThemeSettings: (): Promise<ThemeSettings> => fetchWrapper<ThemeSettings>('/settings'),

  saveThemeSettings: (settings: ThemeSettings): Promise<ThemeSettings> => {
    return fetchWrapper<ThemeSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

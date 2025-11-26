import { Student, Academy, User, NewsArticle, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog, ThemeSettings } from '../types';

const API_URL = '/api';

// Helper interface for Login response
interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
}

/**
 * A generic wrapper around the Fetch API.
 * STATELESS: Uses Bearer Token in headers (JWT).
 */
async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // Get token from LocalStorage
    let token = localStorage.getItem('authToken');
    
    // Check if we should attach the token.
    // We explicitly SKIP the token for the public settings endpoint to prevent 401 errors
    // if the token is expired when the app initializes.
    // NOTE: /auth/session IS sent the token so the backend can validate it.
    const isPublicEndpoint = endpoint === '/settings' || endpoint === '/auth/login' || endpoint === '/auth/refresh';
    
    if (!isPublicEndpoint && token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    let response = await fetch(url, { 
        ...options, 
        headers
    });

    // Handle Token Expiration (403 Forbidden usually, but sometimes 401)
    if (response.status === 403 || response.status === 401) {
        // Prevent infinite loop
        if (endpoint === '/auth/refresh' || endpoint === '/auth/login') {
             window.dispatchEvent(new Event('session-expired'));
             throw new Error("Session expired");
        }

        // Try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('authToken', data.token);
                    
                    // Retry original request with new token
                    const newHeaders = { ...headers, 'Authorization': `Bearer ${data.token}` };
                    response = await fetch(url, { ...options, headers: newHeaders });
                } else {
                    // Refresh failed
                    throw new Error("Refresh failed");
                }
            } catch (e) {
                window.dispatchEvent(new Event('session-expired'));
                throw new Error("Session expired");
            }
        } else {
             // No refresh token available. 
             // Only trigger logout if it's NOT the session check (which handles null gracefully)
             // and NOT public endpoints.
             if (!isPublicEndpoint && endpoint !== '/auth/session') {
                 window.dispatchEvent(new Event('session-expired'));
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

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await fetchWrapper<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: email, 
          password: password
        }),
    });
    
    if (response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response.user;
  },

  loginGoogle: async (token: string): Promise<User> => {
    const response = await fetchWrapper<LoginResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });

    if (response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response.user;
  },
  
  logout: async (): Promise<void> => {
      try {
        await fetchWrapper('/auth/logout', { method: 'POST' });
      } catch (e) {
          console.warn("Logout server call failed", e);
      } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
  },

  validateSession: async (): Promise<User | null> => {
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') return null;

      try {
          const response = await fetchWrapper<{user: User | null}>('/auth/session');
          return response.user;
      } catch (e) {
          // If 403/401 happened and refresh failed, we assume invalid.
          return null;
      }
  },

  registerAcademy: async (data: { 
    name: string; 
    address: string;
    responsible: string;
    responsibleRegistration: string;
    email: string; 
    password?: string; 
  }): Promise<User> => {
    const response = await fetchWrapper<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response.user;
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

  getThemeSettings: (): Promise<ThemeSettings> => fetchWrapper<ThemeSettings>('/settings', {}),
  
  getAllThemeSettings: (): Promise<ThemeSettings> => fetchWrapper<ThemeSettings>('/settings/all'),

  saveThemeSettings: (settings: ThemeSettings): Promise<ThemeSettings> => {
    return fetchWrapper<ThemeSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
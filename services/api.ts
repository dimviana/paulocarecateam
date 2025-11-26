
import { Student, Academy, User, NewsArticle, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog, ThemeSettings } from '../types';

const API_URL = '/api';

/**
 * A generic wrapper around the Fetch API.
 * STATEFUL: Uses credentials: 'include' to send/receive cookies.
 */
async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // credentials: 'include' tells the browser to send cookies with the request.
    // This is crucial for our Cookie-based Session Auth.
    const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include' 
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (e) {
            errorMessage = response.statusText;
        }
        
        if (response.status === 401) {
            window.dispatchEvent(new Event('session-expired'));
        }
        
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string): Promise<User> => {
    return fetchWrapper<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: email, 
          password: password
        }),
    });
  },

  loginGoogle: (token: string): Promise<User> => {
    return fetchWrapper<User>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
  },
  
  logout: (): Promise<void> => {
      return fetchWrapper('/auth/logout', { method: 'POST' });
  },

  validateSession: async (): Promise<User | null> => {
      try {
          const response = await fetchWrapper<{user: User | null}>('/auth/session');
          return response.user;
      } catch (e) {
          return null;
      }
  },

  registerAcademy: (data: { 
    name: string; 
    address: string;
    responsible: string;
    responsibleRegistration: string;
    email: string; 
    password?: string; 
  }): Promise<User> => {
    return fetchWrapper<User>('/auth/register', {
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

  getThemeSettings: (): Promise<ThemeSettings> => fetchWrapper<ThemeSettings>('/settings', {}),
  
  getAllThemeSettings: (): Promise<ThemeSettings> => fetchWrapper<ThemeSettings>('/settings/all'),

  saveThemeSettings: (settings: ThemeSettings): Promise<ThemeSettings> => {
    return fetchWrapper<ThemeSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

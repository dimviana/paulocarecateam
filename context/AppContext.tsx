
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeSettings, User, Student, Academy, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog, NewsArticle } from '../types';
import { initialThemeSettings } from '../constants';
import { api } from '../services/api';

interface NotificationType {
  message: string;
  details: string;
  type: 'error' | 'success';
}

interface AppContextType {
  themeSettings: ThemeSettings;
  setThemeSettings: (settings: ThemeSettings) => Promise<void>;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginGoogle: (token: string) => Promise<boolean>;
  logout: () => void;
  students: Student[];
  academies: Academy[];
  graduations: Graduation[];
  schedules: ClassSchedule[];
  users: User[];
  news: NewsArticle[];
  attendanceRecords: AttendanceRecord[];
  professors: Professor[];
  activityLogs: ActivityLog[];
  loading: boolean;
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid') => Promise<void>;
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }) => Promise<void>;
  deleteAcademy: (id: string) => Promise<void>;
  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }) => Promise<void>;
  updateGraduationRanks: (gradsWithNewRanks: { id: string, rank: number }[]) => Promise<void>;
  deleteGraduation: (id: string) => Promise<void>;
  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => Promise<void>;
  deleteAttendanceRecord: (id: string) => Promise<void>;
  saveProfessor: (prof: Omit<Professor, 'id'> & { id?: string }) => Promise<void>;
  deleteProfessor: (id: string) => Promise<void>;
  showcasedComponents: string[];
  setShowcasedComponents: React.Dispatch<React.SetStateAction<string[]>>;
  registerAcademy: (data: {
    name: string;
    address: string;
    responsible: string;
    responsibleRegistration: string;
    email: string;
    password?: string;
  }) => Promise<{
    success: boolean;
    message?: string;
  }>;
  notification: NotificationType | null;
  hideNotification: () => void;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(initialThemeSettings);
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showcasedComponents, setShowcasedComponents] = useState<string[]>(() => {
    const saved = localStorage.getItem('showcasedComponents');
    return saved ? JSON.parse(saved) : ['StatCard', 'PaymentsChart', 'AttendanceChart'];
  });
  const [notification, setNotification] = useState<NotificationType | null>(null);

  const hideNotification = useCallback(() => setNotification(null), []);

  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`API Error in ${context}:`, error);
    // Ignore 401s here as they are handled globally via event listener
    if (error?.message?.includes('401') || error?.message?.includes('Não autenticado')) return;

    let message = 'Falha de Conexão';
    let details = 'Verifique sua conexão.';
    if (error && typeof error.message === 'string') {
         message = 'Erro no Servidor';
         details = error.message;
    }
    setNotification({ type: 'error', message, details });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
    // Optional: call api.logout() if backend needs to know, but it's stateless now
  }, []);

  const refetchData = useCallback(async (loggedInUser: User | null) => {
      // STRICT GUARD: Never fetch data without a user
      if (!loggedInUser || !loggedInUser.id) return;

      try {
        const dataPromises: Promise<any>[] = [
            api.getStudents(),
            api.getAcademies(),
            api.getGraduations(),
            api.getSchedules(),
            api.getUsers(),
            api.getAttendanceRecords(),
            api.getProfessors(),
            api.getActivityLogs(),
            api.getNews(),
        ];

        if (loggedInUser.role === 'general_admin') {
            dataPromises.push(api.getAllThemeSettings());
        }

        const results = await Promise.all(dataPromises);

        setStudents(results[0]);
        setAcademies(results[1]);
        setGraduations(results[2]);
        setSchedules(results[3]);
        setUsers(results[4]);
        setAttendanceRecords(results[5]);
        setProfessors(results[6]);
        setActivityLogs(results[7]);
        setNews(results[8]);

        if (loggedInUser.role === 'general_admin' && results.length > 9) {
             setThemeSettingsState(results[9] as ThemeSettings);
        }

      } catch (error) {
          handleApiError(error, 'refetchData');
      }
  }, [handleApiError]);

  useEffect(() => {
    const handleSessionExpired = () => {
        console.warn("Session expired (401 from API). Logging out.");
        logout();
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [logout]);


  useEffect(() => {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    const { primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2 } = themeSettings;
    styleElement.innerHTML = `
      :root {
        --theme-bg: ${backgroundColor};
        --theme-card-bg: ${cardBackgroundColor};
        --theme-text-primary: ${secondaryColor};
        --theme-icon: ${iconColor};
        --theme-button-bg: ${buttonColor};
        --theme-button-text: ${buttonTextColor};
        --theme-chart-1: ${chartColor1};
        --theme-chart-2: ${chartColor2};
        --theme-accent: ${primaryColor};
      }
    `;
  }, [themeSettings]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializeApp = async () => {
        setLoading(true);
        try {
            // 1. Always Try to load public settings
            try {
                const settings = await api.getThemeSettings();
                setThemeSettingsState(settings);
            } catch (error) {
                console.warn("Could not load settings (API might be down or CORS issue)", error);
            }

            // 2. Check Local Storage for User
            const storedUserStr = localStorage.getItem('currentUser');
            if (storedUserStr) {
                try {
                    const parsedUser = JSON.parse(storedUserStr);
                    if (parsedUser && parsedUser.id) {
                        setUser(parsedUser);
                        // Only fetch data if we have a user
                        await refetchData(parsedUser);
                    }
                } catch (e) {
                    console.error("Invalid user in storage", e);
                    localStorage.removeItem('currentUser');
                }
            }
        } catch (error) {
            console.error("Init error", error);
        } finally {
            setLoading(false);
        }
    };
    initializeApp();
  }, [refetchData]);

  useEffect(() => { localStorage.setItem('showcasedComponents', JSON.stringify(showcasedComponents)); }, [showcasedComponents]);
  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const loggedInUser = await api.login(email, password);
      if (loggedInUser) {
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        await refetchData(loggedInUser);
        return true;
      }
      return false;
    } catch (error: any) {
      throw error;
    }
  };

  const loginGoogle = async (token: string) => {
    try {
      const loggedInUser = await api.loginGoogle(token);
      if (loggedInUser) {
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        await refetchData(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
       handleApiError(error, 'loginGoogle');
       return false;
    }
  };

  const registerAcademy = async (data: any): Promise<{ success: boolean; message?: string; }> => {
    try {
        const newUser = await api.registerAcademy(data);
        if (newUser) {
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          setUser(newUser);
          await refetchData(newUser);
          return { success: true };
        }
        return { success: false, message: 'Falha no cadastro.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
  };

  const wrapApiCall = async (apiCall: Promise<any>, context: string) => {
      try {
          await apiCall;
          await refetchData(user);
      } catch (error) {
          handleApiError(error, context);
      }
  };

  const setThemeSettings = async (settings: ThemeSettings) => {
    try {
      const updatedSettings = await api.saveThemeSettings(settings);
      setThemeSettingsState(updatedSettings);
      setNotification({ type: 'success', message: 'Configurações Salvas', details: 'As alterações foram aplicadas.'});
    } catch(error) {
      handleApiError(error, 'saveThemeSettings');
    }
  };

  const updateStudentPayment = async (studentId: string, status: 'paid' | 'unpaid') => {
      await wrapApiCall(api.updateStudentPayment(studentId, status, themeSettings.monthlyFeeAmount), 'updateStudentPayment');
  }
  const saveStudent = async (student: any) => await wrapApiCall(api.saveStudent(student), 'saveStudent');
  const deleteStudent = async (id: string) => await wrapApiCall(api.deleteStudent(id), 'deleteStudent');
  const saveAcademy = async (academy: any) => await wrapApiCall(api.saveAcademy(academy), 'saveAcademy');
  const deleteAcademy = async (id: string) => await wrapApiCall(api.deleteAcademy(id), 'deleteAcademy');
  const saveGraduation = async (grad: any) => await wrapApiCall(api.saveGraduation(grad), 'saveGraduation');
  const updateGraduationRanks = async (grads: any) => await wrapApiCall(api.updateGraduationRanks(grads), 'updateGraduationRanks');
  const deleteGraduation = async (id: string) => await wrapApiCall(api.deleteGraduation(id), 'deleteGraduation');
  const saveSchedule = async (s: any) => await wrapApiCall(api.saveSchedule(s), 'saveSchedule');
  const deleteSchedule = async (id: string) => await wrapApiCall(api.deleteSchedule(id), 'deleteSchedule');
  const saveAttendanceRecord = async (r: any) => await wrapApiCall(api.saveAttendanceRecord(r), 'saveAttendanceRecord');
  const deleteAttendanceRecord = async (id: string) => await wrapApiCall(api.deleteAttendanceRecord(id), 'deleteAttendanceRecord');
  const saveProfessor = async (p: any) => await wrapApiCall(api.saveProfessor(p), 'saveProfessor');
  const deleteProfessor = async (id: string) => await wrapApiCall(api.deleteProfessor(id), 'deleteProfessor');

  return (
    <AppContext.Provider value={{ 
        themeSettings, setThemeSettings, 
        user, login, loginGoogle, logout, 
        students, academies, graduations, schedules, users, attendanceRecords, professors, activityLogs, news,
        loading, 
        updateStudentPayment, saveStudent, deleteStudent,
        saveAcademy, deleteAcademy,
        saveGraduation, updateGraduationRanks, deleteGraduation,
        saveSchedule, deleteSchedule,
        saveAttendanceRecord, deleteAttendanceRecord,
        saveProfessor, deleteProfessor,
        showcasedComponents, setShowcasedComponents,
        registerAcademy,
        notification, hideNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

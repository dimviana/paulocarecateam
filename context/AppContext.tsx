
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
    // Ignorar erros 401 silenciosos (sessão expirada é tratada pelo event listener)
    if (error?.message?.includes('401') || error?.message?.includes('Não autenticado')) return;

    let message = 'Falha de Conexão';
    let details = 'Verifique sua conexão.';
    if (error && typeof error.message === 'string') {
         message = 'Erro no Servidor';
         details = error.message;
    }
    setNotification({ type: 'error', message, details });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch(e) {
      console.warn("Logout failed on server, clearing local state anyway");
    }
    setUser(null);
  }, []);

  // Improved refetchData using Promise.allSettled to avoid cascading failures
  const refetchData = useCallback(async (loggedInUser: User | null) => {
      if (!loggedInUser || !loggedInUser.id) return;

      try {
        // Fix: Explicitly type promises array to allow mixed Promise types
        const promises: Promise<any>[] = [
            api.getStudents(),       // 0
            api.getAcademies(),      // 1
            api.getGraduations(),    // 2
            api.getSchedules(),      // 3
            api.getUsers(),          // 4
            api.getAttendanceRecords(), // 5
            api.getProfessors(),     // 6
            api.getActivityLogs(),   // 7
            api.getNews(),           // 8
        ];

        // Add settings only for admin
        const isAdmin = loggedInUser.role === 'general_admin';
        if (isAdmin) {
            promises.push(api.getAllThemeSettings()); // 9
        }

        const results = await Promise.allSettled(promises);

        // Helper to safely get value with explicit typing
        const getVal = <T,>(result: PromiseSettledResult<any> | undefined, fallback: T): T => 
            result && result.status === 'fulfilled' ? result.value : fallback;

        // Helper to log errors
        results.forEach((res, idx) => {
            if (res.status === 'rejected') {
                console.warn(`Failed to fetch data at index ${idx}:`, res.reason);
            }
        });

        // Use generic casting for state updates
        setStudents(getVal<Student[]>(results[0], []));
        setAcademies(getVal<Academy[]>(results[1], []));
        setGraduations(getVal<Graduation[]>(results[2], []));
        setSchedules(getVal<ClassSchedule[]>(results[3], []));
        setUsers(getVal<User[]>(results[4], []));
        setAttendanceRecords(getVal<AttendanceRecord[]>(results[5], []));
        setProfessors(getVal<Professor[]>(results[6], []));
        setActivityLogs(getVal<ActivityLog[]>(results[7], []));
        setNews(getVal<NewsArticle[]>(results[8], []));

        if (isAdmin && results[9] && results[9].status === 'fulfilled') {
             setThemeSettingsState(results[9].value as ThemeSettings);
        }

      } catch (error) {
          // This catch block catches errors in the logic itself, not the API calls (handled by allSettled)
          handleApiError(error, 'refetchData');
      }
  }, [handleApiError]);

  useEffect(() => {
    const handleSessionExpired = () => {
        console.warn("Session expired (401). Logging out.");
        setUser(null); 
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);


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
            // 1. Load public settings (No Auth) - Fail silently to show login
            try {
                const settings = await api.getThemeSettings();
                setThemeSettingsState(settings);
            } catch (error) {
                console.warn("Could not load settings (using defaults)", error);
            }

            // 2. Validate Session (Cookie) - Fail silently
            try {
                const validatedUser = await api.validateSession();
                if (validatedUser) {
                    setUser(validatedUser);
                    await refetchData(validatedUser);
                }
            } catch (e) {
                // Not logged in, expected behavior
            }
        } catch (error) {
            console.error("Critical Init error", error);
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


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

    // Don't show notification for 401, as it will trigger a logout via event listener.
    if (error?.message?.includes('401') || error?.message?.includes('Não autenticado')) {
      return;
    }

    let message = 'Falha de Conexão';
    let details = 'Não foi possível se comunicar com o servidor. Verifique se o processo (PM2) está online, sua conexão com a internet e as configurações do Nginx.';

    if (error && typeof error.message === 'string') {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('database') || lowerCaseMessage.includes('connect econnrefused')) {
            message = 'Erro de Banco de Dados';
            details = 'O servidor não pôde se conectar ao banco de dados. Verifique as credenciais no arquivo .env do backend e o status do serviço MySQL.';
        } else if (!lowerCaseMessage.includes('http error')) {
             message = 'Erro no Servidor';
             details = `Ocorreu um erro inesperado. Detalhes: ${error.message}`;
        }
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // This is a classic network error, the default message is appropriate.
    }
    
    setNotification({ type: 'error', message, details });
  }, []);

  const logout = useCallback(async () => {
    try {
        await api.logout(); // Invalidate session on server
    } catch (e) {
        console.warn("Logout request failed, clearing local state anyway.", e);
    }
    setUser(null);
  }, []);

  const refetchData = useCallback(async (loggedInUser: User | null) => {
      // Ensure we don't fetch data if there is no user logged in
      if (!loggedInUser) return;

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
    // Global listener to handle logout when any API call returns 401.
    const handleSessionExpired = () => {
        console.warn("Session expired or invalid. Clearing user state.");
        setUser(null);
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
        window.removeEventListener('session-expired', handleSessionExpired);
    };
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

  useEffect(() => {
    const initializeApp = async () => {
        setLoading(true);
        try {
            // 1. Load Public Settings (No auth required)
            try {
                const settings = await api.getThemeSettings();
                setThemeSettingsState(settings);
            } catch (error) {
                console.warn("Could not load public theme settings, using defaults.", error);
            }

            // 2. Validate Session (Auth required)
            // This call might return 401 if not logged in, which is expected.
            let validatedUser: User | null = null;
            try {
                validatedUser = await api.validateSession();
            } catch (e) {
                // If it's a 401/403, it just means the user isn't logged in.
                // We swallow the error here so we don't trigger 'handleApiError' notifications.
                // The user remains null.
            }

            // 3. If user exists, fetch protected data
            if (validatedUser) {
                setUser(validatedUser); 
                await refetchData(validatedUser); 
            } else {
                console.log("No active session found on startup.");
            }
            
        } catch (error) {
            handleApiError(error, 'initializeApp');
        } finally {
            setLoading(false);
        }
    };
    initializeApp();
  }, [refetchData, handleApiError]);

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
    } catch (error) {
      if (error instanceof Error) {
          if (
            error.message.includes('401') || 
            error.message.includes('Unauthorized') || 
            error.message.includes('Invalid credentials') || 
            error.message.includes('Credenciais inválidas') ||
            error.message.includes('Usuário não encontrado') ||
            error.message.includes('USER_NOT_FOUND') ||
            error.message.includes('404')
          ) {
            console.warn("Authentication failed (Expected):", error.message);
          } else {
            handleApiError(error, 'login');
          }
      } else {
        handleApiError(error, 'login');
      }
      return false;
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
    } catch (error: any) {
       if (error.message && error.message.includes('404')) {
         throw new Error('USER_NOT_FOUND'); 
       }
       handleApiError(error, 'loginGoogle');
       return false;
    }
  };

  const registerAcademy = async (data: { name: string; address: string; responsible: string; responsibleRegistration: string; email: string; password?: string; }): Promise<{ success: boolean; message?: string; }> => {
    try {
        const newUser = await api.registerAcademy(data);
        if (newUser) {
          setUser(newUser);
          await refetchData(newUser);
          return { success: true };
        }
        return { success: false, message: 'Falha no cadastro: usuário não retornado.' };
    } catch (error: any) {
        handleApiError(error, 'registerAcademy');
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
      setNotification({ type: 'success', message: 'Configurações Salvas', details: 'As alterações foram aplicadas com sucesso.'});
    } catch(error) {
      handleApiError(error, 'saveThemeSettings');
    }
  };

  const updateStudentPayment = async (studentId: string, status: 'paid' | 'unpaid') => {
      await wrapApiCall(api.updateStudentPayment(studentId, status, themeSettings.monthlyFeeAmount), 'updateStudentPayment');
  }
  const saveStudent = async (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => {
      await wrapApiCall(api.saveStudent(student), 'saveStudent');
  }
  const deleteStudent = async (studentId: string) => {
    await wrapApiCall(api.deleteStudent(studentId), 'deleteStudent');
  }
  const saveAcademy = async (academy: Omit<Academy, 'id'> & { id?: string }) => {
      await wrapApiCall(api.saveAcademy(academy), 'saveAcademy');
  }
  const deleteAcademy = async (id: string) => {
    await wrapApiCall(api.deleteAcademy(id), 'deleteAcademy');
  }
  const saveGraduation = async (grad: Omit<Graduation, 'id'> & { id?: string }) => {
      await wrapApiCall(api.saveGraduation(grad), 'saveGraduation');
  }
  const updateGraduationRanks = async (gradsWithNewRanks: { id: string, rank: number }[]) => {
    await wrapApiCall(api.updateGraduationRanks(gradsWithNewRanks), 'updateGraduationRanks');
  }
  const deleteGraduation = async (id: string) => {
    await wrapApiCall(api.deleteGraduation(id), 'deleteGraduation');
  }
  const saveSchedule = async (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => {
      await wrapApiCall(api.saveSchedule(schedule), 'saveSchedule');
  }
  const deleteSchedule = async (id: string) => {
    await wrapApiCall(api.deleteSchedule(id), 'deleteSchedule');
  }
  const saveAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => {
    await wrapApiCall(api.saveAttendanceRecord(record), 'saveAttendanceRecord');
  };
  const deleteAttendanceRecord = async (id: string) => {
    await wrapApiCall(api.deleteAttendanceRecord(id), 'deleteAttendanceRecord');
  };
  const saveProfessor = async (prof: Omit<Professor, 'id'> & { id?: string }) => {
      await wrapApiCall(api.saveProfessor(prof), 'saveProfessor');
  }
  const deleteProfessor = async (id: string) => {
    await wrapApiCall(api.deleteProfessor(id), 'deleteProfessor');
  }

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

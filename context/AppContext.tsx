
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeSettings, User, Student, Academy, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog } from '../types';
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
  logout: () => void;
  students: Student[];
  academies: Academy[];
  graduations: Graduation[];
  schedules: ClassSchedule[];
  users: User[];
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authToken');
  }, []);

  const refetchData = useCallback(async () => {
      try {
        const [studentsData, academiesData, graduationsData, schedulesData, usersData, attendanceData, professorsData, activityLogsData] = await Promise.all([
            api.getStudents(),
            api.getAcademies(),
            api.getGraduations(),
            api.getSchedules(),
            api.getUsers(),
            api.getAttendanceRecords(),
            api.getProfessors(),
            api.getActivityLogs(),
        ]);
        setStudents(studentsData);
        setAcademies(academiesData);
        setGraduations(graduationsData);
        setSchedules(schedulesData);
        setUsers(usersData);
        setAttendanceRecords(attendanceData);
        setProfessors(professorsData);
        setActivityLogs(activityLogsData);
      } catch (error) {
          handleApiError(error, 'refetchData');
          if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
              logout();
          }
      }
  }, [logout, handleApiError]);

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
            // Check for Auth Token in ENV for auto-login on system initialization
            // We check both standard process.env and Vite's import.meta.env
            let envToken = '';
            
            try {
                // @ts-ignore
                if (import.meta && import.meta.env && import.meta.env.VITE_AUTH_TOKEN) {
                    // @ts-ignore
                    envToken = import.meta.env.VITE_AUTH_TOKEN;
                }
            } catch (e) { /* ignore if import.meta is not available */ }

            if (!envToken && typeof process !== 'undefined' && process.env && process.env.REACT_APP_AUTH_TOKEN) {
                envToken = process.env.REACT_APP_AUTH_TOKEN;
            }
            
            if (envToken) {
                // If an ENV token is present, we set it to localStorage if it's different
                if (localStorage.getItem('authToken') !== envToken) {
                    localStorage.setItem('authToken', envToken);
                    console.log("Auto-authenticating via ENV token.");
                }
            }

            try {
                const settings = await api.getThemeSettings();
                setThemeSettingsState(settings);
            } catch (error) {
                console.error("Failed to load settings:", error);
                // Continue initialization even if settings fail, using defaults
            }

            const token = localStorage.getItem('authToken');
            if (token) {
                // Try to validate the session with the backend using the secret stored there
                try {
                  const validatedUser = await api.validateSession();
                  setUser(validatedUser);
                  await refetchData(); // Fetch the rest of the app data
                } catch (validationError) {
                  console.warn("Session validation failed:", validationError);
                  logout(); // Token is invalid or expired
                }
            }
        } catch (error) {
            handleApiError(error, 'initializeApp');
        } finally {
            setLoading(false);
        }
    };
    initializeApp();
  }, [logout, refetchData, handleApiError]);

  useEffect(() => { localStorage.setItem('showcasedComponents', JSON.stringify(showcasedComponents)); }, [showcasedComponents]);
  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const { token } = await api.login(email, password);
      if (token) {
        localStorage.setItem('authToken', token);
        // Validating immediately after login to ensure user object is correct
        const validatedUser = await api.validateSession();
        setUser(validatedUser);
        await refetchData();
        return true;
      }
      return false;
    } catch (error) {
      if (error instanceof Error) {
          // Suppress notification for expected auth errors and 404s (handled by UI)
          if (
            error.message.includes('401') || 
            error.message.includes('Unauthorized') || 
            error.message.includes('Invalid credentials') || 
            error.message.includes('Please provide username and password') ||
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
      logout();
      return false;
    }
  };

  const registerAcademy = async (data: { name: string; address: string; responsible: string; responsibleRegistration: string; email: string; password?: string; }): Promise<{ success: boolean; message?: string; }> => {
    try {
        await api.registerAcademy(data);
        await refetchData();
        return { success: true };
    } catch (error: any) {
        handleApiError(error, 'registerAcademy');
        return { success: false, message: error.message };
    }
  };

  const wrapApiCall = async (apiCall: Promise<any>, context: string) => {
      try {
          await apiCall;
          await refetchData();
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
        user, login, logout, 
        students, academies, graduations, schedules, users, attendanceRecords, professors, activityLogs,
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

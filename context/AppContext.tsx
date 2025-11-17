import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeSettings, User, Student, Academy, Graduation, ClassSchedule, AttendanceRecord, Professor, ActivityLog } from '../types';
import { initialThemeSettings } from '../constants';
import { api } from '../services/api';

interface AppContextType {
  themeSettings: ThemeSettings;
  setThemeSettings: (settings: ThemeSettings) => void;
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
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
  // FIX: Add showcasedComponents state for the Components demo page.
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
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('themeSettings');
    const settings = saved ? JSON.parse(saved) : initialThemeSettings;
    if (!settings.jwtSecret) {
        settings.jwtSecret = crypto.randomUUID();
        localStorage.setItem('themeSettings', JSON.stringify(settings));
    }
    // Force light theme to match new design
    settings.theme = 'light';
    return settings;
  });
  
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

  // FIX: Add state management for showcasedComponents to resolve error on Components page.
  const [showcasedComponents, setShowcasedComponents] = useState<string[]>(() => {
    const saved = localStorage.getItem('showcasedComponents');
    return saved ? JSON.parse(saved) : ['StatCard', 'PaymentsChart', 'AttendanceChart'];
  });

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
          console.error("Failed to refetch data:", error);
          // Handle token expiration or network errors
          if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
              logout();
          }
      }
  }, [logout]);


  useEffect(() => {
    const styleId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    const {
        primaryColor, secondaryColor, backgroundColor, cardBackgroundColor,
        buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2
    } = themeSettings;

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
    const verifyTokenAndFetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1])); // Basic JWT payload parsing
             if (payload.exp * 1000 < Date.now()) {
                logout();
                setLoading(false);
                return;
            }
            // Fetch users first to identify the logged-in user
            const allUsers = await api.getUsers();
            setUsers(allUsers);
            const loggedInUser = allUsers.find(u => u.id === payload.userId);

            if (loggedInUser) {
                setUser(loggedInUser);
                await refetchData(); // Fetch all other data
            } else {
                logout();
            }
        } catch (error) {
            console.error("Token verification or data fetch failed", error);
            logout();
        } finally {
            setLoading(false);
        }
    };
    verifyTokenAndFetchData();
  }, [logout, refetchData]);


  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  useEffect(() => {
    localStorage.setItem('showcasedComponents', JSON.stringify(showcasedComponents));
  }, [showcasedComponents]);

  useEffect(() => {
    // This effect is simplified as the new design is light-theme only.
    // If theme switching is re-enabled, this logic would need to be expanded.
    document.documentElement.classList.remove('dark');
  }, []);

  const setThemeSettings = (settings: ThemeSettings) => {
    // Force light theme to match new design
    settings.theme = 'light';
    setThemeSettingsState(settings);
  };
  
  const login = async (email: string, pass: string) => {
    const { token } = await api.login(email, pass);
    if (token) {
        localStorage.setItem('authToken', token);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const allUsers = await api.getUsers(); // Fetch fresh user list
            setUsers(allUsers);
            const loggedInUser = allUsers.find(u => u.id === payload.userId);
            if (loggedInUser) {
                setUser(loggedInUser);
                await refetchData();
                return true;
            }
        } catch (e) {
            console.error("Failed to parse token", e);
            logout();
            return false;
        }
    }
    logout();
    return false;
  };

  const registerAcademy = async (data: {
    name: string;
    address: string;
    responsible: string;
    responsibleRegistration: string;
    email: string;
    password?: string;
  }): Promise<{ success: boolean; message?: string; }> => {
    try {
        await api.registerAcademy(data);
        setAcademies(await api.getAcademies());
        setUsers(await api.getUsers());
        setActivityLogs(await api.getActivityLogs());
        return { success: true };
    } catch (error: any) {
        console.error("Registration failed in context", error);
        return { success: false, message: error.message };
    }
  };

  const updateStudentPayment = async (studentId: string, status: 'paid' | 'unpaid') => {
      await api.updateStudentPayment(studentId, status, themeSettings.monthlyFeeAmount);
      await refetchData();
  }

  const saveStudent = async (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => {
      await api.saveStudent(student);
      await refetchData();
  }

  const deleteStudent = async (studentId: string) => {
    await api.deleteStudent(studentId);
    await refetchData();
  }

  const saveAcademy = async (academy: Omit<Academy, 'id'> & { id?: string }) => {
      await api.saveAcademy(academy);
      await refetchData();
  }

  const deleteAcademy = async (id: string) => {
    await api.deleteAcademy(id);
    await refetchData();
  }

  const saveGraduation = async (grad: Omit<Graduation, 'id'> & { id?: string }) => {
      await api.saveGraduation(grad);
      await refetchData();
  }
  
  const updateGraduationRanks = async (gradsWithNewRanks: { id: string, rank: number }[]) => {
    await api.updateGraduationRanks(gradsWithNewRanks);
    await refetchData();
  }

  const deleteGraduation = async (id: string) => {
    await api.deleteGraduation(id);
    await refetchData();
  }

  const saveSchedule = async (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => {
      await api.saveSchedule(schedule);
      await refetchData();
  }

  const deleteSchedule = async (id: string) => {
    await api.deleteSchedule(id);
    await refetchData();
  }
  
  const saveAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => {
    await api.saveAttendanceRecord(record);
    await refetchData();
  };

  const deleteAttendanceRecord = async (id: string) => {
    await api.deleteAttendanceRecord(id);
    await refetchData();
  };
  
  const saveProfessor = async (prof: Omit<Professor, 'id'> & { id?: string }) => {
      await api.saveProfessor(prof);
      await refetchData();
  }

  const deleteProfessor = async (id: string) => {
    await api.deleteProfessor(id);
    await refetchData();
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
        registerAcademy
    }}>
      {children}
    </AppContext.Provider>
  );
};

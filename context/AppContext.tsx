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

  const refetchActivityLogs = useCallback(async () => {
    setActivityLogs(await api.getActivityLogs());
  }, []);

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
    const verifyTokenAndSetUser = (token: string, allUsers: User[]) => {
      try {
        const payload = JSON.parse(atob(token));
        if (payload.exp > Date.now()) {
          const loggedInUser = allUsers.find(u => u.id === payload.userId);
          if (loggedInUser) {
            setUser(loggedInUser);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error("Token verification failed", error);
        logout();
      }
    };
    
    const fetchData = async () => {
        setLoading(true);
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
        
        const token = localStorage.getItem('authToken');
        if (token) {
            verifyTokenAndSetUser(token, usersData);
        }

        setLoading(false);
    };
    fetchData();
  }, [logout]);


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
            const payload = JSON.parse(atob(token));
            const allUsers = await api.getUsers(); // Fetch fresh user list
            const loggedInUser = allUsers.find(u => u.id === payload.userId);
            if (loggedInUser) {
                setUser(loggedInUser);
                setUsers(allUsers);
                refetchActivityLogs();
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

  const updateStudentPayment = async (studentId: string, status: 'paid' | 'unpaid') => {
      if (!user) return;
      await api.updateStudentPayment(studentId, status, themeSettings.monthlyFeeAmount, user.id);
      setStudents(await api.getStudents());
      refetchActivityLogs();
  }

  const saveStudent = async (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => {
      if (!user) return;
      await api.saveStudent(student, user.id);
      setStudents(await api.getStudents());
      setProfessors(await api.getProfessors());
      refetchActivityLogs();
  }

  const deleteStudent = async (studentId: string) => {
    if (!user) return;
    await api.deleteStudent(studentId, user.id);
    setStudents(await api.getStudents());
    refetchActivityLogs();
  }

  const saveAcademy = async (academy: Omit<Academy, 'id'> & { id?: string }) => {
      if (!user) return;
      await api.saveAcademy(academy, user.id);
      setAcademies(await api.getAcademies());
      refetchActivityLogs();
  }

  const deleteAcademy = async (id: string) => {
    if (!user) return;
    await api.deleteAcademy(id, user.id);
    setAcademies(await api.getAcademies());
    refetchActivityLogs();
  }

  const saveGraduation = async (grad: Omit<Graduation, 'id'> & { id?: string }) => {
      if (!user) return;
      await api.saveGraduation(grad, user.id);
      setGraduations(await api.getGraduations());
      refetchActivityLogs();
  }
  
  const updateGraduationRanks = async (gradsWithNewRanks: { id: string, rank: number }[]) => {
    if (!user) return;
    await api.updateGraduationRanks(gradsWithNewRanks, user.id);
    setGraduations(await api.getGraduations());
    refetchActivityLogs();
  }

  const deleteGraduation = async (id: string) => {
    if (!user) return;
    await api.deleteGraduation(id, user.id);
    setGraduations(await api.getGraduations());
    refetchActivityLogs();
  }

  const saveSchedule = async (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => {
      if (!user) return;
      await api.saveSchedule(schedule, user.id);
      setSchedules(await api.getSchedules());
      refetchActivityLogs();
  }

  const deleteSchedule = async (id: string) => {
    if (!user) return;
    await api.deleteSchedule(id, user.id);
    setSchedules(await api.getSchedules());
    refetchActivityLogs();
  }
  
  const saveAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => {
    if (!user) return;
    await api.saveAttendanceRecord(record, user.id);
    setAttendanceRecords(await api.getAttendanceRecords());
    refetchActivityLogs();
  };

  const deleteAttendanceRecord = async (id: string) => {
    if (!user) return;
    await api.deleteAttendanceRecord(id, user.id);
    setAttendanceRecords(await api.getAttendanceRecords());
    refetchActivityLogs();
  };
  
  const saveProfessor = async (prof: Omit<Professor, 'id'> & { id?: string }) => {
      if (!user) return;
      await api.saveProfessor(prof, user.id);
      setProfessors(await api.getProfessors());
      refetchActivityLogs();
  }

  const deleteProfessor = async (id: string) => {
    if (!user) return;
    await api.deleteProfessor(id, user.id);
    setProfessors(await api.getProfessors());
    refetchActivityLogs();
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
        showcasedComponents, setShowcasedComponents
    }}>
      {children}
    </AppContext.Provider>
  );
};
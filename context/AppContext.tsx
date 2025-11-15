import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeSettings, User, Student, Academy, Graduation, ClassSchedule, AttendanceRecord } from '../types';
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
  loading: boolean;
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid') => Promise<void>;
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }) => Promise<void>;
  deleteAcademy: (id: string) => Promise<void>;
  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }) => Promise<void>;
  deleteGraduation: (id: string) => Promise<void>;
  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => Promise<void>;
  deleteAttendanceRecord: (id: string) => Promise<void>;
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
    return settings;
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authToken');
  }, []);

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
        const [studentsData, academiesData, graduationsData, schedulesData, usersData, attendanceData] = await Promise.all([
            api.getStudents(),
            api.getAcademies(),
            api.getGraduations(),
            api.getSchedules(),
            api.getUsers(),
            api.getAttendanceRecords(),
        ]);
        setStudents(studentsData);
        setAcademies(academiesData);
        setGraduations(graduationsData);
        setSchedules(schedulesData);
        setUsers(usersData);
        setAttendanceRecords(attendanceData);
        
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
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeSettings.primaryColor.replace('#',''));
    root.style.setProperty('--secondary-color', themeSettings.secondaryColor.replace('#',''));
  }, [themeSettings]);

  useEffect(() => {
    const themeToApply = themeSettings.theme;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyFinalTheme = (t: 'light' | 'dark') => {
        if (t === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    };

    const handleSystemChange = (e: MediaQueryListEvent) => {
        if (themeToApply === 'system') {
            applyFinalTheme(e.matches ? 'dark' : 'light');
        }
    };

    if (themeToApply === 'system') {
        applyFinalTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleSystemChange);
    } else {
        applyFinalTheme(themeToApply);
    }

    return () => {
        mediaQuery.removeEventListener('change', handleSystemChange);
    };
}, [themeSettings.theme]);

  const setThemeSettings = (settings: ThemeSettings) => {
    setThemeSettingsState(settings);
  };
  
  const login = async (email: string, pass: string) => {
    const { token } = await api.login(email, pass);
    if (token) {
        localStorage.setItem('authToken', token);
        try {
            const payload = JSON.parse(atob(token));
            const loggedInUser = users.find(u => u.id === payload.userId);
            if (loggedInUser) {
                setUser(loggedInUser);
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
      await api.updateStudentPayment(studentId, status);
      setStudents(await api.getStudents());
  }

  const saveStudent = async (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => {
      await api.saveStudent(student);
      setStudents(await api.getStudents());
  }

  const deleteStudent = async (studentId: string) => {
    await api.deleteStudent(studentId);
    setStudents(await api.getStudents());
  }

  const saveAcademy = async (academy: Omit<Academy, 'id'> & { id?: string }) => {
      await api.saveAcademy(academy);
      setAcademies(await api.getAcademies());
  }

  const deleteAcademy = async (id: string) => {
    await api.deleteAcademy(id);
    setAcademies(await api.getAcademies());
  }

  const saveGraduation = async (grad: Omit<Graduation, 'id'> & { id?: string }) => {
      await api.saveGraduation(grad);
      setGraduations(await api.getGraduations());
  }

  const deleteGraduation = async (id: string) => {
    await api.deleteGraduation(id);
    setGraduations(await api.getGraduations());
  }

  const saveSchedule = async (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => {
      await api.saveSchedule(schedule);
      setSchedules(await api.getSchedules());
  }

  const deleteSchedule = async (id: string) => {
    await api.deleteSchedule(id);
    setSchedules(await api.getSchedules());
  }
  
  const saveAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => {
    await api.saveAttendanceRecord(record);
    setAttendanceRecords(await api.getAttendanceRecords());
  };

  const deleteAttendanceRecord = async (id: string) => {
    await api.deleteAttendanceRecord(id);
    setAttendanceRecords(await api.getAttendanceRecords());
  };


  return (
    <AppContext.Provider value={{ 
        themeSettings, setThemeSettings, 
        user, login, logout, 
        students, academies, graduations, schedules, users, attendanceRecords,
        loading, 
        updateStudentPayment, saveStudent, deleteStudent,
        saveAcademy, deleteAcademy,
        saveGraduation, deleteGraduation,
        saveSchedule, deleteSchedule,
        saveAttendanceRecord, deleteAttendanceRecord
    }}>
      {children}
    </AppContext.Provider>
  );
};
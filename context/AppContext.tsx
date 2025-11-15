import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ThemeSettings, User, Student, Academy, Graduation, ClassSchedule } from '../types';
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
  loading: boolean;
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid') => Promise<void>;
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen'> & { id?: string }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }) => Promise<void>;
  deleteAcademy: (id: string) => Promise<void>;
  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }) => Promise<void>;
  deleteGraduation: (id: string) => Promise<void>;
  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('themeSettings');
    return saved ? JSON.parse(saved) : initialThemeSettings;
  });
  
  const [user, setUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [graduations, setGraduations] = useState<Graduation[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeSettings.primaryColor.replace('#',''));
    root.style.setProperty('--secondary-color', themeSettings.secondaryColor.replace('#',''));
  }, [themeSettings]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [studentsData, academiesData, graduationsData, schedulesData, usersData] = await Promise.all([
            api.getStudents(),
            api.getAcademies(),
            api.getGraduations(),
            api.getSchedules(),
            api.getUsers()
        ]);
        setStudents(studentsData);
        setAcademies(academiesData);
        setGraduations(graduationsData);
        setSchedules(schedulesData);
        setUsers(usersData);
        setLoading(false);
    };
    fetchData();
  }, []);

  const setThemeSettings = (settings: ThemeSettings) => {
    setThemeSettingsState(settings);
  };
  
  const login = async (email: string, pass: string) => {
    const loggedInUser = await api.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateStudentPayment = async (studentId: string, status: 'paid' | 'unpaid') => {
      await api.updateStudentPayment(studentId, status);
      setStudents(await api.getStudents());
  }

  const saveStudent = async (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen'> & { id?: string }) => {
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

  return (
    <AppContext.Provider value={{ 
        themeSettings, setThemeSettings, 
        user, login, logout, 
        students, academies, graduations, schedules, users,
        loading, 
        updateStudentPayment, saveStudent, deleteStudent,
        saveAcademy, deleteAcademy,
        saveGraduation, deleteGraduation,
        saveSchedule, deleteSchedule
    }}>
      {children}
    </AppContext.Provider>
  );
};
export interface Graduation {
  id: string;
  name: string;
  color: string;
  minTimeInMonths: number;
}

export type DayOfWeek = 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira' | 'Sábado' | 'Domingo';

export interface ClassSchedule {
  id: string;
  className: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  professorId: string;
  assistantIds: string[];
  academyId: string;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  cpf: string;
  phone: string;
  address: string;
  beltId: string;
  academyId: string;
  firstGraduationDate: string;
  paymentStatus: 'paid' | 'unpaid';
  lastSeen: string;
}

export interface Academy {
  id: string;
  name: string;
  address: string;
  responsible: string;
  responsibleRegistration: string;
  professorId: string;
  assistantIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'general_admin' | 'academy_admin' | 'student';
  academyId?: string;
  studentId?: string;
}

export interface ThemeSettings {
  logoUrl: string;
  systemName: string;
  primaryColor: string;
  secondaryColor: string;
  useGradient: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: string;
}
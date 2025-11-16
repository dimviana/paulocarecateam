
export interface Graduation {
  id: string;
  name: string;
  color: string;
  minTimeInMonths: number;
  rank: number;
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
  requiredGraduationId: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string;
  birthDate: string;
  cpf: string;
  fjjpe_registration: string;
  phone: string;
  address: string;
  beltId: string;
  academyId: string;
  firstGraduationDate: string;
  paymentStatus: 'paid' | 'unpaid';
  lastSeen: string;
  paymentHistory: Payment[];
  paymentDueDateDay: number;
  imageUrl?: string;
}

export interface Academy {
  id: string;
  name: string;
  address: string;
  responsible: string;
  responsibleRegistration: string;
  professorId: string;
  assistantIds: string[];
  imageUrl?: string;
}

export interface Professor {
  id: string;
  name: string;
  fjjpe_registration: string;
  cpf: string;
  academyId: string;
  graduationId: string;
  imageUrl?: string;
  blackBeltDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'general_admin' | 'academy_admin' | 'student';
  academyId?: string;
  studentId?: string;
  birthDate?: string;
}

export interface ThemeSettings {
  logoUrl: string;
  systemName: string;
  primaryColor: string;
  secondaryColor: string;
  useGradient: boolean;
  reminderDaysBeforeDue: number;
  overdueDaysAfterDue: number;
  theme: 'light' | 'dark' | 'system';
  monthlyFeeAmount: number;
  // Public Web Page Settings
  publicPageEnabled: boolean;
  heroHtml: string;
  aboutHtml: string;
  branchesHtml: string;
  footerHtml: string;
  customCss: string;
  customJs: string;
  // Security
  jwtSecret: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  scheduleId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
}

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  timestamp: string;
  details: string;
}
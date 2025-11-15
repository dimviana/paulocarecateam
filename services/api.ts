import { Student, Academy, User, NewsArticle, Graduation, ClassSchedule, Payment, AttendanceRecord } from '../types';

let graduations: Graduation[] = [
  { id: '1', name: 'Branca', color: '#FFFFFF', minTimeInMonths: 0, rank: 1 },
  { id: '2', name: 'Azul', color: '#0000FF', minTimeInMonths: 24, rank: 2 },
  { id: '3', name: 'Roxa', color: '#800080', minTimeInMonths: 24, rank: 3 },
  { id: '4', name: 'Marrom', color: '#A52A2A', minTimeInMonths: 18, rank: 4 },
  { id: '5', name: 'Preta', color: '#000000', minTimeInMonths: 12, rank: 5 },
  { id: '6', name: 'Coral', color: '#FF7F50', minTimeInMonths: 36, rank: 6 },
  { id: '7', name: 'Vermelha', color: '#FF0000', minTimeInMonths: 60, rank: 7 },
];

let schedules: ClassSchedule[] = [
    { id: '1', className: 'Jiu-Jitsu Adulto (Iniciante)', dayOfWeek: 'Segunda-feira', startTime: '19:00', endTime: '20:30', professorId: '1', assistantIds: ['2'], academyId: '1', requiredGraduationId: '1' },
    { id: '2', className: 'Jiu-Jitsu Kids', dayOfWeek: 'Terça-feira', startTime: '18:00', endTime: '19:00', professorId: '3', assistantIds: ['4'], academyId: '2', requiredGraduationId: '1' },
    { id: '3', className: 'Jiu-Jitsu Adulto (Avançado)', dayOfWeek: 'Quarta-feira', startTime: '20:00', endTime: '21:30', professorId: '1', assistantIds: [], academyId: '1', requiredGraduationId: '3' },
    { id: '4', className: 'Jiu-Jitsu Adulto (Todos)', dayOfWeek: 'Sexta-feira', startTime: '19:00', endTime: '20:30', professorId: '1', assistantIds: ['2'], academyId: '1', requiredGraduationId: '1' },
];

let students: Student[] = [
  { id: '1', name: 'Carlos Gracie', birthDate: '1990-08-15', cpf: '111.111.111-11', fjjpe_registration: 'FJJPE-001', phone: '5511999999991', address: 'Rua do Tatame, 123', beltId: '7', academyId: '1', firstGraduationDate: '2010-01-20', paymentStatus: 'paid', lastSeen: '2024-07-28', paymentHistory: [{id: 'p1', date: '2024-07-05', amount: 150}], paymentDueDateDay: 5 },
  { id: '2', name: 'Hélio Gracie', birthDate: '1992-07-20', cpf: '222.222.222-22', fjjpe_registration: 'FJJPE-002', phone: '5511999999992', address: 'Avenida Ippon, 456', beltId: '5', academyId: '1', firstGraduationDate: '2012-03-10', paymentStatus: 'unpaid', lastSeen: '2024-07-27', paymentHistory: [{id: 'p2', date: '2024-06-05', amount: 150}], paymentDueDateDay: 10 },
  { id: '3', name: 'Royce Gracie', birthDate: '1995-01-30', cpf: '333.333.333-33', fjjpe_registration: 'FJJPE-003', phone: '5511999999993', address: 'Travessa da Luta, 789', beltId: '3', academyId: '2', firstGraduationDate: '2018-06-01', paymentStatus: 'paid', lastSeen: '2024-07-29', paymentHistory: [], paymentDueDateDay: 15 },
  { id: '4', name: 'Rickson Gracie', birthDate: '1988-08-21', cpf: '444.444.444-44', fjjpe_registration: 'FJJPE-004', phone: '5511999999994', address: 'Alameda do Armlock, 101', beltId: '4', academyId: '2', firstGraduationDate: '2015-11-15', paymentStatus: 'paid', lastSeen: '2024-07-29', paymentHistory: [], paymentDueDateDay: 20 },
];

let academies: Academy[] = [
  { id: '1', name: 'Gracie Humaitá', address: 'Rio de Janeiro, RJ', responsible: 'Royler Gracie', responsibleRegistration: 'REG-001', professorId: '1', assistantIds: ['2'] },
  { id: '2', name: 'Atos Jiu-Jitsu', address: 'San Diego, CA', responsible: 'Andre Galvão', responsibleRegistration: 'REG-002', professorId: '3', assistantIds: ['4'] },
];

let users: User[] = [
  { id: '1', name: 'Admin Geral', email: 'androiddiviana@gmail.com', role: 'general_admin', birthDate: '1985-08-10' },
  { id: '2', name: 'Admin Gracie', email: 'admin@gracie.com', role: 'academy_admin', academyId: '1', birthDate: '1988-05-25' },
  { id: '3', name: 'Admin Atos', email: 'admin@atos.com', role: 'academy_admin', academyId: '2' },
  { id: '4', name: 'Carlos Gracie (Aluno)', email: 'carlos@aluno.com', role: 'student', studentId: '1', academyId: '1' },
];

let news: NewsArticle[] = [
    { id: '1', title: 'Novas Regras de Competição IBJJF 2024', content: 'A IBJJF anunciou novas regras para competições a partir de agosto de 2024, focando na segurança dos atletas...', imageUrl: 'https://picsum.photos/800/400?random=1', date: '2024-07-15' },
    { id: '2', title: 'Campeonato Mundial de Jiu-Jitsu: Destaques e Resultados', content: 'Ocorreu no último final de semana o Campeonato Mundial, com lutas emocionantes e novos campeões coroados...', imageUrl: 'https://picsum.photos/800/400?random=2', date: '2024-06-28' },
];

let attendanceRecords: AttendanceRecord[] = [
    { id: 'att1', studentId: '1', scheduleId: '1', date: '2024-07-29', status: 'present' },
    { id: 'att2', studentId: '1', scheduleId: '4', date: '2024-07-26', status: 'present' },
    { id: 'att3', studentId: '1', scheduleId: '1', date: '2024-07-22', status: 'absent' },
    { id: 'att4', studentId: '1', scheduleId: '4', date: '2024-07-19', status: 'present' },
    { id: 'att5', studentId: '1', scheduleId: '1', date: '2024-07-15', status: 'present' },
    { id: 'att6', studentId: '2', scheduleId: '1', date: '2024-07-29', status: 'present' },
    { id: 'att7', studentId: '2', scheduleId: '4', date: '2024-07-26', status: 'absent' },
];


const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 500));

export const api = {
  login: (email: string, pass: string): Promise<User | null> => {
    if (email === 'androiddiviana@gmail.com' && pass === 'dvsviana') {
        return simulateDelay(users.find(u => u.email === email) || null);
    }
    const user = users.find(u => u.email === email);
    return simulateDelay(user || null);
  },
  getStudents: () => simulateDelay(students),
  getAcademies: () => simulateDelay(academies),
  getUsers: () => simulateDelay(users),
  getNews: () => simulateDelay(news),
  getGraduations: () => simulateDelay(graduations),
  getSchedules: () => simulateDelay(schedules),
  getAttendanceRecords: () => simulateDelay(attendanceRecords),
  
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid'): Promise<Student> => {
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    const studentToUpdate = { ...students[studentIndex] };
    studentToUpdate.paymentStatus = status;

    if (status === 'paid') {
      const newPayment: Payment = {
        id: String(Date.now()),
        date: new Date().toISOString().split('T')[0],
        amount: 150.00, // Assuming a fixed amount
      };
      studentToUpdate.paymentHistory = [...(studentToUpdate.paymentHistory || []), newPayment];
    }
    
    students[studentIndex] = studentToUpdate;
    
    return simulateDelay(studentToUpdate);
  },
  
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }): Promise<Student> => {
    if (student.id) {
        let existingStudent = students.find(s => s.id === student.id);
        if (!existingStudent) throw new Error("Student not found");
        const updatedStudent = { ...existingStudent, ...student };
        students = students.map(s => s.id === student.id ? updatedStudent : s);
        return simulateDelay(updatedStudent);
    } else {
        const newStudent: Student = {
            ...student,
            id: String(Date.now()),
            paymentStatus: 'unpaid',
            lastSeen: new Date().toISOString().split('T')[0],
            paymentHistory: [],
            fjjpe_registration: student.fjjpe_registration || `FJJPE-${Math.floor(Math.random() * 1000)}`,
            paymentDueDateDay: student.paymentDueDateDay || 10,
        };
        students.push(newStudent);
        return simulateDelay(newStudent);
    }
  },

  deleteStudent: (studentId: string): Promise<{ success: boolean }> => {
    students = students.filter(s => s.id !== studentId);
    return simulateDelay({ success: true });
  },

  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }): Promise<Academy> => {
    if (academy.id) {
        let existing = academies.find(a => a.id === academy.id);
        if (!existing) throw new Error("Academy not found");
        const updated = { ...existing, ...academy };
        academies = academies.map(a => a.id === academy.id ? updated : a);
        return simulateDelay(updated);
    } else {
        const newAcademy: Academy = { 
            ...academy, 
            id: String(Date.now()), 
            assistantIds: academy.assistantIds || [] 
        };
        academies.push(newAcademy);
        return simulateDelay(newAcademy);
    }
  },

  deleteAcademy: (id: string): Promise<{ success: boolean }> => {
    academies = academies.filter(a => a.id !== id);
    return simulateDelay({ success: true });
  },

  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }): Promise<Graduation> => {
    if (grad.id) {
        let existing = graduations.find(g => g.id === grad.id);
        if (!existing) throw new Error("Graduation not found");
        const updated = { ...existing, ...grad };
        graduations = graduations.map(g => g.id === grad.id ? updated : g);
        return simulateDelay(updated);
    } else {
        const newGrad: Graduation = { ...grad, id: String(Date.now()) } as Graduation;
        graduations.push(newGrad);
        return simulateDelay(newGrad);
    }
  },

  deleteGraduation: (id: string): Promise<{ success: boolean }> => {
    graduations = graduations.filter(g => g.id !== id);
    return simulateDelay({ success: true });
  },

  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }): Promise<ClassSchedule> => {
    if (schedule.id) {
        let existing = schedules.find(s => s.id === schedule.id);
        if (!existing) throw new Error("Schedule not found");
        const updated = { ...existing, ...schedule };
        schedules = schedules.map(s => s.id === schedule.id ? updated : s);
        return simulateDelay(updated);
    } else {
        const newSchedule: ClassSchedule = { ...schedule, id: String(Date.now()) } as ClassSchedule;
        schedules.push(newSchedule);
        return simulateDelay(newSchedule);
    }
  },

  deleteSchedule: (id: string): Promise<{ success: boolean }> => {
    schedules = schedules.filter(s => s.id !== id);
    return simulateDelay({ success: true });
  },
  
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'> & { id?: string }): Promise<AttendanceRecord> => {
    const existingIndex = attendanceRecords.findIndex(
        r => r.studentId === record.studentId && r.scheduleId === record.scheduleId && r.date === record.date
    );

    if (existingIndex > -1) {
        const updatedRecord = { ...attendanceRecords[existingIndex], status: record.status };
        attendanceRecords[existingIndex] = updatedRecord;
        return simulateDelay(updatedRecord);
    } else {
        const newRecord: AttendanceRecord = {
            ...record,
            id: String(Date.now() + Math.random()),
        };
        attendanceRecords.push(newRecord);
        return simulateDelay(newRecord);
    }
  },

  deleteAttendanceRecord: (id: string): Promise<{ success: boolean }> => {
    attendanceRecords = attendanceRecords.filter(r => r.id !== id);
    return simulateDelay({ success: true });
  },
};
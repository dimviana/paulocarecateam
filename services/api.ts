import { Student, Academy, User, NewsArticle, Graduation, ClassSchedule, Payment, AttendanceRecord, Professor, ActivityLog } from '../types';

let graduations: Graduation[] = [
  // Kids
  { id: '8', name: 'Cinza', color: '#808080', minTimeInMonths: 0, rank: 1, type: 'kids', minAge: 4, maxAge: 6 },
  { id: '9', name: 'Amarela', color: '#FFFF00', minTimeInMonths: 0, rank: 2, type: 'kids', minAge: 7, maxAge: 15 },
  { id: '10', name: 'Laranja', color: '#FFA500', minTimeInMonths: 0, rank: 3, type: 'kids', minAge: 10, maxAge: 15 },
  { id: '11', name: 'Verde', color: '#008000', minTimeInMonths: 0, rank: 4, type: 'kids', minAge: 13, maxAge: 15 },
  // Adults
  { id: '1', name: 'Branca', color: '#FFFFFF', minTimeInMonths: 0, rank: 5, type: 'adult' },
  { id: '2', name: 'Azul', color: '#0000FF', minTimeInMonths: 12, rank: 6, type: 'adult' }, // Min time from white for adults, or from green at 16 for kids.
  { id: '3', name: 'Roxa', color: '#800080', minTimeInMonths: 24, rank: 7, type: 'adult' },
  { id: '4', name: 'Marrom', color: '#A52A2A', minTimeInMonths: 18, rank: 8, type: 'adult' },
  { id: '5', name: 'Preta', color: '#000000', minTimeInMonths: 12, rank: 9, type: 'adult' },
  { id: '6', name: 'Coral', color: '#FF7F50', minTimeInMonths: 36, rank: 10, type: 'adult' },
  { id: '7', name: 'Vermelha', color: '#FF0000', minTimeInMonths: 60, rank: 11, type: 'adult' },
];

let schedules: ClassSchedule[] = [
    { id: '1', className: 'Jiu-Jitsu Adulto (Iniciante)', dayOfWeek: 'Segunda-feira', startTime: '19:00', endTime: '20:30', professorId: '1', assistantIds: ['2'], academyId: '1', requiredGraduationId: '1' },
    { id: '2', className: 'Jiu-Jitsu Kids', dayOfWeek: 'Terça-feira', startTime: '18:00', endTime: '19:00', professorId: '3', assistantIds: ['4'], academyId: '2', requiredGraduationId: '1' },
    { id: '3', className: 'Jiu-Jitsu Adulto (Avançado)', dayOfWeek: 'Quarta-feira', startTime: '20:00', endTime: '21:30', professorId: '1', assistantIds: [], academyId: '1', requiredGraduationId: '3' },
    { id: '4', className: 'Jiu-Jitsu Adulto (Todos)', dayOfWeek: 'Sexta-feira', startTime: '19:00', endTime: '20:30', professorId: '1', assistantIds: ['2'], academyId: '1', requiredGraduationId: '1' },
];

let students: Student[] = [
  { id: '1', name: 'Carlos Gracie', email: 'carlos@aluno.com', password: '123', imageUrl: 'https://i.pravatar.cc/150?u=111.111.111-11', birthDate: '1990-08-15', cpf: '111.111.111-11', fjjpe_registration: 'FJJPE-001', phone: '5511999999991', address: 'Rua do Tatame, 123', beltId: '7', academyId: '1', firstGraduationDate: '2010-01-20', lastPromotionDate: '2020-01-20', paymentStatus: 'paid', lastSeen: '2024-07-28', paymentHistory: [{id: 'p1', date: '2024-07-05', amount: 150}], paymentDueDateDay: 5, stripes: 4 },
  { id: '2', name: 'Hélio Gracie', email: 'helio@aluno.com', password: '123', imageUrl: 'https://i.pravatar.cc/150?u=222.222.222-22', birthDate: '1992-07-20', cpf: '222.222.222-22', fjjpe_registration: 'FJJPE-002', phone: '5511999999992', address: 'Avenida Ippon, 456', beltId: '5', academyId: '1', firstGraduationDate: '2012-03-10', lastPromotionDate: '2021-04-01', paymentStatus: 'paid', lastSeen: '2024-07-27', paymentHistory: [{id: 'p2', date: '2024-06-05', amount: 150}], paymentDueDateDay: 10, stripes: 4 },
  { id: '3', name: 'Royce Gracie', email: 'royce@aluno.com', password: '123', imageUrl: 'https://i.pravatar.cc/150?u=333.333.333-33', birthDate: '1995-01-30', cpf: '333.333.333-33', fjjpe_registration: 'FJJPE-003', phone: '5511999999993', address: 'Travessa da Luta, 789', beltId: '3', academyId: '2', firstGraduationDate: '2018-06-01', lastPromotionDate: '2023-08-01', paymentStatus: 'paid', lastSeen: '2024-07-29', paymentHistory: [], paymentDueDateDay: 15, stripes: 1 },
  { id: '4', name: 'Rickson Gracie', email: 'rickson@aluno.com', password: '123', imageUrl: 'https://i.pravatar.cc/150?u=444.444.444-44', birthDate: '1988-08-21', cpf: '444.444.444-44', fjjpe_registration: 'FJJPE-004', phone: '5511999999994', address: 'Alameda do Armlock, 101', beltId: '4', academyId: '2', firstGraduationDate: '2015-11-15', lastPromotionDate: '2022-01-15', paymentStatus: 'paid', lastSeen: '2024-07-29', paymentHistory: [], paymentDueDateDay: 20, stripes: 2 },
  { id: '5', name: 'Criança Exemplo', email: 'kid@aluno.com', password: '123', imageUrl: 'https://i.pravatar.cc/150?u=555.123.456-78', birthDate: '2014-07-15', cpf: '555.123.456-78', fjjpe_registration: 'FJJPE-005', phone: '5511999999995', address: 'Rua do Kimono, 123', beltId: '9', academyId: '1', firstGraduationDate: '2020-01-20', lastPromotionDate: '2022-08-15', paymentStatus: 'paid', lastSeen: '2024-07-28', paymentHistory: [{id: 'p5', date: '2024-07-05', amount: 150}], paymentDueDateDay: 5, stripes: 4 },
];

let academies: Academy[] = [
  { id: '1', name: 'Gracie Humaitá', address: 'Rio de Janeiro, RJ', responsible: 'Royler Gracie', responsibleRegistration: 'REG-001', professorId: '1', assistantIds: ['2'], imageUrl: 'https://i.imgur.com/8L3h7M0.png' },
  { id: '2', name: 'Atos Jiu-Jitsu', address: 'San Diego, CA', responsible: 'Andre Galvão', responsibleRegistration: 'REG-002', professorId: '3', assistantIds: ['4'], imageUrl: 'https://i.imgur.com/O6G3g5I.png' },
];

let professors: Professor[] = [
    { id: '1', name: 'Royler Gracie', fjjpe_registration: 'PROF-001', cpf: '555.555.555-55', academyId: '1', graduationId: '7', imageUrl: `https://i.pravatar.cc/150?u=555.555.555-55`, blackBeltDate: '1975-07-30' },
    { id: '2', name: 'Andre Galvão', fjjpe_registration: 'PROF-002', cpf: '666.666.666-66', academyId: '2', graduationId: '5', imageUrl: `https://i.pravatar.cc/150?u=666.666.666-66`, blackBeltDate: '2004-07-30' },
];

let users: User[] = [
  { id: '1', name: 'Admin Geral', email: 'androiddiviana@gmail.com', role: 'general_admin', birthDate: '1985-08-10' },
  { id: '2', name: 'Admin Gracie', email: 'admin@gracie.com', role: 'academy_admin', academyId: '1', birthDate: '1988-05-25' },
  { id: '3', name: 'Admin Atos', email: 'admin@atos.com', role: 'academy_admin', academyId: '2' },
  { id: '4', name: 'Carlos Gracie (Aluno)', email: 'carlos@aluno.com', role: 'student', studentId: '1', academyId: '1' },
  { id: 'user-2', name: 'Hélio Gracie (Aluno)', email: 'helio@aluno.com', role: 'student', studentId: '2', academyId: '1' },
  { id: 'user-3', name: 'Royce Gracie (Aluno)', email: 'royce@aluno.com', role: 'student', studentId: '3', academyId: '2' },
  { id: 'user-4', name: 'Rickson Gracie (Aluno)', email: 'rickson@aluno.com', role: 'student', studentId: '4', academyId: '2' },
  { id: 'user-5', name: 'Criança Exemplo (Aluno)', email: 'kid@aluno.com', role: 'student', studentId: '5', academyId: '1' },
];

let news: NewsArticle[] = [
    { id: '1', title: 'Novas Regras de Competição IBJJF 2024', content: 'A IBJJF anunciou novas regras para competições a partir de agosto de 2024, focando na segurança dos atletas...', imageUrl: 'https://picsum.photos/800/400?random=1', date: '2024-07-15' },
    { id: '2', title: 'Campeonato Mundial de Jiu-Jitsu: Destaques e Resultados', content: 'Ocorreu no último final de semana o Campeonato Mundial, com lutas emocionantes e novos campeões coroados...', imageUrl: 'https://picsum.photos/800/400?random=2', date: '2024-06-28' },
];

let attendanceRecords: AttendanceRecord[] = [
    { id: 'att1', studentId: '1', scheduleId: '1', date: '2024-07-29', status: 'present' },
    { id: 'att2', studentId: '1', scheduleId: '4', date: '2024-07-26', status: 'present' },
    { id: 'att3', studentId: '1', scheduleId: '1', date: '2024-07-22', status: 'absent' },
    { id: 'att_h1', studentId: '2', scheduleId: '1', date: '2024-07-29', status: 'present' },
    { id: 'att_h2', studentId: '2', scheduleId: '4', date: '2024-07-26', status: 'present' },
    { id: 'att_h3', studentId: '2', scheduleId: '1', date: '2024-07-22', status: 'present' },
    { id: 'att_h4', studentId: '2', scheduleId: '4', date: '2024-07-19', status: 'present' },
    { id: 'att_h5', studentId: '2', scheduleId: '1', date: '2024-07-15', status: 'absent' },
    { id: 'att_h6', studentId: '2', scheduleId: '4', date: '2024-07-12', status: 'present' },
    { id: 'att_h7', studentId: '2', scheduleId: '1', date: '2024-07-08', status: 'present' },
    { id: 'att_h8', studentId: '2', scheduleId: '4', date: '2024-07-05', status: 'present' },
    { id: 'att_h9', studentId: '2', scheduleId: '1', date: '2024-07-01', status: 'present' },
    { id: 'att_c1', studentId: '5', scheduleId: '2', date: '2024-07-30', status: 'present' },
    { id: 'att_c2', studentId: '5', scheduleId: '2', date: '2024-07-23', status: 'present' },
    { id: 'att_c3', studentId: '5', scheduleId: '2', date: '2024-07-16', status: 'present' },
    { id: 'att_c4', studentId: '5', scheduleId: '2', date: '2024-07-09', status: 'present' },
    { id: 'att_c5', studentId: '5', scheduleId: '2', date: '2024-07-02', status: 'absent' },
];

let activityLogs: ActivityLog[] = [
    { id: 'log1', actorId: '1', action: 'Login', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), details: 'Admin Geral realizou login no sistema.'},
    { id: 'log2', actorId: '2', action: 'Atualização de Aluno', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), details: 'Admin Gracie atualizou o status de pagamento de Hélio Gracie para "Pendente".'}
];

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 500));

const logActivity = (actorId: string, action: string, details: string) => {
    const newLog: ActivityLog = {
        id: `log${Date.now()}${Math.random()}`,
        actorId,
        action,
        timestamp: new Date().toISOString(),
        details,
    };
    activityLogs.unshift(newLog); // Add to the beginning of the array
};

export const api = {
  login: (emailOrCpf: string, pass: string): Promise<{ token: string | null }> => {
    let userToLog: User | undefined;

    // First, try to log in a student by email/cpf and password
    const student = students.find(s => (s.email === emailOrCpf || s.cpf === emailOrCpf) && s.password === pass);

    if (student) {
        // If a student is found, find their corresponding user account
        userToLog = users.find(u => u.studentId === student.id);
    } else {
        // If not a student, check for admin/professor accounts (mocking password check)
        if (emailOrCpf === 'androiddiviana@gmail.com' && pass === 'dvsviana') {
            userToLog = users.find(u => u.email === emailOrCpf);
        } else {
            // For other mock admins, just check email
            userToLog = users.find(u => u.email === emailOrCpf && u.role !== 'student');
        }
    }
    
    if (userToLog) {
        logActivity(userToLog.id, 'Login', `${userToLog.name} realizou login.`);
        const payload = {
            userId: userToLog.id,
            iat: Date.now(),
            exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hour expiration
        };
        const token = btoa(JSON.stringify(payload));
        return simulateDelay({ token });
    }

    return simulateDelay({ token: null });
  },
  getStudents: () => simulateDelay(students),
  getAcademies: () => simulateDelay(academies),
  getUsers: () => simulateDelay(users),
  getNews: () => simulateDelay(news),
  getGraduations: () => simulateDelay(graduations),
  getSchedules: () => simulateDelay(schedules),
  getAttendanceRecords: () => simulateDelay(attendanceRecords),
  getProfessors: () => simulateDelay(professors),
  getActivityLogs: () => simulateDelay(activityLogs),
  
  updateStudentPayment: (studentId: string, status: 'paid' | 'unpaid', amount: number, actorId: string): Promise<Student> => {
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
        amount: amount,
      };
      studentToUpdate.paymentHistory = [...(studentToUpdate.paymentHistory || []), newPayment];
    }
    
    students[studentIndex] = studentToUpdate;

    const actor = users.find(u => u.id === actorId);
    if (actor) {
        let details = '';
        if (actor.role === 'student') {
            details = `${studentToUpdate.name} registrou o pagamento de sua mensalidade (comprovante anexado).`;
        } else {
            details = `${actor.name} atualizou o status de pagamento de ${studentToUpdate.name} para "${status === 'paid' ? 'Em Dia' : 'Pendente'}".`;
        }
        logActivity(actorId, 'Pagamento', details);
    }
    
    return simulateDelay(studentToUpdate);
  },
  
  saveStudent: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }, actorId: string): Promise<Student> => {
    const actor = users.find(u => u.id === actorId);
    if (student.id) { // Editing existing student
        const studentIndex = students.findIndex(s => s.id === student.id);
        if (studentIndex === -1) throw new Error("Student not found");

        const existingStudent = students[studentIndex];
        
        // Keep old password if new one is empty or undefined
        const studentWithPassword = { ...student };
        if (!studentWithPassword.password) {
            studentWithPassword.password = existingStudent.password;
        }

        const updatedStudent = { ...existingStudent, ...studentWithPassword };
        students = students.map((s, i) => i === studentIndex ? updatedStudent : s);
        
        if (updatedStudent.beltId !== existingStudent.beltId) {
            const newBelt = graduations.find(g => g.id === updatedStudent.beltId);
            logActivity(actorId || 'system', 'Promoção de Faixa', `${actor?.name || 'Sistema'} promoveu ${updatedStudent.name} para a faixa ${newBelt?.name}.`);
            
            // Auto-promote to professor on black belt
            if (newBelt?.name === 'Preta') {
                const existingProfessor = professors.find(p => p.cpf === updatedStudent.cpf);
                if (!existingProfessor) {
                    const newProfessor: Professor = {
                        id: `prof-${updatedStudent.id}`,
                        name: updatedStudent.name,
                        fjjpe_registration: updatedStudent.fjjpe_registration,
                        cpf: updatedStudent.cpf,
                        academyId: updatedStudent.academyId,
                        graduationId: updatedStudent.beltId,
                        imageUrl: updatedStudent.imageUrl,
                        blackBeltDate: new Date().toISOString().split('T')[0],
                    };
                    professors.push(newProfessor);
                    logActivity(actorId || 'system', 'Promoção a Professor', `${updatedStudent.name} foi automaticamente promovido a professor ao atingir a faixa preta.`);
                }
            }
        }

        // Update corresponding user record
        const userIndex = users.findIndex(u => u.studentId === student.id);
        if (userIndex > -1) {
            users[userIndex].name = `${student.name} (Aluno)`;
            users[userIndex].email = student.email;
        }

        if (actor && updatedStudent.beltId === existingStudent.beltId) {
            logActivity(actorId, 'Atualização de Aluno', `${actor.name} atualizou os dados de ${student.name}.`);
        }
        return simulateDelay(updatedStudent);

    } else { // Creating new student
        const newStudent: Student = {
            ...student,
            id: String(Date.now()),
            paymentStatus: 'unpaid',
            lastSeen: new Date().toISOString().split('T')[0],
            paymentHistory: [],
            fjjpe_registration: student.fjjpe_registration || `FJJPE-${Math.floor(Math.random() * 1000)}`,
            paymentDueDateDay: student.paymentDueDateDay || 10,
            password: student.password || '123',
            stripes: student.stripes || 0,
        };
        students.push(newStudent);

        // Create a new user record for the student
        const newUserForStudent: User = {
            id: `user-${newStudent.id}`,
            name: `${newStudent.name} (Aluno)`,
            email: newStudent.email,
            role: 'student',
            studentId: newStudent.id,
            academyId: newStudent.academyId,
        };
        users.push(newUserForStudent);

        if (actor) logActivity(actorId, 'Criação de Aluno', `${actor.name} cadastrou o novo aluno ${student.name}.`);
        return simulateDelay(newStudent);
    }
  },

  deleteStudent: (studentId: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const student = students.find(s => s.id === studentId);
    if (actor && student) logActivity(actorId, 'Exclusão de Aluno', `${actor.name} excluiu o aluno ${student.name}.`);
    
    // Also delete the corresponding user account
    users = users.filter(u => u.studentId !== studentId);
    students = students.filter(s => s.id !== studentId);
    
    return simulateDelay({ success: true });
  },

  saveAcademy: (academy: Omit<Academy, 'id'> & { id?: string }, actorId: string): Promise<Academy> => {
    const actor = users.find(u => u.id === actorId);
    if (academy.id) {
        let existing = academies.find(a => a.id === academy.id);
        if (!existing) throw new Error("Academy not found");
        const updated = { ...existing, ...academy };
        academies = academies.map(a => a.id === academy.id ? updated : a);
        if (actor) logActivity(actorId, 'Atualização de Academia', `${actor.name} atualizou os dados da academia ${academy.name}.`);
        return simulateDelay(updated);
    } else {
        const newAcademy: Academy = { 
            ...academy, 
            id: String(Date.now()), 
            assistantIds: academy.assistantIds || [] 
        };
        academies.push(newAcademy);
        if (actor) logActivity(actorId, 'Criação de Academia', `${actor.name} cadastrou a nova academia ${academy.name}.`);
        return simulateDelay(newAcademy);
    }
  },

  deleteAcademy: (id: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const academy = academies.find(a => a.id === id);
    if (actor && academy) logActivity(actorId, 'Exclusão de Academia', `${actor.name} excluiu a academia ${academy.name}.`);
    academies = academies.filter(a => a.id !== id);
    return simulateDelay({ success: true });
  },

  saveGraduation: (grad: Omit<Graduation, 'id'> & { id?: string }, actorId: string): Promise<Graduation> => {
    const actor = users.find(u => u.id === actorId);
    if (grad.id) {
        let existing = graduations.find(g => g.id === grad.id);
        if (!existing) throw new Error("Graduation not found");
        const updated = { ...existing, ...grad };
        graduations = graduations.map(g => g.id === grad.id ? updated : g);
        if(actor) logActivity(actorId, 'Atualização de Graduação', `${actor.name} atualizou a graduação ${grad.name}.`);
        return simulateDelay(updated);
    } else {
        const newGrad: Graduation = { ...grad, id: String(Date.now()) } as Graduation;
        graduations.push(newGrad);
        if(actor) logActivity(actorId, 'Criação de Graduação', `${actor.name} criou a graduação ${grad.name}.`);
        return simulateDelay(newGrad);
    }
  },
  
  updateGraduationRanks: (gradsWithNewRanks: { id: string, rank: number }[], actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    gradsWithNewRanks.forEach(({ id, rank }) => {
        const grad = graduations.find(g => g.id === id);
        if (grad) {
            grad.rank = rank;
        }
    });
    if (actor) logActivity(actorId, 'Reordenação de Graduações', `${actor.name} reordenou as faixas.`);
    return simulateDelay({ success: true });
  },

  deleteGraduation: (id: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const grad = graduations.find(g => g.id === id);
    if (actor && grad) logActivity(actorId, 'Exclusão de Graduação', `${actor.name} excluiu a graduação ${grad.name}.`);
    graduations = graduations.filter(g => g.id !== id);
    return simulateDelay({ success: true });
  },

  saveSchedule: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }, actorId: string): Promise<ClassSchedule> => {
    const actor = users.find(u => u.id === actorId);
    if (schedule.id) {
        let existing = schedules.find(s => s.id === schedule.id);
        if (!existing) throw new Error("Schedule not found");
        const updated = { ...existing, ...schedule };
        schedules = schedules.map(s => s.id === schedule.id ? updated : s);
        if (actor) logActivity(actorId, 'Atualização de Horário', `${actor.name} atualizou o horário da turma ${schedule.className}.`);
        return simulateDelay(updated);
    } else {
        const newSchedule: ClassSchedule = { ...schedule, id: String(Date.now()) } as ClassSchedule;
        schedules.push(newSchedule);
        if (actor) logActivity(actorId, 'Criação de Horário', `${actor.name} criou o horário para a turma ${schedule.className}.`);
        return simulateDelay(newSchedule);
    }
  },

  deleteSchedule: (id: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const schedule = schedules.find(s => s.id === id);
    if(actor && schedule) logActivity(actorId, 'Exclusão de Horário', `${actor.name} excluiu o horário da turma ${schedule.className}.`);
    schedules = schedules.filter(s => s.id !== id);
    return simulateDelay({ success: true });
  },
  
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'> & { id?: string }, actorId: string): Promise<AttendanceRecord> => {
    const existingIndex = attendanceRecords.findIndex(
        r => r.studentId === record.studentId && r.scheduleId === record.scheduleId && r.date === record.date
    );
    const actor = users.find(u => u.id === actorId);
    const student = students.find(s => s.id === record.studentId);
    
    if (actor && student) {
        logActivity(actorId, 'Registro de Frequência', `${actor.name} registrou a frequência de ${student.name} como "${record.status === 'present' ? 'Presente' : 'Ausente'}" no dia ${record.date}.`);
    }

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

  deleteAttendanceRecord: (id: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const record = attendanceRecords.find(r => r.id === id);
    if(record) {
        const student = students.find(s => s.id === record.studentId);
        if (actor && student) logActivity(actorId, 'Exclusão de Frequência', `${actor.name} removeu um registro de frequência de ${student.name} do dia ${record.date}.`);
    }
    attendanceRecords = attendanceRecords.filter(r => r.id !== id);
    return simulateDelay({ success: true });
  },

  saveProfessor: (prof: Omit<Professor, 'id'> & { id?: string }, actorId: string): Promise<Professor> => {
    const actor = users.find(u => u.id === actorId);
    if (prof.id) {
        let existing = professors.find(p => p.id === prof.id);
        if (!existing) throw new Error("Professor not found");
        const updated = { ...existing, ...prof };
        professors = professors.map(p => p.id === prof.id ? updated : p);
        if(actor) logActivity(actorId, 'Atualização de Professor', `${actor.name} atualizou os dados do professor ${prof.name}.`);
        return simulateDelay(updated);
    } else {
        const newProfessor: Professor = { ...prof, id: String(Date.now()) } as Professor;
        professors.push(newProfessor);
        if(actor) logActivity(actorId, 'Criação de Professor', `${actor.name} cadastrou o novo professor ${prof.name}.`);
        return simulateDelay(newProfessor);
    }
  },

  deleteProfessor: (id: string, actorId: string): Promise<{ success: boolean }> => {
    const actor = users.find(u => u.id === actorId);
    const prof = professors.find(p => p.id === id);
    if(actor && prof) logActivity(actorId, 'Exclusão de Professor', `${actor.name} excluiu o professor ${prof.name}.`);
    professors = professors.filter(p => p.id !== id);
    return simulateDelay({ success: true });
  },
};
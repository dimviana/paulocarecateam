

import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import StudentBreakdownChart from '../components/charts/PaymentsChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import Button from '../components/ui/Button';
import { IconUsers, IconBriefcase, IconBookOpen, IconChevronDown, IconGift } from '../constants';
import { DayOfWeek } from '../types';
import StudentDashboard from './StudentDashboard';

// --- Helper Functions ---
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

// --- Sub-components for Dashboard ---

const BirthdayCard: React.FC = () => {
    const { students, users } = useContext(AppContext);

    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const birthdayStudents = students.filter(s => s.birthDate && s.birthDate.substring(5) === todayMonthDay);
    const birthdayUsers = users.filter(u => u.role !== 'student' && u.birthDate && u.birthDate.substring(5) === todayMonthDay);

    const allBirthdays = [
        ...birthdayStudents.map(s => ({ name: s.name, type: 'Aluno' })),
        ...birthdayUsers.map(u => ({ name: u.name, type: 'Professor' }))
    ];

    if (allBirthdays.length === 0) {
        return null;
    }

    return (
        <Card>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                <IconGift className="w-5 h-5 mr-2 text-amber-500" />
                Aniversariantes de Hoje
            </h3>
            <div className="space-y-3">
                {allBirthdays.map((person, index) => (
                    <div key={index} className="flex items-center p-2 bg-amber-50 rounded-md">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-amber-600 font-bold">{person.name.charAt(0)}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700 truncate">{person.name}</p>
                            <p className="text-xs text-slate-500">{person.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <Card className={`flex items-center p-4`}>
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}1A`}}>
            <div style={{ color: color }}>{icon}</div>
        </div>
        <div className="ml-4">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </Card>
);

const StudentPerformanceTable: React.FC = () => {
    const { students } = useContext(AppContext);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Turma</th>
                        <th scope="col" className="px-6 py-3">Nota</th>
                    </tr>
                </thead>
                <tbody>
                    {students.slice(0, 4).map(student => (
                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center">
                                <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-8 h-8 rounded-full mr-3" />
                                {student.name}
                            </td>
                            <td className="px-6 py-4">{student.fjjpe_registration}</td>
                            <td className="px-6 py-4">Turma {Math.floor(Math.random() * (12 - 9 + 1)) + 9}</td>
                            <td className="px-6 py-4 font-medium">{['A', 'B', 'A'][Math.floor(Math.random()*3)]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CommunityCard: React.FC = () => (
    <Card className="bg-amber-400 text-center text-white relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="absolute -bottom-8 -left-2 w-24 h-24 border-4 border-white/20 rounded-full"></div>
        <h3 className="text-xl font-bold mb-2 relative">Junte-se à comunidade e descubra mais</h3>
        <Button variant="secondary" className="bg-white/90 text-amber-600 hover:bg-white">Explorar Agora</Button>
    </Card>
);

const dayNameToIndex: { [key in DayOfWeek]: number } = {
    'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3,
    'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
};

interface CalendarWidgetProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onDateChange }) => {
    const { schedules } = useContext(AppContext);
    
    const scheduledDayIndices = useMemo(() => new Set(schedules.map(s => dayNameToIndex[s.dayOfWeek])), [schedules]);
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const calendarCells = useMemo(() => {
        const cells = [];
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push(i);
        }
        return cells;
    }, [year, month]);
    
    const changeMonth = (offset: number) => {
        const dayOfMonth = selectedDate.getDate();
        const newDate = new Date(year, month + offset, 1);
        const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
        newDate.setDate(Math.min(dayOfMonth, daysInNewMonth));
        onDateChange(newDate);
    };
    
    const today = new Date();

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 capitalize">{selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex space-x-2">
                    <button onClick={() => changeMonth(-1)} className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100">&lt;</button>
                    <button onClick={() => changeMonth(1)} className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100">&gt;</button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center text-sm text-slate-500">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={`${d}-${i}`} className="py-2 font-semibold">{d}</div>)}
                {calendarCells.map((d, i) => {
                    if (d === null) return <div key={`empty-${i}`}></div>;
                    const dayDate = new Date(year, month, d);
                    const isToday = toYYYYMMDD(dayDate) === toYYYYMMDD(today);
                    const isSelected = toYYYYMMDD(dayDate) === toYYYYMMDD(selectedDate);
                    const hasSchedule = scheduledDayIndices.has(dayDate.getDay());

                    return (
                        <div key={i}
                            onClick={() => onDateChange(dayDate)}
                            className={`py-2 rounded-full relative flex items-center justify-center cursor-pointer transition-colors
                            ${isSelected ? 'bg-amber-500 text-white font-bold' : isToday ? 'bg-slate-200' : 'hover:bg-slate-100'}`}>
                            {d}
                            {hasSchedule && !isSelected && <span className="absolute bottom-1 h-1.5 w-1.5 bg-amber-400 rounded-full"></span>}
                        </div>
                    )
                })}
            </div>
        </Card>
    );
};

interface AulasDoDiaProps {
    selectedDate: Date;
}
const AulasDoDia: React.FC<AulasDoDiaProps> = ({ selectedDate }) => {
    const { schedules, users } = useContext(AppContext);
    
    const DAYS_OF_WEEK_MAP: { [key: number]: DayOfWeek } = { 0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado' };
    const isToday = toYYYYMMDD(new Date()) === toYYYYMMDD(selectedDate);
    
    const selectedDayOfWeek = DAYS_OF_WEEK_MAP[selectedDate.getDay()];
    
    const selectedSchedules = schedules
        .filter(s => s.dayOfWeek === selectedDayOfWeek)
        .sort((a,b) => a.startTime.localeCompare(b.startTime));

    const title = isToday ? "Aulas de Hoje" : `Aulas para ${selectedDate.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}`;

    return (
        <Card>
            <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
            <div className="space-y-4">
                {selectedSchedules.length > 0 ? selectedSchedules.map(schedule => {
                    const professor = users.find(u => u.id === schedule.professorId);
                    return (
                        <div key={schedule.id} className="p-3 bg-amber-500/10 rounded-lg">
                            <p className="font-semibold text-amber-700">{schedule.className}</p>
                            <p className="text-sm text-amber-600">{schedule.startTime} - {schedule.endTime}{professor && ` | Prof. ${professor.name}`}</p>
                        </div>
                    );
                }) : (
                    <p className="text-sm text-slate-500 text-center py-4">Nenhuma aula agendada para este dia.</p>
                )}
            </div>
        </Card>
    );
};


// --- Main Dashboard Component ---

const Dashboard: React.FC = () => {
    const { user, students, users, loading } = useContext(AppContext);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    if (loading) {
        return <div className="text-center">Carregando dados...</div>;
    }
    
    // If user is a student, show the student-specific dashboard
    if (user?.role === 'student') {
        return <StudentDashboard />;
    }

    const totalTeachers = users.filter(u => u.role !== 'student').length;

    const stats = [
        { icon: <IconUsers />, title: 'Total de Alunos', value: String(students.length), color: '#3B82F6' },
        { icon: <IconBriefcase />, title: 'Total de Professores', value: String(totalTeachers), color: '#10B981' },
        { icon: <IconBookOpen />, title: 'Total de Turmas', value: '25', color: '#8B5CF6' },
    ];

    return (
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Bom dia, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-slate-500 mt-1">Bem-vindo à Academia</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
                    </div>
                    
                    <AttendanceChart />

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-semibold text-slate-800">Desempenho dos Alunos</h3>
                             <Button variant="secondary" size="sm">Todos <IconChevronDown className="w-4 h-4 ml-1" /></Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <StudentPerformanceTable />
                            </div>
                            <div>
                                <StudentBreakdownChart />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <BirthdayCard />
                    <CommunityCard />
                    <CalendarWidget selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    <AulasDoDia selectedDate={selectedDate} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

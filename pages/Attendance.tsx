import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Student, DayOfWeek } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

// --- Constants ---
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS_OF_WEEK_MAP: { [key: number]: DayOfWeek } = { 0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado' };

// --- Helper Functions ---
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

// --- Sub-components ---

const DayScheduleModal: React.FC<{ date: Date; onClose: () => void }> = ({ date, onClose }) => {
    const { schedules, users, students, graduations, attendanceRecords, saveAttendanceRecord } = useContext(AppContext);
    const dayOfWeek = DAYS_OF_WEEK_MAP[date.getDay()];
    
    const todaysSchedules = useMemo(() => schedules.filter(s => s.dayOfWeek === dayOfWeek), [schedules, dayOfWeek]);
    const dateStr = toYYYYMMDD(date);

    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>(() => {
        const initialState: Record<string, 'present' | 'absent'> = {};
        attendanceRecords.filter(ar => ar.date === dateStr).forEach(ar => {
            initialState[`${ar.studentId}-${ar.scheduleId}`] = ar.status;
        });
        return initialState;
    });

    const handleStatusChange = (studentId: string, scheduleId: string, status: 'present' | 'absent') => {
        setAttendance(prev => ({ ...prev, [`${studentId}-${scheduleId}`]: status }));
    };

    const handleSave = async () => {
        const promises = Object.entries(attendance).map(([key, status]) => {
            const [studentId, scheduleId] = key.split('-');
            const existingRecord = attendanceRecords.find(ar => ar.studentId === studentId && ar.scheduleId === scheduleId && ar.date === dateStr);
            if (!existingRecord || existingRecord.status !== status) {
                 return saveAttendanceRecord({ studentId, scheduleId, date: dateStr, status });
            }
            return Promise.resolve();
        });
        await Promise.all(promises);
        onClose();
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Aulas de ${date.toLocaleDateString('pt-BR')}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {todaysSchedules.length > 0 ? todaysSchedules.map(schedule => {
                     const eligibleStudents = students.filter(student => {
                        if (student.academyId !== schedule.academyId) return false;
                        const studentGrad = graduations.find(g => g.id === student.beltId);
                        const requiredGrad = graduations.find(g => g.id === schedule.requiredGraduationId);
                        return (studentGrad?.rank ?? 0) >= (requiredGrad?.rank ?? 0);
                    });
                    return (
                        <div key={schedule.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <h3 className="font-bold text-red-500 dark:text-red-400">{schedule.className} ({schedule.startTime}-{schedule.endTime})</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Professor: {users.find(u => u.id === schedule.professorId)?.name}</p>
                            <div className="space-y-2">
                                {eligibleStudents.map(student => {
                                    const key = `${student.id}-${schedule.id}`;
                                    const currentStatus = attendance[key];
                                    return (
                                        <div key={student.id} className="flex justify-between items-center bg-gray-200 dark:bg-gray-700/50 p-2 rounded">
                                            <span>{student.name}</span>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleStatusChange(student.id, schedule.id, 'present')} className={currentStatus === 'present' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}>Presente</Button>
                                                <Button size="sm" onClick={() => handleStatusChange(student.id, schedule.id, 'absent')} className={currentStatus === 'absent' ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-600 hover:bg-gray-500'}>Faltou</Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }) : <p className="text-gray-500 dark:text-gray-400">Nenhuma aula agendada para este dia.</p>}
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Frequência</Button>
            </div>
        </Modal>
    );
};


const CalendarView: React.FC = () => {
    const { schedules } = useContext(AppContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentDate(new Date(year, parseInt(e.target.value), 1));
    };
    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear) && String(newYear).length === 4) {
             setCurrentDate(new Date(newYear, month, 1));
        }
    };

    const scheduledDaysInMonth = useMemo(() => {
        const monthSchedules = new Set<number>();
        schedules.forEach(schedule => {
            const dayIndex = Object.entries(DAYS_OF_WEEK_MAP).find(([_, name]) => name === schedule.dayOfWeek)?.[0];
            if(dayIndex !== undefined) {
                 const numDayIndex = parseInt(dayIndex, 10);
                 for (let day = 1; day <= 31; day++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    if (date.getMonth() === currentDate.getMonth() && date.getDay() === numDayIndex) {
                        monthSchedules.add(day);
                    }
                 }
            }
        });
        return monthSchedules;
    }, [schedules, currentDate]);

    const calendarCells = useMemo(() => {
        const cells = [];
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            cells.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
        }

        // Next month days
        const remaining = 42 - cells.length; // Fill up to 6 weeks
        for (let i = 1; i <= remaining; i++) {
            cells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
        }
        return cells;
    }, [year, month]);

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(year, month, day));
    };

    return (
        <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
            <div className="p-4 flex items-center gap-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <input
                    type="number"
                    value={year}
                    onChange={handleYearChange}
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-red-500 w-28 text-center"
                    placeholder="Ano"
                />
                <select
                    value={month}
                    onChange={handleMonthChange}
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-red-500"
                >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.toUpperCase()}</option>)}
                </select>
            </div>
            <div className="bg-gray-800 dark:bg-gray-900 text-white p-2 text-center font-bold text-lg tracking-widest">
                CALENDÁRIO {year} | {MONTH_NAMES[month].toUpperCase()}
            </div>
            <div className="grid grid-cols-7 text-center font-bold">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
                    <div key={day} className="bg-sky-700 text-white p-2 border-l border-sky-800 first:border-l-0">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {calendarCells.map((cell, index) => {
                    const dayOfWeek = cell.date.getDay();
                    const hasSchedule = cell.isCurrentMonth && scheduledDaysInMonth.has(cell.day);
                    
                    let cellBg = 'bg-transparent';
                    if (!cell.isCurrentMonth) {
                         cellBg = 'bg-gray-100 dark:bg-gray-800/50';
                    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                         cellBg = 'bg-red-500/10';
                    }

                    let textColor = 'text-gray-900 dark:text-white';
                     if (!cell.isCurrentMonth) {
                        textColor = 'text-gray-400 dark:text-gray-500';
                    }
                    
                    return (
                        <div 
                            key={cell.date.toString()}
                            onClick={() => cell.isCurrentMonth && hasSchedule && handleDayClick(cell.day)}
                            className={`h-24 p-2 border-t border-r border-gray-200 dark:border-gray-700 text-left align-top transition-colors ${cellBg} ${textColor} ${hasSchedule && cell.isCurrentMonth ? 'cursor-pointer hover:bg-red-900/50 relative' : ''}`}
                            style={{
                                borderRightWidth: (index + 1) % 7 === 0 ? '0px' : '1px'
                            }}
                        >
                            <span className="font-semibold">{cell.day}</span>
                            {hasSchedule && cell.isCurrentMonth && <span className="absolute bottom-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse"></span>}
                        </div>
                    );
                })}
            </div>
            {selectedDate && <DayScheduleModal date={selectedDate} onClose={() => setSelectedDate(null)} />}
        </Card>
    );
};


const AttendanceGrid: React.FC<{ studentId: string }> = ({ studentId }) => {
    const { attendanceRecords } = useContext(AppContext);
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const recordsByDate = useMemo(() => {
        const map = new Map<string, 'present' | 'absent'>();
        attendanceRecords
            .filter(r => r.studentId === studentId)
            .forEach(r => map.set(r.date, r.status));
        return map;
    }, [attendanceRecords, studentId]);

    const days = [];
    let currentDate = new Date(sixMonthsAgo);
    while (currentDate <= today) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (days.length === 0) return <p>Nenhum dado para exibir.</p>;
    
    const startDayOfWeek = days[0].getDay();

    return (
        <Card>
            <h3 className="text-lg font-bold text-red-500 mb-4">Grade de Frequência (últimos 6 meses)</h3>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
                 {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`pad-${i}`} className="w-4 h-4" />)}
                 {days.map(day => {
                    const dateStr = toYYYYMMDD(day);
                    const status = recordsByDate.get(dateStr);
                    let colorClass = 'bg-gray-300 dark:bg-gray-700';
                    if (status === 'present') colorClass = 'bg-green-500';
                    if (status === 'absent') colorClass = 'bg-red-600';

                    return <div key={dateStr} className={`w-4 h-4 rounded-sm ${colorClass}`} title={`${dateStr}: ${status || 'Sem registro'}`} />;
                 })}
            </div>
             <div className="flex gap-4 mt-4 text-sm items-center">
                <span>Legenda:</span>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-500"/> Presente</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-600"/> Faltou</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-700"/> Sem Registro</div>
             </div>
        </Card>
    );
};


const StudentView: React.FC = () => {
    const { students, graduations, loading } = useContext(AppContext);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Selecione um Aluno</h2>
             {loading ? <p>Carregando alunos...</p> : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {students.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        const isSelected = selectedStudentId === student.id;
                        return (
                           <div key={student.id} onClick={() => setSelectedStudentId(student.id)}
                            className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-300
                                ${isSelected ? 'border-2 border-red-500 scale-105' : 'border border-gray-200 dark:border-red-600/30 hover:border-red-500/50'}`}>
                               <div className="text-center flex flex-col items-center">
                                   <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-20 h-20 rounded-full mb-3 border-4 border-gray-200 dark:border-gray-700" />
                                   <h2 className="font-bold text-gray-900 dark:text-white">{student.name}</h2>
                                   {belt && (
                                       <div className="mt-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700/50 px-2 py-0.5 rounded-full text-xs">
                                           <span className="w-3 h-3 rounded-full mr-1.5 border border-gray-400 dark:border-gray-500" style={{ backgroundColor: belt.color }}></span>
                                           {belt.name}
                                       </div>
                                   )}
                               </div>
                           </div>
                        );
                    })}
                </div>
             )}

            {selectedStudentId && (
                <div className="mt-8">
                    <AttendanceGrid studentId={selectedStudentId} />
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const AttendancePage: React.FC = () => {
    const [view, setView] = useState<'calendar' | 'student'>('calendar');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frequência</h1>
                <div className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                    <Button size="sm" variant={view === 'calendar' ? 'primary' : 'secondary'} onClick={() => setView('calendar')}>Visão Calendário</Button>
                    <Button size="sm" variant={view === 'student' ? 'primary' : 'secondary'} onClick={() => setView('student')}>Visão por Aluno</Button>
                </div>
            </div>
            {view === 'calendar' ? <CalendarView /> : <StudentView />}
        </div>
    );
};

export default AttendancePage;
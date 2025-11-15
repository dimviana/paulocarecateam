import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { DayOfWeek, Student } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const DAYS_OF_WEEK: DayOfWeek[] = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const calculateTrainingTime = (startDateString: string): { years: number, months: number, days: number } => {
    if (!startDateString) return { years: 0, months: 0, days: 0 };
    const startDate = new Date(startDateString);
    const now = new Date();
    
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return { years, months, days };
};

const StudentDetailsModal: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => {
    const { academies, graduations } = useContext(AppContext);
    const academy = academies.find(a => a.id === student.academyId);
    const graduation = graduations.find(g => g.id === student.beltId);
    const trainingTime = calculateTrainingTime(student.firstGraduationDate);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Detalhes de ${student.name}`}>
            <div className="space-y-4 text-gray-300">
                <p><strong>Academia:</strong> {academy?.name}</p>
                <p className="flex items-center"><strong>Graduação:</strong> 
                    {graduation && <span className="w-4 h-4 rounded-full mx-2 border border-gray-500" style={{ backgroundColor: graduation.color }}></span>}
                    {graduation?.name}
                </p>
                <p><strong>Tempo de Treino:</strong> {trainingTime.years} anos, {trainingTime.months} meses e {trainingTime.days} dias</p>
                 <p><strong>Telefone:</strong> {student.phone}</p>
                <p><strong>Status Financeiro:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                    </span>
                </p>
                <div className="text-right mt-4">
                  <Button onClick={onClose} variant="secondary">Fechar</Button>
                </div>
            </div>
        </Modal>
    );
};

const AttendancePage: React.FC = () => {
    const { schedules, users, user, students, loading, graduations } = useContext(AppContext);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const today = DAYS_OF_WEEK[new Date().getDay()];

    const todaysSchedules = useMemo(() => {
        let filteredSchedules = schedules.filter(s => s.dayOfWeek === today);
        if (user?.role === 'academy_admin' || user?.role === 'student') {
            filteredSchedules = filteredSchedules.filter(s => s.academyId === user.academyId);
        }
        return filteredSchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [schedules, user, today]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Frequência de Hoje ({today})</h1>

            {loading ? (
                <div className="text-center">Carregando...</div>
            ) : todaysSchedules.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-400">Nenhum treino agendado para hoje.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaysSchedules.map(schedule => {
                        const requiredGrad = graduations.find(g => g.id === schedule.requiredGraduationId);
                        const requiredRank = requiredGrad ? requiredGrad.rank : 0;

                        const eligibleStudents = students.filter(student => {
                            if (student.academyId !== schedule.academyId) return false;
                            const studentGrad = graduations.find(g => g.id === student.beltId);
                            const studentRank = studentGrad ? studentGrad.rank : 0;
                            return studentRank >= requiredRank;
                        });

                        return (
                        <Card key={schedule.id}>
                            <h2 className="text-xl font-bold text-red-500 mb-2">{schedule.className}</h2>
                            <p className="text-gray-300">{schedule.startTime} - {schedule.endTime}</p>
                            <p className="text-gray-400 mb-4">Prof: {users.find(u => u.id === schedule.professorId)?.name}</p>
                            
                            <h3 className="font-semibold mt-4 mb-2 border-t border-gray-700 pt-2">Alunos Aptos ({eligibleStudents.length})</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                               {eligibleStudents.length > 0 ? eligibleStudents.map(student => (
                                   <div key={student.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                                        <span>{student.name}</span>
                                        <Button size="sm" variant="secondary" onClick={() => setSelectedStudent(student)}>Ver Detalhes</Button>
                                   </div>
                               )) : <p className="text-sm text-gray-400">Nenhum aluno apto para esta turma.</p>}
                            </div>
                        </Card>
                    )})}
                </div>
            )}
            {selectedStudent && <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </div>
    );
};

export default AttendancePage;
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Student } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const PaymentHistoryModal: React.FC<{ student: Student; onClose: () => void, onRegisterPayment: () => void }> = ({ student, onClose, onRegisterPayment }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Histórico de ${student.name}`}>
            <div className="space-y-4">
                {student.paymentHistory && student.paymentHistory.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto pr-2">
                        <ul className="space-y-2">
                            {student.paymentHistory.slice().reverse().map(payment => (
                                <li key={payment.id} className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
                                    <span>Data: {new Date(payment.date).toLocaleDateString()}</span>
                                    <span className="font-semibold text-green-400">
                                        {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center">Nenhum pagamento registrado.</p>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Fechar</Button>
                    <Button type="button" onClick={onRegisterPayment}>Registrar Novo Pagamento</Button>
                </div>
            </div>
        </Modal>
    );
};


const FinancePage: React.FC = () => {
    const { students, updateStudentPayment, loading, graduations } = useContext(AppContext);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [updatedCard, setUpdatedCard] = useState<string | null>(null);

    const { remindersToSend, overduePayments } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reminders: Student[] = [];
        const overdue: Student[] = [];

        students.forEach(student => {
            if (!student.paymentDueDateDay) return;

            const dueDateThisMonth = new Date(today.getFullYear(), today.getMonth(), student.paymentDueDateDay);
            
            const lastDueDate = dueDateThisMonth > today 
                ? new Date(today.getFullYear(), today.getMonth() - 1, student.paymentDueDateDay)
                : dueDateThisMonth;
            
            const nextDueDate = dueDateThisMonth > today
                ? dueDateThisMonth
                : new Date(today.getFullYear(), today.getMonth() + 1, student.paymentDueDateDay);

            if (student.paymentStatus === 'unpaid') {
                const daysSinceLastDue = Math.round((today.getTime() - lastDueDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceLastDue > 0 && daysSinceLastDue <= 5) {
                    overdue.push(student);
                }

                const daysUntilNextDue = Math.round((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilNextDue >= 0 && daysUntilNextDue <= 5) {
                    reminders.push(student);
                }
            }
        });

        return { remindersToSend: reminders, overduePayments: overdue };
    }, [students]);

    const handleSendReminder = (phone: string, name: string) => {
        const message = `Olá ${name},%20tudo%20bem?%20Passando%20para%20lembrar%20que%20sua%20mensalidade%20está%20próxima%20do%20vencimento.%20Qualquer%20dúvida,%20estamos%20à%20disposição!`;
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handleSendOverdueNotice = (phone: string, name: string) => {
        const message = `Olá ${name},%20tudo%20bem?%20Identificamos%20que%20sua%20mensalidade%20está%20em%20atraso.%20Por%20favor,%20regularize%20sua%20situação%20o%20mais%20breve%20possível.%20Obrigado!`;
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handleOpenHistoryModal = (student: Student) => {
        setSelectedStudent(student);
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistoryModal = () => {
        setSelectedStudent(null);
        setIsHistoryModalOpen(false);
    };

    const handleRegisterPayment = async () => {
        if (selectedStudent) {
            await handleStatusUpdate(selectedStudent.id, 'paid');
            handleCloseHistoryModal();
        }
    };

    const handleStatusUpdate = async (studentId: string, status: 'paid' | 'unpaid') => {
        await updateStudentPayment(studentId, status);
        setUpdatedCard(studentId);
        setTimeout(() => {
            setUpdatedCard(null);
        }, 2500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Controle Financeiro</h1>
            
            {remindersToSend.length > 0 && (
                <Card>
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Lembretes a Enviar (Vence em até 5 dias)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {remindersToSend.map(student => (
                            <div key={student.id} className="p-3 bg-gray-700/50 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-gray-400">Vence dia: {student.paymentDueDateDay}</p>
                                </div>
                                <Button size="sm" onClick={() => handleSendReminder(student.phone, student.name)}>Enviar Lembrete</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

             {overduePayments.length > 0 && (
                <Card>
                    <h2 className="text-xl font-bold text-red-500 mb-4">Cobranças Atrasadas (Venceu há até 5 dias)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overduePayments.map(student => (
                            <div key={student.id} className="p-3 bg-gray-700/50 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{student.name}</p>
                                    <p className="text-sm text-gray-400">Venceu dia: {student.paymentDueDateDay}</p>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleSendOverdueNotice(student.phone, student.name)}>Enviar Cobrança</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <h2 className="text-2xl font-bold text-white pt-4">Todos os Alunos</h2>
            {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {students.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        const isUpdated = updatedCard === student.id;
                        const cardClass = isUpdated
                            ? student.paymentStatus === 'paid'
                                ? 'border-green-500/80 scale-105'
                                : 'border-red-500/80 scale-105'
                            : 'hover:border-red-500/50';

                        return (
                           <Card key={student.id} className={`text-center flex flex-col items-center transition-all duration-500 ease-in-out transform hover:-translate-y-1 ${cardClass}`}>
                               <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700" />
                               <h2 className="text-xl font-bold text-white">{student.name}</h2>
                               
                                <span className={`my-2 px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                                </span>

                               {belt && (
                                   <div className="flex items-center justify-center bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                                       <span className="w-4 h-4 rounded-full mr-2 border border-gray-500" style={{ backgroundColor: belt.color }}></span>
                                       {belt.name}
                                   </div>
                               )}
                               <div className="mt-auto pt-4 w-full flex flex-col sm:flex-row justify-center gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenHistoryModal(student)}>Histórico</Button>
                                    {student.paymentStatus === 'unpaid' && (
                                        <Button size="sm" variant="success" onClick={() => handleStatusUpdate(student.id, 'paid')}>Pagar</Button>
                                    )}
                                    {student.paymentStatus === 'paid' && (
                                         <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(student.id, 'unpaid')}>Tornar Inadimplente</Button>
                                    )}
                               </div>
                           </Card>
                        );
                    })}
                </div>
            )}

            {isHistoryModalOpen && selectedStudent && (
                <PaymentHistoryModal 
                    student={selectedStudent} 
                    onClose={handleCloseHistoryModal}
                    onRegisterPayment={handleRegisterPayment} 
                />
            )}
        </div>
    );
};

export default FinancePage;
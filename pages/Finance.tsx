
import React, { useContext, useState } from 'react';
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
    const { students, updateStudentPayment, loading } = useContext(AppContext);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [updatedRow, setUpdatedRow] = useState<{ id: string; status: 'paid' | 'unpaid' } | null>(null);

    const handleSendMessage = (phone: string, name: string) => {
        const message = `Olá ${name},%20gostaríamos%20de%20lembrar%20sobre%20o%20pagamento%20da%20sua%20mensalidade.`;
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
        setUpdatedRow({ id: studentId, status });
        setTimeout(() => {
            setUpdatedRow(null);
        }, 2500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Controle Financeiro</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-300">Nome</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="p-4 text-center">Carregando...</td></tr>
                            ) : students.map(student => {
                                const isUpdated = updatedRow?.id === student.id;
                                const rowClass = isUpdated
                                    ? updatedRow.status === 'paid'
                                        ? 'bg-green-500/20'
                                        : 'bg-red-500/20'
                                    : '';
                                return (
                                <tr key={student.id} className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors duration-500 ${rowClass}`}>
                                    <td className="p-4">{student.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex flex-wrap gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenHistoryModal(student)}>Ver Histórico</Button>
                                        {student.paymentStatus === 'unpaid' && (
                                            <>
                                                <Button size="sm" variant="success" onClick={() => handleStatusUpdate(student.id, 'paid')}>Marcar como Pago</Button>
                                                <Button variant="secondary" size="sm" onClick={() => handleSendMessage(student.phone, student.name)}>Lembrar (WhatsApp)</Button>
                                            </>
                                        )}
                                        {student.paymentStatus === 'paid' && (
                                             <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(student.id, 'unpaid')}>Marcar como Inadimplente</Button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

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

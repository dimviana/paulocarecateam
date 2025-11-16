
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Student } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import FinancialStatusChart from '../components/charts/FinancialStatusChart';
import { IconUsers, IconDollarSign, IconUpload } from '../constants';

const PaymentHistoryModal: React.FC<{ student: Student; onClose: () => void, onRegisterPayment: () => void }> = ({ student, onClose, onRegisterPayment }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Histórico de ${student.name}`}>
            <div className="space-y-4">
                {student.paymentHistory && student.paymentHistory.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto pr-2">
                        <ul className="space-y-2">
                            {student.paymentHistory.slice().reverse().map(payment => (
                                <li key={payment.id} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                                    <span>Data: {new Date(payment.date).toLocaleDateString()}</span>
                                    <span className="font-semibold text-green-600">
                                        {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center">Nenhum pagamento registrado.</p>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                    <Button type="button" variant="secondary" onClick={onClose}>Fechar</Button>
                    <Button type="button" onClick={onRegisterPayment}>Registrar Novo Pagamento</Button>
                </div>
            </div>
        </Modal>
    );
};

const UploadProofModal: React.FC<{ student: Student; onClose: () => void, onConfirm: () => Promise<void> }> = ({ student, onClose, onConfirm }) => {
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type === 'application/pdf') {
                setProofFile(e.target.files[0]);
            } else {
                alert('Por favor, selecione um arquivo PDF.');
                e.target.value = '';
                setProofFile(null);
            }
        }
    };

    const handleSaveClick = async () => {
        if (!proofFile) return;
        setIsSaving(true);
        await onConfirm();
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Enviar Comprovante de ${student.name}`}>
            <div className="space-y-4">
                <p className="text-slate-600">Para registrar o pagamento, é necessário fazer o upload do comprovante em formato PDF.</p>
                <label
                    htmlFor="receipt-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <IconUpload className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500">
                            <span className="font-semibold">Clique para enviar o comprovante</span>
                        </p>
                        <p className="text-xs text-slate-500">Apenas arquivos PDF (obrigatório)</p>
                    </div>
                    <input id="receipt-upload" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                </label>
                
                {proofFile && <p className="text-sm text-green-600 mt-2 text-center">Arquivo selecionado: {proofFile.name}</p>}
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-200">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSaveClick} disabled={!proofFile || isSaving}>
                    {isSaving ? 'Enviando...' : 'Enviar e Confirmar Pagamento'}
                </Button>
            </div>
        </Modal>
    );
};


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-lg mr-4 text-white`} style={{ backgroundColor: color }}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </Card>
);


const FinancePage: React.FC = () => {
    const { students, updateStudentPayment, loading, graduations, themeSettings, setThemeSettings, user } = useContext(AppContext);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [updatedCard, setUpdatedCard] = useState<string | null>(null);
    const [isValuesModalOpen, setIsValuesModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [feeAmount, setFeeAmount] = useState(themeSettings.monthlyFeeAmount);

    const filteredStudents = useMemo(() => {
        if (user?.role === 'academy_admin' && user.academyId) {
            return students.filter(student => student.academyId === user.academyId);
        }
        return students;
    }, [students, user]);

    const { paidStudents, unpaidStudents, totalRevenue } = useMemo(() => {
        const paid = filteredStudents.filter(s => s.paymentStatus === 'paid');
        const unpaid = filteredStudents.filter(s => s.paymentStatus === 'unpaid');
        const revenue = paid.length * themeSettings.monthlyFeeAmount;
        return {
            paidStudents: paid.length,
            unpaidStudents: unpaid.length,
            totalRevenue: revenue,
        };
    }, [filteredStudents, themeSettings.monthlyFeeAmount]);

    const { remindersToSend, overduePayments } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reminders: Student[] = [];
        const overdue: Student[] = [];

        filteredStudents.forEach(student => {
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
                if (daysSinceLastDue > 0 && daysSinceLastDue <= (themeSettings.overdueDaysAfterDue || 5)) {
                    overdue.push(student);
                }

                const daysUntilNextDue = Math.round((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilNextDue >= 0 && daysUntilNextDue <= (themeSettings.reminderDaysBeforeDue || 5)) {
                    reminders.push(student);
                }
            }
        });

        return { remindersToSend: reminders, overduePayments: overdue };
    }, [filteredStudents, themeSettings]);

    const handleSaveFeeAmount = () => {
        setThemeSettings({ ...themeSettings, monthlyFeeAmount: feeAmount });
        setIsValuesModalOpen(false);
    };

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

    const handleRegisterPayment = () => {
        if (selectedStudent) {
            setIsUploadModalOpen(true);
            setIsHistoryModalOpen(false);
        }
    };
    
    const confirmPayment = async () => {
        if (selectedStudent) {
            await updateStudentPayment(selectedStudent.id, 'paid');
            setUpdatedCard(selectedStudent.id);
            setTimeout(() => {
                setUpdatedCard(null);
            }, 2500);
        }
    };

    const handleStatusUpdate = async (student: Student, status: 'paid' | 'unpaid') => {
        if (status === 'paid') {
            setSelectedStudent(student);
            setIsUploadModalOpen(true);
        } else {
            await updateStudentPayment(student.id, status);
            setUpdatedCard(student.id);
            setTimeout(() => {
                setUpdatedCard(null);
            }, 2500);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Controle Financeiro</h1>
                <Button onClick={() => setIsValuesModalOpen(true)}>Valores</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <StatCard 
                        title="Alunos em Dia" 
                        value={paidStudents} 
                        icon={<IconUsers className="w-6 h-6"/>} 
                        color="#10B981" 
                    />
                    <StatCard 
                        title="Alunos Pendentes" 
                        value={unpaidStudents} 
                        icon={<IconUsers className="w-6 h-6"/>} 
                        color="#EF4444" 
                    />
                    <StatCard 
                        title="Receita Mensal" 
                        value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                        icon={<IconDollarSign className="w-6 h-6"/>} 
                        color="#3B82F6" 
                    />
                </div>
                <div className="lg:col-span-2">
                    <FinancialStatusChart paidCount={paidStudents} unpaidCount={unpaidStudents} />
                </div>
            </div>
            
            {remindersToSend.length > 0 && (
                <Card>
                    <h2 className="text-xl font-bold text-amber-600 mb-4">Lembretes a Enviar (Vence em até {themeSettings.reminderDaysBeforeDue} dias)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {remindersToSend.map(student => (
                            <div key={student.id} className="p-3 bg-slate-100 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                    <p className="text-sm text-slate-500">Vence dia: {student.paymentDueDateDay}</p>
                                </div>
                                <Button size="sm" onClick={() => handleSendReminder(student.phone, student.name)}>Enviar Lembrete</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

             {overduePayments.length > 0 && (
                <Card>
                    <h2 className="text-xl font-bold text-red-600 mb-4">Cobranças Atrasadas (Venceu há até {themeSettings.overdueDaysAfterDue} dias)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overduePayments.map(student => (
                            <div key={student.id} className="p-3 bg-slate-100 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                    <p className="text-sm text-slate-500">Venceu dia: {student.paymentDueDateDay}</p>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleSendOverdueNotice(student.phone, student.name)}>Enviar Cobrança</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <h2 className="text-2xl font-bold text-slate-800 pt-4">Todos os Alunos</h2>
            {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        const isUpdated = updatedCard === student.id;
                        const cardClass = isUpdated
                            ? student.paymentStatus === 'paid'
                                ? 'border-green-500/80 scale-105'
                                : 'border-red-500/80 scale-105'
                            : 'hover:border-amber-500/50';

                        return (
                           <Card key={student.id} className={`text-center flex flex-col items-center transition-all duration-500 ease-in-out transform hover:-translate-y-1 ${cardClass}`}>
                               <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-24 h-24 rounded-full mb-4 border-4 border-slate-200" />
                               <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
                               
                                <span className={`my-2 px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                                </span>

                               {belt && (
                                   <div className="flex items-center justify-center bg-slate-100 px-3 py-1 rounded-full text-sm">
                                       <span className="w-4 h-4 rounded-full mr-2 border border-slate-300" style={{ backgroundColor: belt.color }}></span>
                                       {belt.name}
                                   </div>
                               )}
                               <div className="mt-auto pt-4 w-full flex flex-col sm:flex-row justify-center gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenHistoryModal(student)}>Histórico</Button>
                                    {student.paymentStatus === 'unpaid' && (
                                        <Button size="sm" variant="success" onClick={() => handleStatusUpdate(student, 'paid')}>Pagar</Button>
                                    )}
                                    {student.paymentStatus === 'paid' && (
                                         <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(student, 'unpaid')}>Tornar Inadimplente</Button>
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
            
            {isUploadModalOpen && selectedStudent && (
                <UploadProofModal
                    student={selectedStudent}
                    onClose={() => {
                        setIsUploadModalOpen(false);
                        setSelectedStudent(null);
                    }}
                    onConfirm={confirmPayment}
                />
            )}

            <Modal isOpen={isValuesModalOpen} onClose={() => setIsValuesModalOpen(false)} title="Definir Valor da Mensalidade">
                <div className="space-y-4">
                    <Input 
                        label="Valor Padrão da Mensalidade (R$)"
                        type="number"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setIsValuesModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveFeeAmount}>Salvar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FinancePage;

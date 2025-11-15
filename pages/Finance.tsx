
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FinancePage: React.FC = () => {
    const { students, updateStudentPayment, loading } = useContext(AppContext);

    const handleSendMessage = (phone: string, name: string) => {
        const message = `Olá ${name},%20gostaríamos%20de%20lembrar%20sobre%20o%20pagamento%20da%20sua%20mensalidade.`;
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
                            ) : students.map(student => (
                                <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-4">{student.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex flex-wrap gap-2">
                                        {student.paymentStatus === 'unpaid' && (
                                            <>
                                                <Button size="sm" onClick={() => updateStudentPayment(student.id, 'paid')}>Marcar como Pago</Button>
                                                <Button variant="secondary" size="sm" onClick={() => handleSendMessage(student.phone, student.name)}>Lembrar (WhatsApp)</Button>
                                            </>
                                        )}
                                        {student.paymentStatus === 'paid' && (
                                             <Button variant="danger" size="sm" onClick={() => updateStudentPayment(student.id, 'unpaid')}>Marcar como Inadimplente</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default FinancePage;

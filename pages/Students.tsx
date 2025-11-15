import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../context/AppContext';
import { Student } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

// Define StudentForm component inside the same file to avoid re-rendering issues and keep it self-contained.
interface StudentFormProps {
    student: Partial<Student> | null;
    onSave: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => void;
    onClose: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onClose }) => {
    const { academies, graduations } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        cpf: '',
        fjjpe_registration: '',
        phone: '',
        address: '',
        beltId: '',
        academyId: '',
        firstGraduationDate: '',
        paymentDueDateDay: 10,
        ...student,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData as any);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Registro FJJPE" name="fjjpe_registration" value={formData.fjjpe_registration} onChange={handleChange} required />
            <Input label="Data de Nascimento" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
            <Input label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} required />
            <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label="Endereço" name="address" value={formData.address} onChange={handleChange} required />
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Graduação (Faixa)</label>
                <select name="beltId" value={formData.beltId} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="">Selecione a Graduação</option>
                    {graduations.map(grad => <option key={grad.id} value={grad.id}>{grad.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academia</label>
                <select name="academyId" value={formData.academyId} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="">Selecione a Academia</option>
                    {academies.map(ac => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
                </select>
            </div>
            <Input label="Data da Primeira Graduação" name="firstGraduationDate" type="date" value={formData.firstGraduationDate} onChange={handleChange} required />
            <Input label="Dia do Vencimento da Mensalidade" name="paymentDueDateDay" type="number" min="1" max="31" value={formData.paymentDueDateDay} onChange={handleChange} required />

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
};


const StudentsPage: React.FC = () => {
    const { students, academies, saveStudent, deleteStudent, loading, graduations } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Partial<Student> | null>(null);

    const handleOpenModal = (student: Partial<Student> | null = null) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const handleSaveStudent = async (studentData: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen' | 'paymentHistory'> & { id?: string }) => {
        await saveStudent(studentData);
        handleCloseModal();
    };
    
    const handleDeleteStudent = async (studentId: string) => {
      if(window.confirm('Tem certeza que deseja excluir este aluno?')) {
        await deleteStudent(studentId);
      }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-slate-800">Alunos</h1>
                <Button onClick={() => handleOpenModal({})}>Adicionar Aluno</Button>
            </div>
            
            <Card>
                {loading ? (
                    <div className="text-center p-4">Carregando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nome</th>
                                    <th scope="col" className="px-6 py-3">Academia</th>
                                    <th scope="col" className="px-6 py-3">Graduação</th>
                                    <th scope="col" className="px-6 py-3">Status Pag.</th>
                                    <th scope="col" className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const belt = graduations.find(g => g.id === student.beltId);
                                    const academy = academies.find(a => a.id === student.academyId);
                                    return (
                                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center">
                                                <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-8 h-8 rounded-full mr-3" />
                                                {student.name}
                                            </td>
                                            <td className="px-6 py-4">{academy?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {belt && (
                                                    <div className="flex items-center">
                                                        <span className="w-4 h-4 rounded-full mr-2 border border-slate-300" style={{ backgroundColor: belt.color }}></span>
                                                        {belt.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {student.paymentStatus === 'paid' ? 'Em Dia' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleOpenModal(student)}>Editar</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(student.id)}>Excluir</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedStudent?.id ? 'Editar Aluno' : 'Adicionar Aluno'}>
                <StudentForm student={selectedStudent} onSave={handleSaveStudent} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default StudentsPage;
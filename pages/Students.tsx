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
    onSave: (student: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen'> & { id?: string }) => void;
    onClose: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onClose }) => {
    const { academies, graduations } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        cpf: '',
        phone: '',
        address: '',
        beltId: '',
        academyId: '',
        firstGraduationDate: '',
        ...student,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Data de Nascimento" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
            <Input label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} required />
            <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label="Endereço" name="address" value={formData.address} onChange={handleChange} required />
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Graduação (Faixa)</label>
                <select name="beltId" value={formData.beltId} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                    <option value="">Selecione a Graduação</option>
                    {graduations.map(grad => <option key={grad.id} value={grad.id}>{grad.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Academia</label>
                <select name="academyId" value={formData.academyId} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                    <option value="">Selecione a Academia</option>
                    {academies.map(ac => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
                </select>
            </div>
            <Input label="Data da Primeira Graduação" name="firstGraduationDate" type="date" value={formData.firstGraduationDate} onChange={handleChange} required />
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
};


const StudentsPage: React.FC = () => {
    const { students, saveStudent, deleteStudent, loading, graduations } = useContext(AppContext);
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

    const handleSaveStudent = async (studentData: Omit<Student, 'id' | 'paymentStatus' | 'lastSeen'> & { id?: string }) => {
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Gerenciar Alunos</h1>
                <Button onClick={() => handleOpenModal({})}>Adicionar Aluno</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-300">Nome</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Graduação</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Telefone</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>
                            ) : students.map(student => {
                                const belt = graduations.find(g => g.id === student.beltId);
                                return (
                                    <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4">{student.name}</td>
                                        <td className="p-4">
                                            {belt ? (
                                                <span className="flex items-center">
                                                    <span className="w-4 h-4 rounded-full mr-2 border border-gray-500" style={{ backgroundColor: belt.color }}></span>
                                                    {belt.name}
                                                </span>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="p-4">{student.phone}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(student)}>Editar</Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.id)}>Excluir</Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedStudent?.id ? 'Editar Aluno' : 'Adicionar Aluno'}>
                <StudentForm student={selectedStudent} onSave={handleSaveStudent} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default StudentsPage;
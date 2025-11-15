import React, { useState, useContext, FormEvent, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Student } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const StudentDetailsModal: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => {
    const { academies, graduations } = useContext(AppContext);
    const academy = academies.find(a => a.id === student.academyId);
    const graduation = graduations.find(g => g.id === student.beltId);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Detalhes de ${student.name}`}>
            <div className="space-y-3 text-gray-300">
                <p><strong>Academia:</strong> {academy?.name || 'N/A'}</p>
                <p><strong>CPF:</strong> {student.cpf}</p>
                <p><strong>Telefone:</strong> {student.phone}</p>
                <p><strong>Endereço:</strong> {student.address}</p>
                <p><strong>Data de Nascimento:</strong> {new Date(student.birthDate).toLocaleDateString()}</p>
                <p><strong>Primeira Graduação:</strong> {new Date(student.firstGraduationDate).toLocaleDateString()}</p>
                <p><strong>Status Financeiro:</strong>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {student.paymentStatus === 'paid' ? 'Em Dia' : 'Inadimplente'}
                    </span>
                </p>
                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </Modal>
    );
};

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
        ...student,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
    const [filterBeltId, setFilterBeltId] = useState<string>('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [studentForDetails, setStudentForDetails] = useState<Student | null>(null);

    const handleOpenModal = (student: Partial<Student> | null = null) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const handleOpenDetailsModal = (student: Student) => {
        setStudentForDetails(student);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setStudentForDetails(null);
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

    const filteredStudents = useMemo(() => {
        if (!filterBeltId) return students;
        return students.filter(s => s.beltId === filterBeltId);
    }, [students, filterBeltId]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Gerenciar Alunos</h1>
                <div className="flex items-center gap-4">
                     <div>
                        <select 
                            value={filterBeltId} 
                            onChange={(e) => setFilterBeltId(e.target.value)} 
                            className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="">Todas as Graduações</option>
                            {graduations.sort((a,b) => a.rank - b.rank).map(grad => <option key={grad.id} value={grad.id}>{grad.name}</option>)}
                        </select>
                    </div>
                    <Button onClick={() => handleOpenModal({})}>Adicionar Aluno</Button>
                </div>
            </div>
            
            {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        return (
                           <Card key={student.id} className="text-center flex flex-col items-center transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/50 hover:border-red-500/50">
                               <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700 group-hover:border-red-500 transition-colors" />
                               <h2 className="text-xl font-bold text-white">{student.name}</h2>
                               <p className="text-sm text-gray-400 mb-2">REG: {student.fjjpe_registration}</p>
                               {belt && (
                                   <div className="flex items-center justify-center bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                                       <span className="w-4 h-4 rounded-full mr-2 border border-gray-500" style={{ backgroundColor: belt.color }}></span>
                                       {belt.name}
                                   </div>
                               )}
                               <div className="mt-auto pt-4 w-full flex flex-col sm:flex-row justify-center gap-2">
                                   <Button size="sm" onClick={() => handleOpenDetailsModal(student)}>Detalhes</Button>
                                   <Button size="sm" variant="secondary" onClick={() => handleOpenModal(student)}>Editar</Button>
                                   <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(student.id)}>Excluir</Button>
                               </div>
                           </Card>
                        );
                    })}
                </div>
            )}


            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedStudent?.id ? 'Editar Aluno' : 'Adicionar Aluno'}>
                <StudentForm student={selectedStudent} onSave={handleSaveStudent} onClose={handleCloseModal} />
            </Modal>
            
            {isDetailsModalOpen && studentForDetails && (
                <StudentDetailsModal student={studentForDetails} onClose={handleCloseDetailsModal} />
            )}
        </div>
    );
};

export default StudentsPage;
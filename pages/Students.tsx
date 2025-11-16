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

interface PhotoUploadModalProps {
    student: Student;
    onSave: (student: Student, imageUrl: string) => void;
    onClose: () => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ student, onSave, onClose }) => {
    const [preview, setPreview] = useState<string | null>(student.imageUrl || null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSaveClick = () => {
        if (preview) {
            onSave(student, preview);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Alterar foto de ${student.name}`}>
            <div className="flex flex-col items-center">
                <img
                    src={preview || `https://i.pravatar.cc/150?u=${student.cpf}`}
                    alt="Preview"
                    className="w-40 h-40 rounded-full object-cover mb-4 border-4 border-slate-200"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Escolher Arquivo
                </Button>
                <p className="text-sm text-slate-500 mt-2">Selecione uma imagem do seu computador.</p>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-200">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={handleSaveClick} disabled={!preview}>Salvar Foto</Button>
            </div>
        </Modal>
    );
};


const StudentsPage: React.FC = () => {
    const { students, academies, saveStudent, deleteStudent, loading, graduations } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Partial<Student> | null>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [studentForPhoto, setStudentForPhoto] = useState<Student | null>(null);

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

    const handleOpenPhotoModal = (student: Student) => {
        setStudentForPhoto(student);
        setIsPhotoModalOpen(true);
    };

    const handleClosePhotoModal = () => {
        setIsPhotoModalOpen(false);
        setStudentForPhoto(null);
    };
    
    const handleSavePhoto = async (studentToUpdate: Student, newImageUrl: string) => {
        const { id, name, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentDueDateDay } = studentToUpdate;
        await saveStudent({
            id, name, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentDueDateDay,
            imageUrl: newImageUrl
        });
        handleClosePhotoModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-slate-800">Alunos</h1>
                <Button onClick={() => handleOpenModal({})}>Adicionar Aluno</Button>
            </div>
            
            {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {students.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        const academy = academies.find(a => a.id === student.academyId);
                        
                        return (
                            <Card key={student.id} className="p-0 flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 w-[328px] h-[435px]">
                                <div className="h-2" style={{ backgroundColor: belt?.color || '#e2e8f0' }}></div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex items-center mb-4">
                                        <button onClick={() => handleOpenPhotoModal(student)} className="relative group flex-shrink-0">
                                            <img 
                                                src={student.imageUrl || `https://i.pravatar.cc/150?u=${student.cpf}`} 
                                                alt={student.name} 
                                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-opacity">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                        </button>
                                        <div className="ml-4">
                                            <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
                                            <p className="text-sm text-slate-500">{academy?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 text-sm flex-grow">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Pagamento:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {student.paymentStatus === 'paid' ? 'Em Dia' : 'Pendente'}
                                            </span>
                                        </div>
                                        {belt && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-medium">Graduação:</span>
                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 rounded-full mr-2 border border-slate-300" style={{ backgroundColor: belt.color }}></span>
                                                    <span className="font-medium text-slate-700">{belt.name}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Registro:</span>
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{student.fjjpe_registration}</span>
                                        </div>
                                         <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Telefone:</span>
                                            <span className="text-slate-700">{student.phone}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-slate-200/60 flex justify-end gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(student)}>Editar</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(student.id)}>Excluir</Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedStudent?.id ? 'Editar Aluno' : 'Adicionar Aluno'}>
                <StudentForm student={selectedStudent} onSave={handleSaveStudent} onClose={handleCloseModal} />
            </Modal>
            
            {isPhotoModalOpen && studentForPhoto && (
                <PhotoUploadModal
                    student={studentForPhoto}
                    onSave={handleSavePhoto}
                    onClose={handleClosePhotoModal}
                />
            )}
        </div>
    );
};

export default StudentsPage;
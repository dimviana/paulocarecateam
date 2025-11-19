import React, { useContext, useState, FormEvent, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { Academy, Student } from './types';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/Students';
import FinancePage from './pages/Finance';
import SettingsPage from './pages/Settings';
import GraduationsPage from './pages/Graduations';
import SchedulesPage from './pages/Schedules';
import AttendancePage from './pages/Attendance';
import ProfilePage from './pages/Profile';
import PublicPage from './pages/PublicPage';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import Input from './components/ui/Input';
import ProfessorsPage from './pages/Professors';
import Notification from './components/ui/Notification';


interface AcademyFormProps {
  academy: Partial<Academy> | null;
  onSave: (academy: Omit<Academy, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const AcademyForm: React.FC<AcademyFormProps> = ({ academy, onSave, onClose }) => {
  const { professors } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    responsible: '',
    responsibleRegistration: '',
    professorId: '',
    assistantIds: [] as string[],
    imageUrl: '',
    email: '',
    password: '',
    ...academy
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assistantIds' && e.target instanceof HTMLSelectElement) {
      // FIX: Explicitly type `option` as HTMLOptionElement to resolve TS error.
      const selectedIds = Array.from(e.target.selectedOptions).map((option: HTMLOptionElement) => option.value);
      setFormData(prev => ({ ...prev, assistantIds: selectedIds }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const selectStyles = "w-full bg-[var(--theme-bg)] border border-[var(--theme-text-primary)]/20 text-[var(--theme-text-primary)] rounded-md px-3 py-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]/90">Informações da Academia</h3>
      <Input label="Nome da Academia" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Endereço / Localização" name="address" value={formData.address} onChange={handleChange} required />
      <Input label="URL da Imagem (.png, .jpg)" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Cole a URL ou carregue abaixo" />
      
      <div className="text-center text-[var(--theme-text-primary)]/60 my-1 text-sm">OU</div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        Carregar Imagem do Computador
      </Button>

      {formData.imageUrl && (
          <div className="mt-4 text-center">
              <p className="text-sm font-medium text-[var(--theme-text-primary)]/80 mb-2">Pré-visualização:</p>
              <img src={formData.imageUrl} alt="Pré-visualização da academia" className="w-24 h-24 rounded-lg object-cover mx-auto border border-[var(--theme-text-primary)]/20" />
          </div>
      )}

      <Input label="Nome do Responsável" name="responsible" value={formData.responsible} onChange={handleChange} required />
      <Input label="CPF/CNPJ / Registro" name="responsibleRegistration" value={formData.responsibleRegistration} onChange={handleChange} required />
      
      <div>
        <label className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">Professor Responsável</label>
        <select name="professorId" value={formData.professorId} onChange={handleChange} required className={selectStyles}>
           <option value="">Selecione um professor</option>
           {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">Assistentes (segure Ctrl/Cmd para selecionar)</label>
        <select
          name="assistantIds"
          value={formData.assistantIds}
          onChange={handleChange}
          multiple
          className={`${selectStyles} h-24`}
        >
          {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      
      <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]/90 border-t border-[var(--theme-text-primary)]/10 pt-4 mt-4">Acesso do Administrador</h3>
      <Input label="Email de Login" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="admin@suaacademia.com" />
      <Input label="Senha de Login" name="password" type="password" value={formData.password} onChange={handleChange} placeholder={academy?.id ? 'Deixe em branco para manter a atual' : ''} />
      
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};


const AcademyStudentsModal: React.FC<{ academy: Academy; onClose: () => void }> = ({ academy, onClose }) => {
    const { students, graduations } = useContext(AppContext);

    const academyStudents = students.filter(s => s.academyId === academy.id);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Alunos da ${academy.name}`}>
            {academyStudents.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {academyStudents.map(student => {
                        const belt = graduations.find(g => g.id === student.beltId);
                        return (
                            <li key={student.id} className="flex items-center p-2 bg-[var(--theme-bg)] rounded-lg">
                                <img
                                    src={student.imageUrl || `https://i.pravatar.cc/150?u=${student.cpf}`}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                />
                                <div className="flex-grow">
                                    <p className="font-semibold text-[var(--theme-text-primary)]">{student.name}</p>
                                    <p className="text-sm text-[var(--theme-text-primary)]/70">{belt?.name || 'Sem graduação'}</p>
                                </div>
                                {belt && (
                                     <span
                                        className="w-5 h-5 rounded-full border border-[var(--theme-text-primary)]/20"
                                        style={{ backgroundColor: belt.color }}
                                        title={belt.name}
                                    ></span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-center text-[var(--theme-text-primary)]/70 py-4">Nenhum aluno encontrado para esta academia.</p>
            )}
            <div className="flex justify-end pt-4 mt-4 border-t border-[var(--theme-text-primary)]/10">
                <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </div>
        </Modal>
    );
};


const AcademiesPage: React.FC = () => {
    const { academies, students, professors, saveAcademy, deleteAcademy, loading, themeSettings } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAcademy, setSelectedAcademy] = useState<Partial<Academy> | null>(null);
    const [academyForStudents, setAcademyForStudents] = useState<Academy | null>(null);

    const handleOpenModal = (academy: Partial<Academy> | null = null) => {
        setSelectedAcademy(academy);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAcademy(null);
    };

    const handleOpenStudentsModal = (academy: Academy) => {
        setAcademyForStudents(academy);
    };

    const handleCloseStudentsModal = () => {
        setAcademyForStudents(null);
    };

    const handleSaveAcademy = async (academyData: Omit<Academy, 'id'> & { id?: string }) => {
        await saveAcademy(academyData);
        handleCloseModal();
    };
    
    const handleDeleteAcademy = async (academyId: string) => {
      if(window.confirm('Tem certeza que deseja excluir esta academia?')) {
        await deleteAcademy(academyId);
      }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">Gerenciar Academias</h1>
                <Button onClick={() => handleOpenModal({})}>Adicionar Academia</Button>
            </div>
            
             {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {academies.map(academy => {
                        const professor = professors.find(p => p.id === academy.professorId);
                        const studentCount = students.filter(s => s.academyId === academy.id).length;
                        return (
                           <Card key={academy.id} className="p-0 flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1">
                                <div className="h-2" style={{ backgroundColor: themeSettings.primaryColor || '#f59e0b' }}></div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="cursor-pointer flex-grow" onClick={() => handleOpenStudentsModal(academy)}>
                                        <div className="flex items-center mb-4">
                                             <img 
                                                src={academy.imageUrl || `https://i.pravatar.cc/150?u=${academy.id}`} 
                                                alt={academy.name} 
                                                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--theme-text-primary)]/10"
                                            />
                                            <div className="ml-4">
                                                <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">{academy.name}</h2>
                                                <p className="text-sm text-[var(--theme-text-primary)]/70">{academy.address}</p>
                                            </div>
                                        </div>
                                         <div className="space-y-3 text-sm flex-grow">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--theme-text-primary)]/80 font-medium">Responsável:</span>
                                                <span className="text-[var(--theme-text-primary)]">{academy.responsible}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--theme-text-primary)]/80 font-medium">Professor:</span>
                                                <span className="text-[var(--theme-text-primary)]">{professor?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--theme-text-primary)]/80 font-medium">Alunos:</span>
                                                <span className="font-mono text-xs bg-[var(--theme-bg)] px-2 py-0.5 rounded">{studentCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-[var(--theme-text-primary)]/10 flex justify-end gap-2">
                                       <Button size="sm" variant="secondary" onClick={() => handleOpenModal(academy)}>Editar</Button>
                                       <Button size="sm" variant="danger" onClick={() => handleDeleteAcademy(academy.id)}>Excluir</Button>
                                    </div>
                               </div>
                           </Card>
                        );
                    })}
                </div>
            )}


            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedAcademy?.id ? 'Editar Academia' : 'Adicionar Academia'}>
                <AcademyForm academy={selectedAcademy} onSave={handleSaveAcademy} onClose={handleCloseModal} />
            </Modal>
            
            {academyForStudents && (
                <AcademyStudentsModal academy={academyForStudents} onClose={handleCloseStudentsModal} />
            )}
        </div>
    );
};


const ProtectedRoute: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};

const PublicPageWrapper: React.FC = () => {
    const { themeSettings, loading, user } = useContext(AppContext);

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">Carregando...</div>;
    }
    
    // If user is logged in, always go to dashboard
    if(user) {
        return <Navigate to="/dashboard" replace />;
    }

    // If not logged in, show public page or redirect to login
    return themeSettings.publicPageEnabled ? <PublicPage /> : <Navigate to="/login" replace />;
}


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicPageWrapper />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/professors" element={<ProfessorsPage />} />
        <Route path="/graduations" element={<GraduationsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/academies" element={<AcademiesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const { notification, hideNotification } = useContext(AppContext);

  return (
    <>
      {notification && <Notification notification={notification} onClose={hideNotification} />}
      <AppRoutes />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
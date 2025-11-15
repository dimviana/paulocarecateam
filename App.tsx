import React, { useContext, useState, FormEvent } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { Academy } from './types';
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
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import Input from './components/ui/Input';


interface AcademyFormProps {
  academy: Partial<Academy> | null;
  onSave: (academy: Omit<Academy, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const AcademyForm: React.FC<AcademyFormProps> = ({ academy, onSave, onClose }) => {
  const { users } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    responsible: '',
    responsibleRegistration: '',
    professorId: '',
    assistantIds: [] as string[],
    ...academy
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assistantIds' && e.target instanceof HTMLSelectElement) {
      const selectedIds = Array.from(e.target.selectedOptions).map(option => option.value);
      setFormData(prev => ({ ...prev, assistantIds: selectedIds }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome da Academia" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Endereço / Localização" name="address" value={formData.address} onChange={handleChange} required />
      <Input label="Nome do Responsável" name="responsible" value={formData.responsible} onChange={handleChange} required />
      <Input label="CPF/CNPJ / Registro" name="responsibleRegistration" value={formData.responsibleRegistration} onChange={handleChange} required />
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Professor Responsável</label>
        <select name="professorId" value={formData.professorId} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
           <option value="">Selecione um professor</option>
           {users.filter(u => u.role !== 'student').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Assistentes (segure Ctrl/Cmd para selecionar)</label>
        <select
          name="assistantIds"
          value={formData.assistantIds}
          onChange={handleChange}
          multiple
          className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 h-24"
        >
          {users.filter(u => u.role !== 'student').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

const AcademiesPage: React.FC = () => {
    const { academies, users, saveAcademy, deleteAcademy, loading } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAcademy, setSelectedAcademy] = useState<Partial<Academy> | null>(null);

    const handleOpenModal = (academy: Partial<Academy> | null = null) => {
        setSelectedAcademy(academy);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAcademy(null);
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
                <h1 className="text-3xl font-bold text-white">Gerenciar Academias</h1>
                <Button onClick={() => handleOpenModal({})}>Adicionar Academia</Button>
            </div>
            
             {loading ? (
                <div className="text-center p-4">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {academies.map(academy => {
                        const professor = users.find(u => u.id === academy.professorId);
                        return (
                           <Card key={academy.id} className="text-center flex flex-col items-center transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/50 hover:border-red-500/50">
                               <img src={`https://i.pravatar.cc/150?u=${professor?.email}`} alt={professor?.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700 group-hover:border-red-500 transition-colors" />
                               <h2 className="text-xl font-bold text-white">{academy.name}</h2>
                               <p className="text-sm text-gray-400 mb-1">Resp: {academy.responsible}</p>
                               <p className="text-sm text-gray-400">{academy.address}</p>
                               <div className="mt-auto pt-4 w-full flex justify-center gap-2">
                                   <Button size="sm" variant="secondary" onClick={() => handleOpenModal(academy)}>Editar</Button>
                                   <Button size="sm" variant="danger" onClick={() => handleDeleteAcademy(academy.id)}>Excluir</Button>
                               </div>
                           </Card>
                        );
                    })}
                </div>
            )}


            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedAcademy?.id ? 'Editar Academia' : 'Adicionar Academia'}>
                <AcademyForm academy={selectedAcademy} onSave={handleSaveAcademy} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};


const ProtectedRoute: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/graduations" element={<GraduationsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/academies" element={<AcademiesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
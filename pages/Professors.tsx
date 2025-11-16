import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../context/AppContext';
import { Professor } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const validateCPF = (cpf: string): boolean => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const digits = cpf.split('').map(el => +el);

    const rest = (count: number): number => {
        let sum = 0;
        for (let i = 0; i < count; i++) {
        sum += digits[i] * (count + 1 - i);
        }
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    if (rest(9) !== digits[9]) return false;
    if (rest(10) !== digits[10]) return false;

    return true;
};

// Form component
interface ProfessorFormProps {
  professor: Partial<Professor> | null;
  onSave: (prof: Omit<Professor, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({ professor, onSave, onClose }) => {
  const { academies, graduations } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '',
    fjjpe_registration: '',
    cpf: '',
    academyId: '',
    graduationId: '',
    ...professor,
  });
  const [cpfError, setCpfError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
        if (value && !validateCPF(value)) {
            setCpfError('CPF inválido');
        } else {
            setCpfError('');
        }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateCPF(formData.cpf)) {
        setCpfError('Por favor, insira um CPF válido.');
        return;
    }
    onSave(formData as any);
  };

  const selectStyles = "w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md px-3 py-2 focus:ring-amber-500 focus:border-amber-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome do Professor" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Registro FJJPE" name="fjjpe_registration" value={formData.fjjpe_registration} onChange={handleChange} required />
      <div>
        <Input label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} required />
        {cpfError && <p className="text-sm text-red-500 mt-1">{cpfError}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Academia</label>
        <select name="academyId" value={formData.academyId} onChange={handleChange} required className={selectStyles}>
          <option value="">Selecione a Academia</option>
          {academies.map(ac => <option key={ac.id} value={ac.id}>{ac.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Graduação</label>
        <select name="graduationId" value={formData.graduationId} onChange={handleChange} required className={selectStyles}>
          <option value="">Selecione a Graduação</option>
          {graduations.sort((a, b) => a.rank - b.rank).map(grad => <option key={grad.id} value={grad.id}>{grad.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={!!cpfError}>Salvar</Button>
      </div>
    </form>
  );
};

// Main page component
const ProfessorsPage: React.FC = () => {
  const { professors, academies, graduations, saveProfessor, deleteProfessor, loading } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Partial<Professor> | null>(null);

  const handleOpenModal = (prof: Partial<Professor> | null = null) => {
    setSelectedProfessor(prof);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfessor(null);
  };

  const handleSave = async (profData: Omit<Professor, 'id'> & { id?: string }) => {
    await saveProfessor(profData);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este professor?')) {
      await deleteProfessor(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Gerenciar Professores</h1>
        <Button onClick={() => handleOpenModal({})}>Adicionar Professor</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Professor</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Registro FJJPE</th>
                <th className="p-4 text-sm font-semibold text-slate-600">CPF</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Academia</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Graduação</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center">Carregando...</td></tr>
              ) : professors.map(prof => {
                const academy = academies.find(a => a.id === prof.academyId);
                const graduation = graduations.find(g => g.id === prof.graduationId);
                return (
                  <tr key={prof.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-800 font-medium">{prof.name}</td>
                    <td className="p-4 text-slate-700">{prof.fjjpe_registration}</td>
                    <td className="p-4 text-slate-700">{prof.cpf}</td>
                    <td className="p-4 text-slate-700">{academy?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-700">
                      {graduation ? (
                        <div className="flex items-center">
                           <span className="w-4 h-4 rounded-full mr-2 border border-slate-300" style={{ backgroundColor: graduation.color }}></span>
                           <span>{graduation.name}</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="p-4 flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenModal(prof)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(prof.id)}>Excluir</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProfessor?.id ? 'Editar Professor' : 'Adicionar Professor'}>
        <ProfessorForm professor={selectedProfessor} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default ProfessorsPage;
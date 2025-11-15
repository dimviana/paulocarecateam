import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../context/AppContext';
import { Graduation } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

interface GraduationFormProps {
  graduation: Partial<Graduation> | null;
  onSave: (grad: Omit<Graduation, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const GraduationForm: React.FC<GraduationFormProps> = ({ graduation, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#FFFFFF',
    minTimeInMonths: 0,
    rank: 0,
    ...graduation
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome da Faixa" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Ordem (Rank)" name="rank" type="number" value={formData.rank} onChange={handleChange} required />
      <Input label="Cor" name="color" type="color" value={formData.color} onChange={handleChange} required />
      <Input label="Tempo Mínimo (meses)" name="minTimeInMonths" type="number" value={formData.minTimeInMonths} onChange={handleChange} required />
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

const GraduationsPage: React.FC = () => {
  const { graduations, saveGraduation, deleteGraduation, loading } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGraduation, setSelectedGraduation] = useState<Partial<Graduation> | null>(null);

  const handleOpenModal = (grad: Partial<Graduation> | null = null) => {
    setSelectedGraduation(grad);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGraduation(null);
  };

  const handleSave = async (gradData: Omit<Graduation, 'id'> & { id?: string }) => {
    await saveGraduation(gradData);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta graduação?')) {
      await deleteGraduation(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Gerenciar Graduações</h1>
        <Button onClick={() => handleOpenModal({})}>Adicionar Graduação</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-300">Ordem</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Nome</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Cor</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Tempo Mínimo</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>
              ) : [...graduations].sort((a,b) => a.rank - b.rank).map(grad => (
                <tr key={grad.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-4">{grad.rank}</td>
                  <td className="p-4">{grad.name}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full border border-gray-500" style={{ backgroundColor: grad.color }}></span>
                      <span className="ml-2">{grad.color}</span>
                    </div>
                  </td>
                  <td className="p-4">{grad.minTimeInMonths} meses</td>
                  <td className="p-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(grad)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(grad.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedGraduation?.id ? 'Editar Graduação' : 'Adicionar Graduação'}>
        <GraduationForm graduation={selectedGraduation} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default GraduationsPage;
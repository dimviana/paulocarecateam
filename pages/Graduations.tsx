
import React, { useState, useContext, FormEvent, useEffect, useMemo } from 'react';
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
      <Input label="Ordem (Rank)" name="rank" type="number" value={formData.rank} onChange={handleChange} required readOnly/>
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
  const { graduations, saveGraduation, deleteGraduation, updateGraduationRanks, loading, students, attendanceRecords, academies } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGraduation, setSelectedGraduation] = useState<Partial<Graduation> | null>(null);
  const [localGraduations, setLocalGraduations] = useState<Graduation[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setLocalGraduations([...graduations].sort((a,b) => a.rank - b.rank));
  }, [graduations]);

  const eligibleForStripe = useMemo(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    return students
      .map(student => {
        if (!student.firstGraduationDate) {
          return null;
        }

        const firstGradDate = new Date(student.firstGraduationDate);

        // Time check: must be at least 6 months
        const diffTime = today.getTime() - firstGradDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays < 180) { // Using 180 days as a proxy for 6 months
          return null;
        }
        
        const totalMonths = Math.floor(diffDays / 30.44); // Average days in a month

        // Attendance check
        const studentRecordsInPeriod = attendanceRecords.filter(r => 
          r.studentId === student.id && new Date(r.date) >= sixMonthsAgo && new Date(r.date) <= today
        );

        if (studentRecordsInPeriod.length === 0) {
          return null; // Not enough data to determine eligibility
        }

        const presentCount = studentRecordsInPeriod.filter(r => r.status === 'present').length;
        const attendancePercentage = (presentCount / studentRecordsInPeriod.length) * 100;

        if (attendancePercentage >= 70) {
          return {
            ...student,
            attendancePercentage: Math.round(attendancePercentage),
            trainingTimeInMonths: totalMonths,
          };
        }

        return null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null) 
      .sort((a, b) => b!.trainingTimeInMonths - a!.trainingTimeInMonths);
  }, [students, attendanceRecords]);

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

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, grad: Graduation) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(grad.id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = (targetGrad: Graduation) => {
    if (!draggedId || draggedId === targetGrad.id) {
        setDraggedId(null);
        return;
    }

    const reordered = [...localGraduations];
    const draggedIndex = reordered.findIndex(g => g.id === draggedId);
    const targetIndex = reordered.findIndex(g => g.id === targetGrad.id);

    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);
    
    setLocalGraduations(reordered);

    const payload = reordered.map((g, index) => ({ id: g.id, rank: index + 1 }));
    updateGraduationRanks(payload);
    
    setDraggedId(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Gerenciar Graduações</h1>
        <Button onClick={() => handleOpenModal({ rank: localGraduations.length + 1 })}>Adicionar Graduação</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Ordem</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Nome</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Cor</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Tempo Mínimo</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>
              ) : localGraduations.map((grad, index) => (
                <tr 
                  key={grad.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, grad)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(grad)}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-opacity ${draggedId === grad.id ? 'opacity-30' : 'opacity-100'}`}
                  style={{ cursor: 'move' }}
                >
                  <td className="p-4 text-slate-700">{index + 1}</td>
                  <td className="p-4 text-slate-800 font-medium">{grad.name}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full border border-slate-300" style={{ backgroundColor: grad.color }}></span>
                      <span className="ml-3 text-slate-700 font-mono">{grad.color}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-700">{grad.minTimeInMonths} meses</td>
                  <td className="p-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal({...grad, rank: index+1})}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(grad.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-amber-600 mb-4">Alunos Elegíveis para Receber Grau</h2>
        <p className="text-sm text-slate-500 mb-6">
          Alunos com pelo menos 6 meses desde a primeira graduação e 70% ou mais de frequência nos últimos 6 meses.
        </p>
        {loading ? (
          <div className="text-center p-4">Calculando elegibilidade...</div>
        ) : eligibleForStripe.length > 0 ? (
          <div className="space-y-4">
            {eligibleForStripe.map(student => {
              const belt = graduations.find(g => g.id === student.beltId);
              const academy = academies.find(a => a.id === student.academyId);
              return (
                <div key={student.id} className="flex flex-col sm:flex-row items-center p-3 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                  <img src={student.imageUrl || `https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center sm:text-left">
                    <div>
                      <p className="font-bold text-slate-800">{student.name}</p>
                      <p className="text-sm text-slate-500">{academy?.name || 'N/A'}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700">{belt?.name || 'N/A'}</p>
                      <p className="text-sm text-slate-500">{student.trainingTimeInMonths} meses de treino</p>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-center sm:justify-start">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mr-2">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${student.attendancePercentage}%` }}></div>
                        </div>
                        <span className="font-semibold text-green-600">{student.attendancePercentage}%</span>
                      </div>
                      <p className="text-sm text-slate-500 text-right">Frequência (6m)</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-4">Nenhum aluno elegível no momento.</p>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedGraduation?.id ? 'Editar Graduação' : 'Adicionar Graduação'}>
        <GraduationForm graduation={selectedGraduation} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default GraduationsPage;

import React, { useState, useContext, FormEvent, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ClassSchedule, DayOfWeek } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

interface ScheduleFormProps {
  schedule: Partial<ClassSchedule> | null;
  onSave: (schedule: Omit<ClassSchedule, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule, onSave, onClose }) => {
  const { users, academies, user } = useContext(AppContext);
  const [formData, setFormData] = useState({
    className: '',
    dayOfWeek: 'Segunda-feira' as DayOfWeek,
    startTime: '',
    endTime: '',
    professorId: '',
    // FIX: Initialize assistantIds as string[] to avoid type inference issues.
    assistantIds: [] as string[],
    academyId: user?.role === 'academy_admin' ? user.academyId || '' : '',
    ...schedule
  });

  // FIX: Correctly handle change events for different input types to avoid TypeScript errors.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assistantIds' && e.target instanceof HTMLSelectElement) {
      const selectedIds = Array.from(e.target.options)
        .filter(option => option.selected)
        .map(option => option.value);
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
      <Input label="Nome da Turma" name="className" value={formData.className} onChange={handleChange} required />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Dia da Semana</label>
        <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
          {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Horário de Início" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
        <Input label="Horário de Fim" name="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Professor</label>
        <select name="professorId" value={formData.professorId} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
           <option value="">Selecione um professor</option>
           {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
       {/* FIX: Add missing multi-select for assistantIds */}
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Assistentes (segure Ctrl/Cmd para selecionar vários)</label>
        <select
          name="assistantIds"
          value={formData.assistantIds || []}
          onChange={handleChange}
          multiple
          className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 h-24"
        >
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
       {user?.role === 'general_admin' && (
         <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Academia</label>
            <select name="academyId" value={formData.academyId} onChange={handleChange} required className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
               <option value="">Selecione uma academia</option>
               {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
         </div>
       )}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};


const SchedulesPage: React.FC = () => {
  const { schedules, saveSchedule, deleteSchedule, loading, users, user } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Partial<ClassSchedule> | null>(null);

  const filteredSchedules = useMemo(() => {
    if (user?.role === 'academy_admin') {
        return schedules.filter(s => s.academyId === user.academyId);
    }
    return schedules;
  }, [schedules, user]);

  const groupedSchedules = useMemo(() => {
    const groups = {} as Record<DayOfWeek, ClassSchedule[]>;
    DAYS_OF_WEEK.forEach(day => groups[day] = []);
    filteredSchedules.forEach(schedule => {
      groups[schedule.dayOfWeek].push(schedule);
    });
    return groups;
  }, [filteredSchedules]);

  const handleOpenModal = (schedule: Partial<ClassSchedule> | null = null) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleSave = async (scheduleData: Omit<ClassSchedule, 'id'> & { id?: string }) => {
    await saveSchedule(scheduleData);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este horário?')) {
      await deleteSchedule(id);
    }
  };
  
  const isAdmin = user?.role === 'general_admin' || user?.role === 'academy_admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Gerenciar Horários</h1>
        {isAdmin && <Button onClick={() => handleOpenModal({})}>Adicionar Horário</Button>}
      </div>
      
      {loading ? (
        <div className="text-center">Carregando horários...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DAYS_OF_WEEK.map(day => (
                groupedSchedules[day].length > 0 && (
                    <Card key={day}>
                        <h2 className="text-xl font-bold text-red-500 mb-4">{day}</h2>
                        <div className="space-y-4">
                            {groupedSchedules[day].sort((a,b) => a.startTime.localeCompare(b.startTime)).map(schedule => (
                                <div key={schedule.id} className="bg-gray-700/50 p-3 rounded-md">
                                    <p className="font-semibold">{schedule.className}</p>
                                    <p className="text-sm text-gray-300">{schedule.startTime} - {schedule.endTime}</p>
                                    <p className="text-sm text-gray-400">Prof: {users.find(u => u.id === schedule.professorId)?.name}</p>
                                    {isAdmin && (
                                        <div className="flex gap-2 mt-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(schedule)}>Editar</Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(schedule.id)}>Excluir</Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )
            ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedSchedule?.id ? 'Editar Horário' : 'Adicionar Horário'}>
        <ScheduleForm schedule={selectedSchedule} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default SchedulesPage;
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import PaymentsChart from '../components/charts/PaymentsChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import { IconUsers, IconDollarSign, IconBuilding, IconGift } from '../constants';

const Dashboard: React.FC = () => {
    const { user, users, students, academies, loading } = useContext(AppContext);
    
    if (loading) {
        return <div className="text-center">Carregando dados...</div>;
    }
    
    const paidStudents = students.filter(s => s.paymentStatus === 'paid').length;
    
    const currentMonth = new Date().getMonth();
    const birthdayStudents = students.filter(s => new Date(s.birthDate).getUTCMonth() === currentMonth);
    const birthdayProfessors = users.filter(u => u.birthDate && u.role !== 'student' && new Date(u.birthDate).getUTCMonth() === currentMonth);
    const allBirthdays = [...birthdayStudents, ...birthdayProfessors];

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-white">Bem-vindo, {user?.name}!</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="flex items-center space-x-4">
                    <div className="bg-red-600/20 p-3 rounded-full">
                        <IconUsers />
                    </div>
                    <div>
                        <p className="text-gray-400">Total de Alunos</p>
                        <p className="text-3xl font-bold text-white">{students.length}</p>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4">
                     <div className="bg-green-600/20 p-3 rounded-full text-green-400">
                        <IconDollarSign />
                    </div>
                    <div>
                        <p className="text-gray-400">Alunos em Dia</p>
                        <p className="text-3xl font-bold text-white">{paidStudents}</p>
                    </div>
                </Card>
                {user?.role === 'general_admin' && (
                    <Card className="flex items-center space-x-4">
                        <div className="bg-blue-600/20 p-3 rounded-full text-blue-400">
                            <IconBuilding />
                        </div>
                        <div>
                            <p className="text-gray-400">Total de Academias</p>
                            <p className="text-3xl font-bold text-white">{academies.length}</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Charts and Birthdays */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PaymentsChart students={students} />
                    <AttendanceChart />
                </div>
                <Card>
                    <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center"><IconGift /><span className="ml-2">Aniversariantes do Mês</span></h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {allBirthdays.length > 0 ? (
                            allBirthdays
                                .sort((a,b) => new Date(a.birthDate!).getUTCDate() - new Date(b.birthDate!).getUTCDate())
                                .map(person => (
                                <div key={person.id} className="p-2 bg-gray-700/50 rounded-md">
                                    <p className="font-semibold text-white">{person.name}</p>
                                    <p className="text-sm text-gray-400">{new Date(person.birthDate!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">Nenhum aniversário este mês.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
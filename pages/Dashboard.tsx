
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import PaymentsChart from '../components/charts/PaymentsChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import { IconUsers, IconDollarSign, IconBuilding } from '../constants';

const Dashboard: React.FC = () => {
    const { user, students, academies, loading } = useContext(AppContext);
    
    if (loading) {
        return <div className="text-center">Carregando dados...</div>;
    }
    
    const paidStudents = students.filter(s => s.paymentStatus === 'paid').length;
    
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentsChart students={students} />
                <AttendanceChart />
            </div>
        </div>
    );
};

export default Dashboard;

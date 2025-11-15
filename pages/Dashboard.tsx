import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import StudentBreakdownChart from '../components/charts/PaymentsChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import Button from '../components/ui/Button';
import { IconUsers, IconBriefcase, IconBookOpen, IconAward, IconChevronDown } from '../constants';

// --- Sub-components for Dashboard ---

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <Card className={`flex items-center p-4`}>
        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}1A`}}>
            <div style={{ color: color }}>{icon}</div>
        </div>
        <div className="ml-4">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </Card>
);

const StudentPerformanceTable: React.FC = () => {
    const { students } = useContext(AppContext);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Class</th>
                        <th scope="col" className="px-6 py-3">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {students.slice(0, 4).map(student => (
                        <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center">
                                <img src={`https://i.pravatar.cc/150?u=${student.cpf}`} alt={student.name} className="w-8 h-8 rounded-full mr-3" />
                                {student.name}
                            </td>
                            <td className="px-6 py-4">{student.fjjpe_registration}</td>
                            <td className="px-6 py-4">Class {Math.floor(Math.random() * (12 - 9 + 1)) + 9}</td>
                            <td className="px-6 py-4 font-medium">{['A', 'B', 'A'][Math.floor(Math.random()*3)]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CommunityCard: React.FC = () => (
    <Card className="bg-amber-400 text-center text-white relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="absolute -bottom-8 -left-2 w-24 h-24 border-4 border-white/20 rounded-full"></div>
        <h3 className="text-xl font-bold mb-2 relative">Join the community and find out more</h3>
        <Button variant="secondary" className="bg-white/90 text-amber-600 hover:bg-white">Explore Now</Button>
    </Card>
);

const CalendarWidget: React.FC = () => {
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const currentDay = today.getDate();

    const days = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">{month} {year}</h3>
                <div className="flex space-x-2">
                    <button className="text-slate-500 hover:text-slate-800">{'<'}</button>
                    <button className="text-slate-500 hover:text-slate-800">{'>'}</button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center text-sm text-slate-500">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="py-2">{d}</div>)}
                {days.map(d => (
                    <div key={d} className={`py-2 rounded-full ${d === currentDay ? 'bg-amber-500 text-white font-bold' : ''}`}>
                        {d}
                    </div>
                ))}
            </div>
        </Card>
    );
};

const UpcomingEvents: React.FC = () => (
    <Card>
        <h3 className="font-semibold text-slate-800 mb-4">Upcoming Events</h3>
        <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
                <p className="font-semibold text-amber-700">School Annual Function</p>
                <p className="text-sm text-amber-600">28 Jun, 2024</p>
            </div>
             <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="font-semibold text-red-700">Class 12th Farewell</p>
                <p className="text-sm text-red-600">30 Jun, 2024</p>
            </div>
        </div>
    </Card>
);


// --- Main Dashboard Component ---

const Dashboard: React.FC = () => {
    const { user, students, users, loading } = useContext(AppContext);
    
    if (loading) {
        return <div className="text-center">Carregando dados...</div>;
    }
    
    const totalTeachers = users.filter(u => u.role !== 'student').length;

    const stats = [
        { icon: <IconUsers />, title: 'Total Students', value: String(students.length), color: '#3B82F6' },
        { icon: <IconBriefcase />, title: 'Total Teachers', value: String(totalTeachers), color: '#10B981' },
        { icon: <IconBookOpen />, title: 'Total Courses', value: '25', color: '#8B5CF6' },
        { icon: <IconAward />, title: 'Total Earnings', value: '$25.7K', color: '#F472B6' },
    ];

    return (
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Good Morning, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-slate-500 mt-1">Welcome to Academia</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
                    </div>
                    
                    <AttendanceChart />

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-semibold text-slate-800">Student Performance</h3>
                             <Button variant="secondary" size="sm">All <IconChevronDown className="w-4 h-4 ml-1" /></Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <StudentPerformanceTable />
                            </div>
                            <div>
                                <StudentBreakdownChart />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <CommunityCard />
                    <CalendarWidget />
                    <UpcomingEvents />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
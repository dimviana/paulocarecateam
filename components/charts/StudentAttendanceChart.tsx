import React, { useContext, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { AppContext } from '../../context/AppContext';
import Card from '../ui/Card';

interface StudentAttendanceChartProps {
    studentId: string;
}

const StudentAttendanceChart: React.FC<StudentAttendanceChartProps> = ({ studentId }) => {
    const { attendanceRecords } = useContext(AppContext);

    const attendanceData = useMemo(() => {
        const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
        if (studentRecords.length === 0) {
            return { data: [{ name: 'Sem Dados', value: 1 }], percentage: 0 };
        }

        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.length - present;
        const percentage = Math.round((present / studentRecords.length) * 100);

        return {
            data: [
                { name: 'Presente', value: present },
                { name: 'Ausente', value: absent },
            ],
            percentage
        };
    }, [attendanceRecords, studentId]);

    const COLORS = ['#F9A825', '#94A3B8']; // Amber-600, Slate-400

    return (
        <Card className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sua Frequência</h3>
            <div className="flex-grow w-full h-60 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-4xl font-bold text-amber-600">{attendanceData.percentage}%</p>
                        <p className="text-sm text-slate-500">de Presença</p>
                    </div>
                </div>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={attendanceData.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                        >
                            {attendanceData.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                         <Legend 
                            iconType="circle" 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value, entry) => <span style={{ color: '#475569' }}>{value}</span>}
                         />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default StudentAttendanceChart;

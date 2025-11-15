
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';
import Card from '../ui/Card';

interface PaymentsChartProps {
  students: Student[];
}

const PaymentsChart: React.FC<PaymentsChartProps> = ({ students }) => {
  const paidCount = students.filter(s => s.paymentStatus === 'paid').length;
  const unpaidCount = students.length - paidCount;

  const data = [
    { name: 'Em Dia', value: paidCount },
    { name: 'Inadimplentes', value: unpaidCount },
  ];

  const COLORS = ['#10B981', '#EF4444']; // Emerald-500, Red-500

  return (
    <Card>
        <h3 className="text-xl font-bold text-red-500 mb-4">Status de Pagamento</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(31, 41, 55, 0.8)', // bg-gray-700 with opacity
                        borderColor: '#4B5563', // border-gray-600
                    }}
                />
                <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </Card>
  );
};

export default PaymentsChart;

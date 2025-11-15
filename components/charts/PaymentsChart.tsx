
import React, { useContext, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';
import Card from '../ui/Card';
import { AppContext } from '../../context/AppContext';

interface PaymentsChartProps {
  students: Student[];
}

const PaymentsChart: React.FC<PaymentsChartProps> = ({ students }) => {
  const { themeSettings } = useContext(AppContext);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (themeSettings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeSettings.theme === 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeSettings.theme === 'system') {
        setIsDarkMode(mediaQuery.matches);
      } else {
        setIsDarkMode(themeSettings.theme === 'dark');
      }
    };
    handler();
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeSettings.theme]);

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
                        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                        color: isDarkMode ? '#F3F4F6' : '#1F2937',
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
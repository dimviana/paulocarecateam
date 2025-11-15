
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const data = [
  { name: 'Seg', Presenças: 18 },
  { name: 'Ter', Presenças: 22 },
  { name: 'Qua', Presenças: 25 },
  { name: 'Qui', Presenças: 21 },
  { name: 'Sex', Presenças: 30 },
  { name: 'Sáb', Presenças: 15 },
];

const AttendanceChart: React.FC = () => {
  return (
    <Card>
      <h3 className="text-xl font-bold text-red-500 mb-4">Frequência Semanal</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#D1D5DB' }} />
            <YAxis tick={{ fill: '#D1D5DB' }} />
            <Tooltip 
                cursor={{fill: 'rgba(220, 38, 38, 0.2)'}}
                contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    borderColor: '#4B5563',
                }}
            />
            <Legend />
            <Bar dataKey="Presenças" fill="#DC2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AttendanceChart;

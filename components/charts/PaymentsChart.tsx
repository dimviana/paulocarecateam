
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../ui/Card';

const StudentBreakdownChart: React.FC = () => {
  const data = [
    { name: 'Boys', value: 1200 },
    { name: 'Girls', value: 800 },
  ];

  const COLORS = ['#F9A825', '#A0522D']; // Amber, Sienna (Brown)

  return (
    <Card className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-slate-800">Student Breakdown</h3>
        <div className="flex-grow w-full h-64 relative">
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-3xl font-bold text-slate-800">2000</p>
                    <p className="text-sm text-slate-500">Students</p>
                </div>
            </div>
            <ResponsiveContainer>
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                    cornerRadius={8}
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: '#E5E7EB',
                        color: '#1F2937',
                        borderRadius: '0.75rem',
                    }}
                />
                <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </Card>
  );
};

export default StudentBreakdownChart;
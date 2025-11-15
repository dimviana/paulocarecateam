
import React, { useContext, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { AppContext } from '../../context/AppContext';

const data = [
  { name: 'Seg', Presenças: 18 },
  { name: 'Ter', Presenças: 22 },
  { name: 'Qua', Presenças: 25 },
  { name: 'Qui', Presenças: 21 },
  { name: 'Sex', Presenças: 30 },
  { name: 'Sáb', Presenças: 15 },
];

const AttendanceChart: React.FC = () => {
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

  const tickColor = isDarkMode ? '#D1D5DB' : '#374151';

  return (
    <Card>
      <h3 className="text-xl font-bold text-red-500 mb-4">Frequência Semanal</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip 
                cursor={{fill: 'rgba(220, 38, 38, 0.2)'}}
                contentStyle={{ 
                    backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                    color: isDarkMode ? '#F3F4F6' : '#1F2937',
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
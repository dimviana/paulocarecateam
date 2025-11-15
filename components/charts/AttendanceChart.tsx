
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const attendanceData = [
  { name: '18-June', Present: 1600, Absent: 800 },
  { name: '19-June', Present: 1800, Absent: 1100 },
  { name: '20-June', Present: 1900, Absent: 900 },
  { name: '21-June', Present: 1200, Absent: 700 },
  { name: '22-June', Present: 2000, Absent: 400 },
  { name: '23-June', Present: 1400, Absent: 600 },
  { name: '24-June', Present: 1100, Absent: 500 },
  { name: '25-June', Present: 1300, Absent: 800 },
  { name: '26-June', Present: 1800, Absent: 300 },
];


const AttendanceChart: React.FC = () => {
  const tickColor = '#64748B'; // slate-500

  return (
    <Card className="h-full">
      <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-semibold text-slate-800">Attendance Report</h3>
         <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Present</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-600 mr-2"></span>Absent</div>
         </div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={attendanceData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
                cursor={{fill: 'rgba(245, 158, 11, 0.1)'}}
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#E5E7EB',
                    color: '#1F2937',
                    borderRadius: '0.75rem',
                }}
            />
            <Bar dataKey="Present" fill="#F9A825" radius={[5, 5, 0, 0]} barSize={10} />
            <Bar dataKey="Absent" fill="#475569" radius={[5, 5, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AttendanceChart;


import React, { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { AppContext } from '../../context/AppContext';

interface FinancialStatusChartProps {
    paidCount: number;
    unpaidCount: number;
}

const FinancialStatusChart: React.FC<FinancialStatusChartProps> = ({ paidCount, unpaidCount }) => {
    const { themeSettings } = useContext(AppContext);
    const data = [
        {
            name: 'Status',
            'Em Dia': paidCount,
            'Inadimplente': unpaidCount,
        },
    ];

    const tickColor = 'var(--theme-text-primary)';

    return (
        <Card className="h-full">
            <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-4">Visão Geral de Pagamentos</h3>
            <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        barCategoryGap="35%"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0, 0, 0, 0.05)" />
                        <XAxis type="number" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                            cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                            contentStyle={{
                                backgroundColor: 'var(--theme-card-bg)',
                                borderColor: 'var(--theme-text-primary)',
                                color: 'var(--theme-text-primary)',
                                borderRadius: '0.75rem',
                            }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="Em Dia" fill={themeSettings.chartColor1} radius={[0, 5, 5, 0]} />
                        <Bar dataKey="Inadimplente" fill={themeSettings.chartColor2} radius={[0, 5, 5, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default FinancialStatusChart;
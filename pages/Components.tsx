

import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { IconUsers } from '../constants';
import StudentBreakdownChart from '../components/charts/PaymentsChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import FinancialStatusChart from '../components/charts/FinancialStatusChart';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-slate-800 text-white p-4 rounded-lg mt-4 text-sm overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const StatCardPreview: React.FC = () => (
    <Card className={`flex items-center p-4`}>
        <div className={`p-3 rounded-lg bg-blue-500/10`}>
            <div className="text-blue-500"><IconUsers /></div>
        </div>
        <div className="ml-4">
            <p className="text-sm text-[var(--theme-text-primary)]/70">Stat Card</p>
            <p className="text-2xl font-bold text-[var(--theme-text-primary)]">1,234</p>
        </div>
    </Card>
);


const ComponentsPage: React.FC = () => {
    const { showcasedComponents, setShowcasedComponents, students } = useContext(AppContext);
    const [isModalOpen, setModalOpen] = useState(false);
    
    const [notification, setNotification] = useState('');
    
    const handleAddComponent = (componentKey: string) => {
        if (!showcasedComponents.includes(componentKey)) {
            setShowcasedComponents(prev => [...prev, componentKey]);
            setNotification(`Componente "${componentKey}" adicionado ao Dashboard!`);
        } else {
             setNotification(`Componente "${componentKey}" já está no Dashboard.`);
        }
        
        setTimeout(() => setNotification(''), 3000);
    };

    const { paidStudents, unpaidStudents } = React.useMemo(() => {
        const paid = students.filter(s => s.paymentStatus === 'paid').length;
        const unpaid = students.filter(s => s.paymentStatus === 'unpaid').length;
        return { paidStudents: paid, unpaidStudents: unpaid };
    }, [students]);

    const components = [
        {
            name: 'Button',
            description: 'Botões para ações primárias, secundárias e destrutivas. Totalmente customizável via props.',
            preview: <div className="space-x-2"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="danger">Danger</Button></div>,
            code: `<Button>Primary</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="danger">Danger</Button>`,
            key: 'Button'
        },
        {
            name: 'Card',
            description: 'Container principal para agrupar conteúdo. Possui bordas, sombra e preenchimento padronizados.',
            preview: <Card>Conteúdo do card aqui.</Card>,
            code: `<Card>\n  <p>Seu conteúdo aqui</p>\n</Card>`,
            key: 'Card'
        },
        {
            name: 'Input',
            description: 'Campo de formulário padrão com label, estilizado para se adequar ao tema do sistema.',
            preview: <Input label="Seu Nome" placeholder="Ex: Hélio Gracie" />,
            code: `<Input label="Seu Nome" placeholder="Ex: Hélio Gracie" />`,
            key: 'Input'
        },
        {
            name: 'Modal',
            description: 'Janela sobreposta para exibir informações ou formulários importantes sem sair da página atual.',
            preview: <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>,
            code: `const [isOpen, setIsOpen] = useState(false);\n\n<Modal\n  isOpen={isOpen}\n  onClose={() => setIsOpen(false)}\n  title="Título do Modal"\n>\n  <p>Conteúdo...</p>\n</Modal>`,
            key: 'Modal'
        },
        {
            name: 'StatCard',
            description: 'Card especializado para exibir estatísticas chave com ícone, título e valor.',
            preview: <StatCardPreview />,
            code: `<StatCard \n  icon={<IconUsers />} \n  title="Total de Alunos" \n  value="150" \n  color="#3B82F6" \n/>`,
            key: 'StatCard'
        },
        {
            name: 'Gráfico de Divisão (Pizza)',
            description: 'Gráfico do tipo "Pizza" (ou "Donut") para mostrar proporções. Ideal para divisão de alunos, etc.',
            preview: <StudentBreakdownChart />,
            code: `<StudentBreakdownChart />`,
            key: 'PaymentsChart'
        },
         {
            name: 'Gráfico de Frequência (Barras)',
            description: 'Gráfico de barras para comparar valores ao longo do tempo. Usado para relatórios de frequência.',
            preview: <AttendanceChart />,
            code: `<AttendanceChart />`,
            key: 'AttendanceChart'
        },
        {
            name: 'Gráfico de Status (Barras Horizontais)',
            description: 'Gráfico de barras horizontal para comparar duas categorias. Usado para status financeiro.',
            preview: <FinancialStatusChart paidCount={paidStudents} unpaidCount={unpaidStudents} />,
            code: `<FinancialStatusChart paidCount={120} unpaidCount={30} />`,
            key: 'FinancialStatusChart'
        }
    ];

    return (
        <div className="space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Componente Modal">
                <p>Este é um exemplo de como o componente Modal funciona. Clique fora ou no 'X' para fechar.</p>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => setModalOpen(false)}>Ok, entendi!</Button>
                </div>
            </Modal>
            
            {notification && (
                <div className="fixed top-24 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down z-50">
                    {notification}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">Componentes</h1>
                <p className="text-[var(--theme-text-primary)]/70 mt-1">Biblioteca de componentes no estilo Shadcn/UI adaptados para o sistema.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {components.map(component => (
                    <Card key={component.key}>
                        <h2 className="text-xl font-bold text-[var(--theme-accent)]">{component.name}</h2>
                        <p className="text-[var(--theme-text-primary)]/80 mt-1 mb-4">{component.description}</p>
                        
                        <div className="p-8 my-4 bg-[var(--theme-bg)] rounded-lg flex items-center justify-center border border-[var(--theme-text-primary)]/10 min-h-[120px]">
                            {component.preview}
                        </div>
                        
                        <h3 className="font-semibold mt-4 text-[var(--theme-text-primary)]">Uso:</h3>
                        <CodeBlock>{component.code}</CodeBlock>
                        
                        <div className="mt-6 text-right">
                             <Button onClick={() => handleAddComponent(component.key)}>Usar na Dashboard</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ComponentsPage;

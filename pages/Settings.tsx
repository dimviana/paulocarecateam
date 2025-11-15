import React, { useContext, useState, FormEvent } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea
            id={id}
            rows={6}
            className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 transition duration-150 ease-in-out font-mono text-sm"
            {...props}
        />
    </div>
);

const SettingsPage: React.FC = () => {
    const { themeSettings, setThemeSettings } = useContext(AppContext);
    const [settings, setSettings] = useState(themeSettings);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'system' | 'webpage'>('system');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setThemeSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
            
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'system' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                    >
                        Sistema
                    </button>
                    <button
                        onClick={() => setActiveTab('webpage')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'webpage' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
                    >
                        Página Web
                    </button>
                </nav>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {activeTab === 'system' && (
                        <>
                            <h2 className="text-xl font-bold text-red-500 border-b border-gray-700 pb-2">Aparência</h2>
                            <Input label="Nome do Sistema" name="systemName" value={settings.systemName} onChange={handleChange} />
                            <Input label="URL da Logo" name="logoUrl" value={settings.logoUrl} onChange={handleChange} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Cor Primária" name="primaryColor" type="color" value={settings.primaryColor} onChange={handleChange} />
                                <Input label="Cor Secundária" name="secondaryColor" type="color" value={settings.secondaryColor} onChange={handleChange} />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="useGradient" name="useGradient" checked={settings.useGradient} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600" />
                                <label htmlFor="useGradient" className="ml-2 block text-sm text-gray-300">Usar degradê</label>
                            </div>
                            
                            <h2 className="text-xl font-bold text-red-500 border-b border-gray-700 pb-2 pt-4">Controle de Cobranças</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Dias para lembrete (antes do venc.)" name="reminderDaysBeforeDue" type="number" min="0" value={settings.reminderDaysBeforeDue} onChange={handleChange} />
                                <Input label="Dias para cobrança (após venc.)" name="overdueDaysAfterDue" type="number" min="0" value={settings.overdueDaysAfterDue} onChange={handleChange} />
                            </div>
                        </>
                    )}

                    {activeTab === 'webpage' && (
                         <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-red-500">Configurar Página Web Pública</h2>
                                <div className="flex items-center">
                                    <label htmlFor="publicPageEnabled" className="mr-3 text-sm font-medium text-gray-300">Ativar Página</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="publicPageEnabled" name="publicPageEnabled" checked={settings.publicPageEnabled} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>
                            </div>
                             <p className="text-sm text-gray-400 -mt-4">Quando ativada, esta página será a primeira coisa que os visitantes verão antes da tela de login.</p>
                             
                             <Textarea label="Seção Hero (Banner Principal)" name="heroHtml" value={settings.heroHtml} onChange={handleChange} />
                             <Textarea label="Seção 'Quem Somos'" name="aboutHtml" value={settings.aboutHtml} onChange={handleChange} />
                             <Textarea label="Seção 'Filiais'" name="branchesHtml" value={settings.branchesHtml} onChange={handleChange} />
                             <Textarea label="Rodapé" name="footerHtml" value={settings.footerHtml} onChange={handleChange} />
                             <Textarea label="CSS Personalizado" name="customCss" value={settings.customCss} onChange={handleChange} />
                             <Textarea label="JavaScript Personalizado" name="customJs" value={settings.customJs} onChange={handleChange} />
                        </>
                    )}
                    
                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-700 mt-6">
                        {saved && <span className="text-green-400">Salvo com sucesso!</span>}
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SettingsPage;
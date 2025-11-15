
import React, { useContext, useState, FormEvent } from 'react';
import { AppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const SettingsPage: React.FC = () => {
    const { themeSettings, setThemeSettings } = useContext(AppContext);
    const [settings, setSettings] = useState(themeSettings);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setThemeSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label="Nome do Sistema" 
                        name="systemName"
                        value={settings.systemName}
                        onChange={handleChange}
                    />
                     <Input 
                        label="URL da Logo" 
                        name="logoUrl"
                        value={settings.logoUrl}
                        onChange={handleChange}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Cor Primária"
                            name="primaryColor"
                            type="color"
                            value={settings.primaryColor}
                            onChange={handleChange}
                        />
                        <Input 
                            label="Cor Secundária"
                            name="secondaryColor"
                            type="color"
                            value={settings.secondaryColor}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="useGradient"
                            name="useGradient"
                            checked={settings.useGradient}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                        />
                        <label htmlFor="useGradient" className="ml-2 block text-sm text-gray-300">Usar degradê</label>
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        {saved && <span className="text-green-400">Salvo com sucesso!</span>}
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SettingsPage;

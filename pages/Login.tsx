
import React, { useState, useContext, FormEvent, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { IconEye, IconEyeOff } from '../constants';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

declare global {
  interface Window {
    google: any;
  }
}

const IconFacebook = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
    </svg>
);

const formatCPF = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const validateCPF = (cpf: string): boolean => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    return true; // simplified for brevity, full check in AppContext if needed
};

interface RegisterFormProps {
  onSave: (data: any) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({ name: '', address: '', responsible: '', responsibleRegistration: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setError(''); setLoading(true);
    const result = await onSave(formData);
    if (!result.success) setError(result.message || 'Erro no cadastro.');
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <Input label="Nome da Academia" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Endereço" name="address" value={formData.address} onChange={handleChange} required />
      <Input label="Nome do Responsável" name="responsible" value={formData.responsible} onChange={handleChange} required />
      <Input label="CPF do Responsável" name="responsibleRegistration" value={formData.responsibleRegistration} onChange={handleChange} required />
      <hr className="my-2" />
      <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      <Input label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} required />
      <Input label="Confirmar Senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
      </div>
    </form>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  
  const { themeSettings, login, loginGoogle, user, registerAcademy, loading: appLoading } = useContext(AppContext);
  const location = useLocation();

  const handleGoogleLoginResponse = async (response: any) => {
    setLoading(true); setError('');
    try {
        await loginGoogle(response.credential);
    } catch (err: any) {
        setError('Falha ao autenticar com Google.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (window.google && themeSettings.socialLoginEnabled && themeSettings.googleClientId) {
        try {
            window.google.accounts.id.initialize({ client_id: themeSettings.googleClientId, callback: handleGoogleLoginResponse });
            window.google.accounts.id.renderButton(document.getElementById("googleBtn"), { theme: "outline", size: "large", width: "100%" });
        } catch (e) {}
    }
  }, [themeSettings.socialLoginEnabled, themeSettings.googleClientId]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.includes('@') && /^[\d.-]*$/.test(val)) { setEmail(formatCPF(val)); return; }
    setEmail(val);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
        await login(email, password);
    } catch (err: any) {
        if (err.message?.includes('Usuário não encontrado')) setIsNotFoundModalOpen(true);
        else setError(err.message || 'Erro ao logar.');
    }
    setLoading(false);
  };

  const handleRegisterSave = async (data: any) => {
    const result = await registerAcademy(data);
    if (result.success) setIsRegisterModalOpen(false);
    return result;
  };
  
  if (appLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg)]">
        <main className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--theme-card-bg)] rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                    <img src={themeSettings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">{themeSettings.systemName}</h1>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <Input id="email" label="Email ou CPF" value={email} onChange={handleEmailChange} required />
                    <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border rounded-md px-3 py-2" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">{showPassword ? <IconEyeOff /> : <IconEye />}</button>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full">{loading ? 'Entrando...' : 'Entrar'}</Button>
                </form>
                <div className="text-center mt-6 text-sm">
                    <button onClick={() => setIsRegisterModalOpen(true)} className="font-semibold text-[var(--theme-accent)] hover:underline">Cadastre-se</button>
                </div>
                {themeSettings.socialLoginEnabled && (
                    <div className="mt-6">
                        <div id="googleBtn"></div>
                    </div>
                )}
            </div>
        </main>
        <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Cadastrar Nova Academia">
            <RegisterForm onSave={handleRegisterSave} onClose={() => setIsRegisterModalOpen(false)} />
        </Modal>
        <Modal isOpen={isNotFoundModalOpen} onClose={() => setIsNotFoundModalOpen(false)} title="Usuário não encontrado">
            <div className="text-center">
                <p>Deseja cadastrar uma nova academia?</p>
                <div className="flex justify-center gap-4 mt-4">
                    <Button variant="secondary" onClick={() => setIsNotFoundModalOpen(false)}>Não</Button>
                    <Button onClick={() => { setIsNotFoundModalOpen(false); setIsRegisterModalOpen(true); }}>Sim</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default Login;

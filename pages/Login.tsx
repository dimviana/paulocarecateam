import React, { useState, useContext, FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { IconEye, IconEyeOff } from '../constants';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const IconGoogle = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.8S110.3 19.6 244 19.6c70.3 0 129.8 27.8 174.2 71.9l-61.9 61.9c-23.7-22.6-58.4-36.8-95.3-36.8-83.2 0-151.4 68.2-151.4 152.1s68.2 152.1 151.4 152.1c96.4 0 132.8-68.9 137.9-105.7H244V261.8h244z"></path>
    </svg>
);

const IconFacebook = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
    </svg>
);


// --- Helper Functions for CPF ---

const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{3})(\d)/, '$1.$2') // Add first dot
    .replace(/(\d{3})(\d)/, '$1.$2') // Add second dot
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Add dash
    .replace(/(-\d{2})\d+?$/, '$1'); // Limit size
};

const validateCPF = (cpf: string): boolean => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const digits = cpf.split('').map(el => +el);

    const rest = (count: number): number => {
        let sum = 0;
        for (let i = 0; i < count; i++) {
        sum += digits[i] * (count + 1 - i);
        }
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    if (rest(9) !== digits[9]) return false;
    if (rest(10) !== digits[10]) return false;

    return true;
};


interface RegisterFormProps {
  onSave: (data: any) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '', // Academy Name
    address: '', // Academy Address
    responsible: '', // Responsible Name
    responsibleRegistration: '', // Responsible CPF/CNPJ
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await onSave(formData);
    if (!result.success) {
      setError(result.message || 'Ocorreu um erro no cadastro.');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      <Input label="Nome da Academia" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Endereço (Cidade/Estado)" name="address" value={formData.address} onChange={handleChange} required />
      <Input label="Seu Nome Completo (Responsável)" name="responsible" value={formData.responsible} onChange={handleChange} required />
      <Input label="Seu CPF (Responsável)" name="responsibleRegistration" value={formData.responsibleRegistration} onChange={handleChange} required />
      <hr className="my-2 border-slate-200" />
      <p className="text-sm text-slate-500">Crie suas credenciais de administrador:</p>
      <Input label="Email de Acesso" name="email" type="email" value={formData.email} onChange={handleChange} required />
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
  const [email, setEmail] = useState('androiddiviana@gmail.com');
  const [password, setPassword] = useState('dvsviana154');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState('');

  const { themeSettings, login, user, registerAcademy, loading: appLoading } = useContext(AppContext);
  const location = useLocation();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If user is typing digits and it resembles a CPF start, apply mask
    // We check if the input DOES NOT contain '@' to assume it might be a CPF
    if (!val.includes('@')) {
       // If only numbers or standard CPF chars, apply mask
       if (/^[\d.-]*$/.test(val)) {
           setEmail(formatCPF(val));
           return;
       }
    }
    setEmail(val);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation before sending
    const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(email);
    if (isCpf && !validateCPF(email)) {
        setError('CPF inválido. Verifique os números digitados.');
        return;
    }

    setLoading(true);
    setError('');
    
    try {
        const success = await login(email, password);
        if (!success) {
             // Note: The 'login' function in context swallows errors mostly, 
             // but for this requirement, we need to know if it was a 404.
             // Since we can't easily change the context signature without breaking things,
             // we rely on the fact that AppContext calls handleApiError which sets a global notification.
             // HOWEVER, to implement the popup flow, it's cleaner to perform a check or catch the specific error here.
             
             // Let's try a slightly different approach: The context 'login' returns boolean.
             // We can't know the error type from boolean. 
             // Re-implementing the fetch call here specifically to catch the 404 code 
             // would duplicate logic but ensures functionality. 
             // Ideally, `login` should return the error object or code.
             
             // Hack: We will check the notification state or modify context. 
             // Actually, let's rely on the fact that we are calling the API.
             // Let's bypass the context wrapper just for the status code check if login fails?
             // No, better to trust the backend response if we can get it.
             
             // Since I cannot easily change the Context interface in this single-file update to return the error code,
             // I will implement a shadow fetch here just to check the user existence IF login returns false.
             // This is a robust way to handle the specific requirement without refactoring the whole context.
             
             const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrCpf: email, pass: password }),
             });
             
             if (response.status === 404) {
                 setIsNotFoundModalOpen(true);
             } else {
                 const data = await response.json();
                 setError(data.message || 'Credenciais inválidas.');
             }
        }
    } catch (err) {
        setError('Erro de conexão.');
    }
    setLoading(false);
  };

  const handleRegisterSave = async (data: any) => {
    const result = await registerAcademy(data);
    if (result.success) {
        setRegisterSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsRegisterModalOpen(false);
    }
    return result;
  };
  
  // If app is initializing (validating token), show loading instead of login form
  if (appLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-accent)] mx-auto mb-4"></div>
                  <p className="text-[var(--theme-text-primary)]">Validando sessão...</p>
              </div>
          </div>
      );
  }

  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg)]">
        <main className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--theme-card-bg)] rounded-2xl p-8 border border-[var(--theme-text-primary)]/10 shadow-lg">
                <div className="text-center">
                    <img src={themeSettings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight">{themeSettings.systemName}</h1>
                    <p className="mt-2 text-[var(--theme-text-primary)]/70">Acesse sua conta para continuar</p>
                </div>

                {registerSuccessMessage && <p className="text-sm text-center text-green-600 bg-green-100 p-3 rounded-md mt-6">{registerSuccessMessage}</p>}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">Email ou CPF</label>
                        <input 
                            id="email"
                            type="text"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            placeholder="seu@email.com ou 000.000.000-00"
                            className="w-full bg-[var(--theme-bg)] border border-[var(--theme-text-primary)]/20 text-[var(--theme-text-primary)] rounded-md px-3 py-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] transition duration-150 ease-in-out placeholder:text-[var(--theme-text-primary)]/40"
                        />
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">Senha</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="********"
                                className="w-full bg-[var(--theme-bg)] border border-[var(--theme-text-primary)]/20 text-[var(--theme-text-primary)] rounded-md px-3 py-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] transition duration-150 ease-in-out placeholder:text-[var(--theme-text-primary)]/40 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--theme-icon)] hover:text-[var(--theme-text-primary)]"
                                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                            >
                                {showPassword ? <IconEyeOff /> : <IconEye />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-red-600">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--theme-button-bg)] text-[var(--theme-button-text)] hover:brightness-95 focus:ring-[var(--theme-button-bg)] focus:ring-offset-[var(--theme-bg)] px-4 py-2 text-base">
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6 text-sm">
                    <span className="text-[var(--theme-text-primary)]/70">Não tem uma conta? </span>
                    <button
                        type="button"
                        onClick={() => {
                        setRegisterSuccessMessage('');
                        setIsRegisterModalOpen(true);
                        }}
                        className="font-semibold text-[var(--theme-accent)] hover:underline"
                    >
                        Cadastre-se
                    </button>
                </div>

                {themeSettings.socialLoginEnabled && (
                    <>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--theme-text-primary)]/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[var(--theme-card-bg)] text-[var(--theme-text-primary)]/60">Ou continue com</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button type="button" className="w-full inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-100 focus:ring-slate-500 border border-slate-300 px-4 py-2 text-base">
                                <IconGoogle />
                                Entrar com Google
                            </button>
                            <button type="button" className="w-full inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-base">
                                <IconFacebook />
                                Entrar com Facebook
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
        <footer className="py-4 text-center text-sm text-[var(--theme-text-primary)]/60">
            <p>© {new Date().getFullYear()} {themeSettings.copyrightText} - <a href="https://github.com/dimviana/paulocarecateam" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition-colors">Versão {themeSettings.systemVersion}</a></p>
        </footer>

        {/* Modal for Registration Form */}
        <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Cadastrar Nova Academia">
            <RegisterForm onSave={handleRegisterSave} onClose={() => setIsRegisterModalOpen(false)} />
        </Modal>
        
        {/* Modal for User Not Found - Ask to Register */}
        <Modal 
            isOpen={isNotFoundModalOpen} 
            onClose={() => setIsNotFoundModalOpen(false)} 
            title="Usuário não encontrado"
            size="md"
        >
            <div className="text-center space-y-4">
                <p className="text-[var(--theme-text-primary)]/80">
                    Não encontramos nenhum usuário com o login <strong>{email}</strong>.
                </p>
                <p className="text-[var(--theme-text-primary)]/80">
                    Gostaria de cadastrar uma nova academia agora?
                </p>
                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setIsNotFoundModalOpen(false)}>
                        Não, voltar
                    </Button>
                    <Button onClick={() => {
                        setIsNotFoundModalOpen(false);
                        setIsRegisterModalOpen(true);
                    }}>
                        Sim, cadastrar
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default Login;

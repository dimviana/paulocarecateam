
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

  const { themeSettings, login, loginGoogle, user, registerAcademy, loading: appLoading } = useContext(AppContext);
  const location = useLocation();

  const handleGoogleLoginResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
        const success = await loginGoogle(response.credential);
        if (!success) {
            // If success is false but no specific error thrown, it might be a generic error.
            // Note: loginGoogle inside context will throw specific errors for 404.
        }
    } catch (err: any) {
        if (err.message === 'USER_NOT_FOUND') {
             setIsNotFoundModalOpen(true);
        } else {
             setError('Falha ao autenticar com Google.');
        }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initialize Google Sign-In if enabled
    if (window.google && themeSettings.socialLoginEnabled && themeSettings.googleClientId) {
        try {
            window.google.accounts.id.initialize({
                client_id: themeSettings.googleClientId,
                callback: handleGoogleLoginResponse
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large", width: "100%" }
            );
        } catch (e) {
            console.error("Google Sign-In initialization failed:", e);
        }
    }
  }, [themeSettings.socialLoginEnabled, themeSettings.googleClientId]);


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
             // We perform a manual check just to display the specific 404 modal,
             // effectively replicating the user check logic for UI purposes if the generic login fails silently.
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
                        <div className="grid grid-cols-1 gap-4">
                            {themeSettings.googleClientId && (
                                <div id="googleBtn" style={{ minHeight: '40px' }}></div>
                            )}
                            {themeSettings.facebookAppId && (
                                <button type="button" className="w-full inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-base">
                                    <IconFacebook />
                                    Entrar com Facebook
                                </button>
                            )}
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
                    Não encontramos nenhum usuário cadastrado no sistema com este login.
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

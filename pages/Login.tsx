

import React, { useState, useContext, FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { IconEye, IconEyeOff } from '../constants';

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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { themeSettings, login, user } = useContext(AppContext);
  const location = useLocation();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Credenciais inválidas. Tente novamente.');
    }
    setLoading(false);
  };
  
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
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">Email ou CPF</label>
                        <input 
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com ou 123.456.789-00"
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
            <p>© {new Date().getFullYear()} {themeSettings.copyrightText} - Versão {themeSettings.systemVersion}</p>
        </footer>
    </div>
  );
};

export default Login;
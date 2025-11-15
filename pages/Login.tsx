
import React, { useState, useContext, FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 bg-cover bg-center">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
         <div className="absolute inset-0 -z-10 h-full w-full bg-gray-100 dark:bg-gray-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-red-600/30 rounded-xl shadow-2xl shadow-gray-500/40 dark:shadow-red-900/40">
            <div className="text-center">
                <img src={themeSettings.logoUrl} alt="Logo" className="mx-auto h-16 w-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-wider">{themeSettings.systemName}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Acesse sua conta</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
                <Input 
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                />
                 <Input 
                    id="password"
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default Login;
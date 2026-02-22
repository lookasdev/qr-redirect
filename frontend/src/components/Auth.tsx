import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthProps {
    defaultMode: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ defaultMode }) => {
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkServer = async () => {
            try {
                await api.get('/health', { timeout: 5000 });
                setServerStatus('online');
            } catch (err) {
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                await api.post('/api/auth/register', { username, password });
                // Automatically login after successful registration
                const loginRes = await api.post('/api/auth/login',
                    new URLSearchParams({ username, password }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                login(loginRes.data.access_token);
                navigate('/dashboard');
            } else {
                const res = await api.post('/api/auth/login',
                    new URLSearchParams({ username, password }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                login(res.data.access_token);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">
                        {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                    <div className="mt-3 flex justify-center items-center gap-2">
                        {serverStatus === 'checking' && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5 transition-colors">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 animate-pulse"></div>
                                Checking connection...
                            </span>
                        )}
                        {serverStatus === 'online' && (
                            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                Server Online
                            </span>
                        )}
                        {serverStatus === 'offline' && (
                            <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                Server Unreachable
                            </span>
                        )}
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                {mode === 'login' ?
                                    <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" /> :
                                    <UserPlus className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                                }
                            </span>
                            {mode === 'login' ? 'Sign in' : 'Register'}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        {mode === 'login' ? (
                            <button type="button" onClick={() => setMode('register')} className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                                Don't have an account? Register
                            </button>
                        ) : (
                            <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                                Already have an account? Sign in
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;

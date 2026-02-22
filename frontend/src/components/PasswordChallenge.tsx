import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';

const PasswordChallenge: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post(`/api/r/${slug}/verify`, { password });
            if (res.data.destination_url) {
                window.location.href = res.data.destination_url;
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Incorrect password");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors px-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center max-w-md w-full text-center animate-in zoom-in-95 mt-[-10vh] transition-colors">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">Protected Link</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors">
                    Please enter the password to access this destination.
                </p>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="mb-6 relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all outline-none text-center text-lg tracking-widest placeholder:tracking-normal"
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                Unlock Link
                                <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                            </>
                        )}
                    </button>
                </form>

            </div>

            <p className="mt-8 text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 transition-colors">
                <Lock className="w-3 h-3" /> Securely routed by Scanvas
            </p>
        </div>
    );
};

export default PasswordChallenge;

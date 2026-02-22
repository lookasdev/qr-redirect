import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { QrCode, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
    const { isAuthenticated } = useAuth();

    // If user is already logged in, redirect them to dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
            {/* Hero Section */}
            <div className="flex-grow flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-primary-100 rounded-full mb-8 shadow-sm">
                        <QrCode className="w-12 h-12 text-primary-600" />
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 transition-colors">
                        Routing the physical world <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">at the speed of light.</span>
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10 transition-colors">
                        Create dynamic QR codes that link anywhere. Update destinations instantly without ever reprinting your materials.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                        >
                            Get Started Now
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white dark:bg-gray-800 py-20 border-t border-gray-100 dark:border-gray-700 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="text-center p-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">Dynamic Routing</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed transition-colors">Change where your QR codes point in milliseconds. Never print a replacement code again.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mb-6">
                                <BarChart3 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">Real-time Analytics</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed transition-colors">Track scans, unique devices, and peak engagement times with beautiful interactive charts.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-50 text-purple-600 mb-6">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">Permanent Links</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed transition-colors">Utilizing edge networks and local bypassing ensures your printed codes remain forever linked.</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-gray-900 dark:bg-black py-8 text-center text-gray-400 transition-colors">
                <p>&copy; {new Date().getFullYear()} Scanvas. Built for speed.</p>
            </footer>
        </div>
    );
};

export default Landing;

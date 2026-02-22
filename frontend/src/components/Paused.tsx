import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Paused: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors px-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30 flex flex-col items-center max-w-md text-center">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Link Temporarily Paused</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    This Scanvas link has been disabled by its owner and is not currently accepting visitors.
                </p>
            </div>
        </div>
    );
};

export default Paused;

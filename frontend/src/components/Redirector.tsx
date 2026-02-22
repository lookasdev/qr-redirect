import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const Redirector: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDestination = async () => {
            try {
                const res = await api.get(`/api/r/${slug}`);
                if (res.data.is_paused) {
                    navigate('/paused', { replace: true });
                } else if (res.data.is_protected) {
                    navigate(`/challenge/${slug}`, { replace: true });
                } else if (res.data.destination_url) {
                    window.location.replace(res.data.destination_url);
                } else {
                    navigate('/not-found', { replace: true });
                }
            } catch (err) {
                console.error("Redirect failed:", err);
                navigate('/not-found', { replace: true });
            }
        };

        if (slug) {
            fetchDestination();
        }
    }, [slug, navigate]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Routing you to destination...</p>
        </div>
    );
};

export default Redirector;

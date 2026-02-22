import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        config.headers['ngrok-skip-browser-warning'] = '69420';

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

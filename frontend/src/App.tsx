import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AnalyticsBoard from './components/AnalyticsBoard';
import Redirector from './components/Redirector';
import Landing from './components/Landing';
import Paused from './components/Paused';
import PasswordChallenge from './components/PasswordChallenge';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                <div className="p-1.5 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors flex items-center justify-center h-10 w-10 overflow-hidden">
                  <img src="/logo.svg" alt="Scanvas Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">Scanvas</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth defaultMode="login" />} />
          <Route path="/register" element={<Auth defaultMode="register" />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/:slug"
            element={
              <ProtectedRoute>
                <AnalyticsBoard />
              </ProtectedRoute>
            }
          />
          <Route path="/not-found" element={
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Link Not Found</h1>
              <p className="text-gray-600">The QR link you scanned does not exist or has been removed.</p>
            </div>
          } />
          <Route path="/paused" element={<Paused />} />
          <Route path="/challenge/:slug" element={<PasswordChallenge />} />
          <Route path="/r/:slug" element={<Redirector />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

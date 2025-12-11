import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import ErrorBoundary from './components/ErrorBoundary';
import useToasts from '@/components/ui/toast';
import { useEffect } from 'react';
import { setOnlineState } from '@/lib/api';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

   if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-150"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-300"></div>
      </div>
      <p className="mt-2 text-blue-700 font-medium">Loading...</p>
    </div>
  );
}

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { ToastContainer, add } = useToasts();

  // Global online/offline listeners to set queue state and show toasts
  useEffect(() => {
    const onOnline = () => { setOnlineState(true); add('Reconnected', 'success'); };
    const onOffline = () => { setOnlineState(false); add('You are offline. Changes will retry.', 'error'); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [add]);

  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/board/:id"
              element={
                <PrivateRoute>
                  <BoardView />
                </PrivateRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
}

export default App;

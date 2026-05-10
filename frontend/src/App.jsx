import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';

export const SessionContext = createContext({
  session: null,
  loading: true,
  refreshSession: async () => {},
});

function ProtectedRoute({ children }) {
  const { session, loading } = useSessionValue();

  if (loading) {
    return <div className="page-shell centered-page">Loading your workspace...</div>;
  }

  if (!session?.isAuthenticated || session?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AuthRoute({ children }) {
  const { session, loading } = useSessionValue();

  if (loading) {
    return <div className="page-shell centered-page">Checking your session...</div>;
  }

  if (session?.isAuthenticated && !session?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function useSessionValue() {
  const value = useContext(SessionContext);
  if (value) {
    return value;
  }
  return { session: null, loading: true, refreshSession: async () => {} };
}

function useSessionState() {
  const [session, setSession] = useState(window.__APP_CONFIG__ || null);
  const [loading, setLoading] = useState(false);

  const refreshSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/session');
      const result = await response.json();
      if (result.success) {
        setSession(result);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session || typeof session.isAuthenticated === 'undefined') {
      refreshSession();
    }
  }, []);

  return { session, setSession, loading, refreshSession };
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/forgot_password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/resume_builder" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
      <Route path="/builder" element={<Navigate to="/resume_builder" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const sessionValue = useSessionState();

  return (
    <SessionContext.Provider value={sessionValue}>
      <BrowserRouter>
        <Navbar />
        <AppContent />
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

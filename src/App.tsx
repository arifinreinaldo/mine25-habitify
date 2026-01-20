import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Placeholder Pages (Landing still placeholder for now)
const Landing = () => (
  <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-8 text-center bg-background">
    <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-bounce-slow">
      Habitify Clone
    </h1>
    <p className="text-xl text-muted max-w-[600px]">
      Build better habits, one streak at a time. Join thousands of users achieving their goals.
    </p>
    <div className="flex gap-4">
      <a href="/login" className="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Get Started
      </a>
      <a href="/login" className="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium transition-colors border rounded-md border-input bg-background hover:bg-surface hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        Log In
      </a>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

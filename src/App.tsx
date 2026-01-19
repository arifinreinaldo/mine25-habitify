import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

// Placeholder Pages
const Login = () => <div className="min-h-screen grid place-items-center"><h1>Login Page</h1></div>;
const Signup = () => <div className="min-h-screen grid place-items-center"><h1>Signup Page</h1></div>;
const Dashboard = () => <div className="min-h-screen grid place-items-center"><h1>Dashboard (Protected)</h1></div>;
const Landing = () => <div className="min-h-screen grid place-items-center"><h1>Landing Page</h1><a href="/login" className="text-blue-500">Go to Login</a></div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center">Loading...</div>;
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

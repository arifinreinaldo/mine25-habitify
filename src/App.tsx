import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Redirect based on auth state
const Home = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Loading...</div>;

  return <Navigate to={user ? "/dashboard" : "/login"} />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
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
      </ThemeProvider>
    </Router>
  );
}

export default App;

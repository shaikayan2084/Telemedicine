import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import useAuthStore from './hooks/useAuthStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EHRPage from './pages/EHRPage';
import TelehealthRoomPage from './pages/TelehealthRoomPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import VerifyPrescriptionPage from './pages/VerifyPrescriptionPage';

// ─── MUI Theme ────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    primary: { main: '#0d47a1' },
    secondary: { main: '#00897b' },
    background: { default: '#f0f4f8' },
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
      },
    },
  },
});

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/verify-prescription/:id" element={<VerifyPrescriptionPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
          <Route path="/ehr" element={<ProtectedRoute><EHRPage /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/room/:appointmentId" element={<ProtectedRoute><TelehealthRoomPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

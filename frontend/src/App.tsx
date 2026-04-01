import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import GrievanceRoutes from '@/components/GrievanceRoutes/GrievanceRoutes';
import TicketRoutes from '@/components/TicketRoutes/TicketRoutes';
import Dashboard from '@/components/Dashboard/Dashboard';
import Admin from '@/components/Admin/Admin';
import Settings from '@/components/Settings/Settings';
import NotFound from '@/components/NotFound/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import { getCurrentUser } from '@/utils/auth';
import './App.css';

function App() {
  const SettingsWithNavigate = () => {
    const navigate = useNavigate();
    return <Settings onClose={() => navigate(-1)} />;
  };

  // Dashboard component that renders based on user role
  const DashboardWrapper = () => {
    const userInfo = getCurrentUser();
    const isAdmin = userInfo?.role === 'ADMIN';
    
    return isAdmin ? <Dashboard /> : <TicketRoutes showUserDashboard />;
  };

  return (
    <Router basename="/municipality">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardWrapper />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketRoutes />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/grievance"
          element={
            <ProtectedRoute>
              <Layout>
                <GrievanceRoutes />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <SettingsWithNavigate />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        
        {/* Fallback route - redirect root and unmatched paths to grievance system */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <GrievanceRoutes />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all route for undefined paths - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
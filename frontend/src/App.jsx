import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminIncidents from './pages/AdminIncidents';
import UserManagement from './pages/UserManagement';
import AdminSla from './pages/AdminSla';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';

// Engineer Pages
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerAssigned from './pages/EngineerAssigned';
import EngineerUnassigned from './pages/EngineerUnassigned';
import EngineerHistory from './pages/EngineerHistory';

// User Pages
import UserDashboard from './pages/UserDashboard';
import CreateIncident from './pages/CreateIncident';
import UserIncidents from './pages/UserIncidents';

// Shared / Contextual Multi-page Views
import TicketDetails from './pages/TicketDetails';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

// Smart Root Redirect based on user's authenticated role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'engineer') return <Navigate to="/engineer/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

// Intelligent Incident Route Redirector for /tickets/:id
const TicketRedirect = () => {
  const { id } = useParams();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role === 'admin' ? 'admin' : user?.role === 'engineer' ? 'engineer' : 'user';
  return <Navigate to={`/${role}/incidents/${id}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* Legacy / Direct Shortcuts */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/engineer" element={<Navigate to="/engineer/dashboard" replace />} />
          <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="/tickets/:id" element={<TicketRedirect />} />

          {/* ======================================================== */}
          {/* ADMIN MULTI-PAGE ROUTES (Role: admin only)               */}
          {/* ======================================================== */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/incidents"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminIncidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/incidents/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sla"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSla />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* ENGINEER MULTI-PAGE ROUTES (Role: engineer, admin)      */}
          {/* ======================================================== */}
          <Route
            path="/engineer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <EngineerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/assigned"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <EngineerAssigned />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/unassigned"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <EngineerUnassigned />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/incidents/:id"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/history"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <EngineerHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/notifications"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/engineer/profile"
            element={
              <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* END-USER MULTI-PAGE ROUTES (Role: user, engineer, admin) */}
          {/* ======================================================== */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/create-incident"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <CreateIncident />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/incidents"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <UserIncidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/incidents/:id"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/notifications"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute allowedRoles={['user', 'engineer', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 404 NOT FOUND FALLBACK                                   */}
          {/* ======================================================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

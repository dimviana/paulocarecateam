import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/Students';
import FinancePage from './pages/Finance';
import SettingsPage from './pages/Settings';
import GraduationsPage from './pages/Graduations';
import SchedulesPage from './pages/Schedules';
import AttendancePage from './pages/Attendance';
import ProfilePage from './pages/Profile';

const AcademiesPage = () => <div className="text-white text-2xl">Página de Academias (em construção)</div>;

const ProtectedRoute: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/graduations" element={<GraduationsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/academies" element={<AcademiesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
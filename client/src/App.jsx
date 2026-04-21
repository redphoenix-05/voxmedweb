import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import Unauthorized from '@/pages/Unauthorized';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageHospitals from '@/pages/admin/ManageHospitals';
import ManageDoctors from '@/pages/admin/ManageDoctors';
import ManageUsers from '@/pages/admin/ManageUsers';
import RevenueDashboard from '@/pages/admin/RevenueDashboard';

import HospitalDashboard from '@/pages/hospital/HospitalDashboard';
import HospitalDoctors from '@/pages/hospital/HospitalDoctors';
import HospitalStaff from '@/pages/hospital/HospitalStaff';
import HospitalTests from '@/pages/hospital/HospitalTests';
import HospitalAppointments from '@/pages/hospital/HospitalAppointments';
import HospitalReports from '@/pages/hospital/HospitalReports';
import HospitalProfit from '@/pages/hospital/HospitalProfit';

import ReceptionistSchedules from '@/pages/receptionist/ReceptionistSchedules';
import ReceptionistBook from '@/pages/receptionist/ReceptionistBook';

import LabPatients from '@/pages/lab/LabPatients';
import LabUpload from '@/pages/lab/LabUpload';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/hospitals" element={<ManageHospitals />} />
                <Route path="/admin/doctors" element={<ManageDoctors />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/revenue" element={<RevenueDashboard />} />
              </Route>
            </Route>

            {/* Hospital Admin */}
            <Route element={<ProtectedRoute allowedRoles={['hospital_admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/hospital" element={<HospitalDashboard />} />
                <Route path="/hospital/doctors" element={<HospitalDoctors />} />
                <Route path="/hospital/staff" element={<HospitalStaff />} />
                <Route path="/hospital/tests" element={<HospitalTests />} />
                <Route path="/hospital/appointments" element={<HospitalAppointments />} />
                <Route path="/hospital/reports" element={<HospitalReports />} />
                <Route path="/hospital/profit" element={<HospitalProfit />} />
              </Route>
            </Route>

            {/* Receptionist */}
            <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/receptionist" element={<ReceptionistSchedules />} />
                <Route path="/receptionist/book" element={<ReceptionistBook />} />
              </Route>
            </Route>

            {/* Lab Staff */}
            <Route element={<ProtectedRoute allowedRoles={['lab_staff']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/lab" element={<LabPatients />} />
                <Route path="/lab/upload" element={<LabUpload />} />
              </Route>
            </Route>

            {/* Default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

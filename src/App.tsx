import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AyushKioskHome from './pages/AyushKioskHome';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import PatientPortalPage from './pages/PatientPortalPage';
import HumanViewerPage from './pages/HumanViewerPage';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<AyushKioskHome />} />
          <Route path="/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/portal" element={<DoctorDashboardPage />} />
          <Route path="/patient" element={<PatientPortalPage />} />
          <Route path="/patient-portal" element={<PatientPortalPage />} />
          <Route path="/human-viewer" element={<HumanViewerPage />} />
          <Route path="/human-3d" element={<HumanViewerPage />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

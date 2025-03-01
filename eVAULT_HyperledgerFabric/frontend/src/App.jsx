import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';

// Lawyer Pages
import LawyerDashboard from './pages/lawyer/Dashboard';
import LawyerCaseList from './pages/lawyer/CaseList';
import LawyerCaseSubmission from './pages/lawyer/CaseSubmission';
import LawyerCaseDetails from './pages/lawyer/CaseDetails';
import LawyerNotifications from './pages/lawyer/Notifications';
import LawyerProfile from './pages/lawyer/Profile';
import MainLayout from './layouts/MainLayout';

// Registrar Pages
import RegistrarDashboard from './pages/registrar/Dashboard';
import RegistrarCaseAssignment from './pages/registrar/CaseAssignment';
import RegistrarCaseVerification from './pages/registrar/CaseVerification';
import RegistrarCaseHistory from './pages/registrar/CaseHistory';
import RegistrarNotifications from './pages/registrar/Notifications';
import RegistrarProfile from './pages/registrar/Profile';
import RegistrarLogin from './pages/registrar/Login';
import RegistrarCases from './pages/registrar/Cases';

// Stamp Reporter Pages
import StampReporterDashboard from './pages/stampreporter/Dashboard';
import StampReporterCases from './pages/stampreporter/Cases';
import StampReporterCaseVerification from './pages/stampreporter/CaseVerification';
import StampReporterCaseHistory from './pages/stampreporter/CaseHistory';
import StampReporterNotifications from './pages/stampreporter/Notifications';
import StampReporterProfile from './pages/stampreporter/Profile';
import StampReporterLogin from './pages/stampreporter/Login';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Lawyer Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LawyerDashboard />} />
            <Route path="cases" element={<LawyerCaseList />} />
            <Route path="submit-case" element={<LawyerCaseSubmission />} />
            <Route path="case/:id" element={<LawyerCaseDetails />} />
            <Route path="notifications" element={<LawyerNotifications />} />
            <Route path="profile" element={<LawyerProfile />} />
          </Route>

          {/* Registrar Routes */}
          <Route path="/registrar/login" element={<RegistrarLogin />} />
          <Route path="/registrar" element={<MainLayout />}>
            <Route path="dashboard" element={<RegistrarDashboard />} />
            <Route path="cases" element={<RegistrarCases />} />
            <Route path="case-verification" element={<RegistrarCaseVerification />} />
            <Route path="case-verification/:id" element={<RegistrarCaseVerification />} />
            <Route path="case-history" element={<RegistrarCaseHistory />} />
            <Route path="notifications" element={<RegistrarNotifications />} />
            <Route path="profile" element={<RegistrarProfile />} />
          </Route>

          {/* Stamp Reporter Routes */}
          <Route path="/stampreporter/login" element={<StampReporterLogin />} />
          <Route path="/stampreporter" element={<MainLayout />}>
            <Route path="dashboard" element={<StampReporterDashboard />} />
            <Route path="cases" element={<StampReporterCases />} />
            <Route path="case-verification/:id" element={<StampReporterCaseVerification />} />
            <Route path="case-history" element={<StampReporterCaseHistory />} />
            <Route path="notifications" element={<StampReporterNotifications />} />
            <Route path="profile" element={<StampReporterProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

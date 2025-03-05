import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';

// Lawyer Pages
import LawyerDashboard from './pages/lawyer/Dashboard';
import LawyerCases from './pages/lawyer/Cases';
import LawyerCaseSubmission from './pages/lawyer/CaseSubmission';
import LawyerCaseDetails from './pages/lawyer/CaseDetails';
import LawyerCaseHistory from './pages/lawyer/CaseHistory';
import LawyerNotifications from './pages/lawyer/Notifications';
import LawyerProfile from './pages/lawyer/Profile';
import LawyerLogin from './pages/lawyer/Login';

// Bench Clerk Pages
import BenchClerkDashboard from './pages/benchclerk/Dashboard';
import BenchClerkCaseManagement from './pages/benchclerk/CaseManagement';
import BenchClerkJudgeDecisionConfirmation from './pages/benchclerk/JudgeDecisionConfirmation';
import BenchClerkCaseStatusTracking from './pages/benchclerk/CaseStatusTracking';
import BenchClerkNotifications from './pages/benchclerk/Notifications';
import BenchClerkProfile from './pages/benchclerk/Profile';
import BenchClerkLogin from './pages/benchclerk/Login';

// Registrar Pages
import RegistrarDashboard from './pages/registrar/Dashboard';
import RegistrarCases from './pages/registrar/Cases';
import RegistrarCaseVerification from './pages/registrar/CaseVerification';
import RegistrarCaseHistory from './pages/registrar/CaseHistory';
import RegistrarNotifications from './pages/registrar/Notifications';
import RegistrarProfile from './pages/registrar/Profile';
import RegistrarLogin from './pages/registrar/Login';

// Stamp Reporter Pages
import StampReporterDashboard from './pages/stampreporter/Dashboard';
import StampReporterCases from './pages/stampreporter/Cases';
import StampReporterCaseVerification from './pages/stampreporter/CaseVerification';
import StampReporterCaseHistory from './pages/stampreporter/CaseHistory';
import StampReporterNotifications from './pages/stampreporter/Notifications';
import StampReporterProfile from './pages/stampreporter/Profile';
import StampReporterLogin from './pages/stampreporter/Login';

// Judge Pages
import JudgeDashboard from './pages/judge/Dashboard';
import JudgeCaseReview from './pages/judge/CaseReview';
import JudgeCaseStatus from './pages/judge/CaseStatus';
import JudgeNotifications from './pages/judge/Notifications';
import JudgeProfile from './pages/judge/Profile';
import JudgeLogin from './pages/judge/Login';

import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Lawyer Routes */}
          <Route path="/lawyer/login" element={<LawyerLogin />} />
          <Route path="/lawyer" element={<MainLayout />}>
            <Route path="dashboard" element={<LawyerDashboard />} />
            <Route path="cases" element={<LawyerCases />} />
            <Route path="submit-case" element={<LawyerCaseSubmission />} />
            <Route path="case/:id" element={<LawyerCaseDetails />} />
            <Route path="case-history" element={<LawyerCaseHistory />} />
            <Route path="notifications" element={<LawyerNotifications />} />
            <Route path="profile" element={<LawyerProfile />} />
          </Route>

          {/* Bench Clerk Routes */}
          <Route path="/benchclerk/login" element={<BenchClerkLogin />} />
          <Route path="/benchclerk" element={<MainLayout />}>
            <Route path="dashboard" element={<BenchClerkDashboard />} />
            <Route path="case-management" element={<BenchClerkCaseManagement />} />
            <Route path="judge-decision-confirmation" element={<BenchClerkJudgeDecisionConfirmation />} />
            <Route path="case-status-tracking" element={<BenchClerkCaseStatusTracking />} />
            <Route path="notifications" element={<BenchClerkNotifications />} />
            <Route path="profile" element={<BenchClerkProfile />} />
          </Route>

          {/* Registrar Routes */}
          <Route path="/registrar/login" element={<RegistrarLogin />} />
          <Route path="/registrar" element={<MainLayout />}>
            <Route path="dashboard" element={<RegistrarDashboard />} />
            <Route path="cases" element={<RegistrarCases />} />
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

          {/* Judge Routes */}
          <Route path="/judge/login" element={<JudgeLogin />} />
          <Route path="/judge" element={<MainLayout />}>
            <Route path="dashboard" element={<JudgeDashboard />} />
            <Route path="case-review" element={<JudgeCaseReview />} />
            <Route path="case-status" element={<JudgeCaseStatus />} />
            <Route path="notifications" element={<JudgeNotifications />} />
            <Route path="profile" element={<JudgeProfile />} />
          </Route>

          {/* Redirect root to lawyer login */}
          <Route path="/" element={<LawyerLogin />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

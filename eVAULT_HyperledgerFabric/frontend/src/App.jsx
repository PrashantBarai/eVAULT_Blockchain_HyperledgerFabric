import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseSubmission from './pages/CaseSubmission';
import CaseDetails from './pages/CaseDetails';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import MainLayout from './layouts/MainLayout';

const App = () => {
  // This will be replaced with proper auth check later
  const isAuthenticated = true;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
          >
            <Route index element={<Dashboard />} />
            <Route path="cases" element={<CaseList />} />
            <Route path="case-details/:id" element={<CaseDetails />} />
            <Route path="submit-case" element={<CaseSubmission />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

import * as React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegistrarSection = location.pathname.startsWith('/registrar');
  const isStampReporterSection = location.pathname.startsWith('/stampreporter');
  const isBenchClerkSection = location.pathname.startsWith('/benchclerk');
  const isJudgeSection = location.pathname.startsWith('/judge');
  
  // Determine user info based on role
  const getUserInfo = () => {
    if (isRegistrarSection) {
      return {
        title: 'Court Registrar',
        name: 'Sarah Wilson',
        avatarColor: '#1a237e'
      };
    } else if (isBenchClerkSection) {
      return {
        title: 'Bench Clerk',
        name: 'Michael Brown',
        avatarColor: '#1a237e'
      };
    } else if (isJudgeSection) {
      return {
        title: 'Hon. Judge',
        name: 'Robert Davis',
        avatarColor: '#1a237e'
      };
    } else if (isStampReporterSection) {
      return {
        title: 'Stamp Reporter',
        name: 'Emily Johnson',
        avatarColor: '#3f51b5'
      };
    } else {
      return {
        title: 'Adv.',
        name: 'John Doe',
        avatarColor: '#d32f2f'
      };
    }
  };
  
  const userInfo = getUserInfo();
  const userInitial = userInfo.name.charAt(0);

  // Get the appropriate header background color
  const getHeaderBackground = () => {
    if (isBenchClerkSection) {
      return 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)';
    } else if (isJudgeSection) {
      return 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)';
    } else if (isRegistrarSection) {
      return '#1a237e';
    } else {
      return '#3f51b5';
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: 'calc(100vw - 240px)',
        overflow: 'hidden'
      }}>
        <AppBar 
          position="static" 
          sx={{ 
            background: getHeaderBackground(),
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <Toolbar sx={{ width: '100%', pr: 3 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Legal Document Management System
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: userInfo.avatarColor }}>{userInitial}</Avatar>
              <Typography variant="subtitle1">{userInfo.title} {userInfo.name}</Typography>
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/login')}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ 
          flexGrow: 1,
          width: '100%',
          overflow: 'auto',
          bgcolor: '#fff'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;

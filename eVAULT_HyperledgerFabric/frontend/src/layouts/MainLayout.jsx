import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegistrarSection = location.pathname.startsWith('/registrar');
  const userTitle = isRegistrarSection ? 'Court Registrar' : 'Adv.';
  const userName = isRegistrarSection ? 'Sarah Wilson' : 'John Doe';
  const userInitial = userName.charAt(0);
  const avatarColor = isRegistrarSection ? '#1a237e' : '#d32f2f';

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
            background: isRegistrarSection ? '#1a237e' : '#3f51b5',
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <Toolbar sx={{ width: '100%', pr: 3 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Legal Document Management System
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: avatarColor }}>{userInitial}</Avatar>
              <Typography variant="subtitle1">{userTitle} {userName}</Typography>
              <IconButton 
                color="inherit" 
                onClick={() => {localStorage.clear();navigate(isRegistrarSection ? '/registrar/login' : '/')}}
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

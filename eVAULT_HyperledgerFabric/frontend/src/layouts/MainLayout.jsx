import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const navigate = useNavigate();

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
            background: '#3f51b5', 
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <Toolbar sx={{ width: '100%', pr: 3 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Legal Document Management System
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#d32f2f' }}>A</Avatar>
              <Typography variant="subtitle1">Adv. John Doe</Typography>
              <IconButton color="inherit" onClick={() => navigate('/login')}>
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

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserData, clearAuth } from '../utils/auth';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundImage: 'linear-gradient(90deg, #1a237e 0%, #534bae 100%)',
  boxShadow: 'none',
}));

const Header = () => {
  const user = getUserData(); // Use auth utility
  
  console.log('User data from sessionStorage:', user);
  console.log('Username:', user ? user.username : 'No user found');

  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegistrarSection = location.pathname.startsWith('/registrar');
  const isStampReporterSection = location.pathname.startsWith('/stampreporter');

  const getUserInfo = () => {
    if (!user) {
      return { name: 'Guest', role: 'Guest' };
    }
    
    if (isRegistrarSection) {
      return {
        name: 'Registrar '+user.username,
        role: 'Registrar',
      };
    } else if (isStampReporterSection) {
      return {
        name: 'Stamp Reporter '+user.username,
        role: 'Stamp Reporter',
      };
    } else {
      return {
        name: 'Adv. '+user.username,
        role: 'Lawyer',
      };
    }
  };

  const { name } = getUserInfo();

  const handleLogout = () => {
    clearAuth(); // Use auth utility to clear all auth data
    navigate('/');
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Legal Document Management System
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            {name.charAt(0)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {name}
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundImage: 'linear-gradient(90deg, #1a237e 0%, #534bae 100%)',
  boxShadow: 'none',
}));

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegistrarSection = location.pathname.startsWith('/registrar');
  const isStampReporterSection = location.pathname.startsWith('/stampreporter');

  const getUserInfo = () => {
    if (isRegistrarSection) {
      return {
        name: 'Registrar John Smith',
        role: 'Registrar',
      };
    } else if (isStampReporterSection) {
      return {
        name: 'Stamp Reporter Raj Kumar',
        role: 'Stamp Reporter',
      };
    } else {
      return {
        name: 'Adv. John Doe',
        role: 'Lawyer',
      };
    }
  };

  const { name } = getUserInfo();

  const handleLogout = () => {
    // Will implement logout logic later
    navigate('/login');
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

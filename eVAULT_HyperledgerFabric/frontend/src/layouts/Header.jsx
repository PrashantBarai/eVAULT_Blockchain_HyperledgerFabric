import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundImage: 'linear-gradient(90deg, #1a237e 0%, #534bae 100%)',
  boxShadow: 'none',
}));

const Header = () => {
  const navigate = useNavigate();
  const lawyerName = "Adv. John Doe"; // This will come from auth context later

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
            {lawyerName.charAt(0)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {lawyerName}
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

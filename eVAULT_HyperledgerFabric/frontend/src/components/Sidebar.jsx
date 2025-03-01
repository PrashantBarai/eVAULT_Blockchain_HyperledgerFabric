import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Cases', icon: <GavelIcon />, path: '/cases' },
    { text: 'Submit Case', icon: <AddCircleIcon />, path: '/submit-case' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: '#3f51b5',
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" component="div">
          E-VAULT
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;

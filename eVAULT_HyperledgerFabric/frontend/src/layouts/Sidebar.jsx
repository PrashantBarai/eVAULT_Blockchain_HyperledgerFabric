import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GavelIcon from '@mui/icons-material/Gavel';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLawyerSection = location.pathname.startsWith('/lawyer');
  const isRegistrarSection = location.pathname.startsWith('/registrar');
  const isStampReporterSection = location.pathname.startsWith('/stampreporter');
  const isBenchClerkSection = location.pathname.startsWith('/benchclerk');
  const isJudgeSection = location.pathname.startsWith('/judge');

  const getMenuItems = (role) => {
    switch (role) {
      case 'lawyer':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/lawyer/dashboard' },
          { text: 'Cases', icon: <GavelIcon />, path: '/lawyer/cases' },
          { text: 'Submit Case', icon: <AddCircleIcon />, path: '/lawyer/submit-case' },
          { text: 'Case History', icon: <HistoryIcon />, path: '/lawyer/case-history' },
          { text: 'Profile', icon: <PersonIcon />, path: '/lawyer/profile' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/lawyer/notifications' },
        ];
      case 'registrar':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/registrar/dashboard' },
          { text: 'Cases', icon: <GavelIcon />, path: '/registrar/cases' },
          { text: 'Case History', icon: <HistoryIcon />, path: '/registrar/case-history' },
          { text: 'Profile', icon: <PersonIcon />, path: '/registrar/profile' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/registrar/notifications' },
        ];
      case 'stampreporter':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/stampreporter/dashboard' },
          { text: 'Cases', icon: <GavelIcon />, path: '/stampreporter/cases' },
          { text: 'Case History', icon: <HistoryIcon />, path: '/stampreporter/case-history' },
          { text: 'Profile', icon: <PersonIcon />, path: '/stampreporter/profile' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/stampreporter/notifications' },
        ];
      case 'benchclerk':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/benchclerk/dashboard' },
          { text: 'Case Management', icon: <GavelIcon />, path: '/benchclerk/case-management' },
          { text: 'Judge Decision Confirmation', icon: <VerifiedIcon />, path: '/benchclerk/judge-decision-confirmation' },
          { text: 'Case Status Tracking', icon: <HistoryIcon />, path: '/benchclerk/case-status-tracking' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/benchclerk/notifications' },
          { text: 'Profile', icon: <PersonIcon />, path: '/benchclerk/profile' },
        ];
      case 'judge':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/judge/dashboard' },
          { text: 'Case Review', icon: <GavelIcon />, path: '/judge/case-review' },
          { text: 'Case Status', icon: <AssignmentIcon />, path: '/judge/case-status' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/judge/notifications' },
          { text: 'Profile', icon: <PersonIcon />, path: '/judge/profile' },
        ];
      default:
        return [];
    }
  };

  const getThemeColor = (role) => {
    switch (role) {
      case 'lawyer':
        return '#3f51b5';
      case 'registrar':
        return '#1a237e';
      case 'stampreporter':
        return '#3f51b5';
      case 'benchclerk':
        return '#1a237e';
      case 'judge':
        return '#1a237e';
      default:
        return '#3f51b5';
    }
  };

  const getSectionTitle = (role) => {
    switch (role) {
      case 'lawyer':
        return 'Lawyer Portal';
      case 'registrar':
        return 'Registrar Portal';
      case 'stampreporter':
        return 'Stamp Reporter Portal';
      case 'benchclerk':
        return 'Bench Clerk Portal';
      case 'judge':
        return 'Judge Portal';
      default:
        return 'Lawyer Portal';
    }
  };

  let menuItems = getMenuItems(
    isLawyerSection ? 'lawyer' : 
    isRegistrarSection ? 'registrar' : 
    isStampReporterSection ? 'stampreporter' : 
    isBenchClerkSection ? 'benchclerk' :
    isJudgeSection ? 'judge' : 'lawyer'
  );
  let sectionColor = getThemeColor(
    isLawyerSection ? 'lawyer' : 
    isRegistrarSection ? 'registrar' : 
    isStampReporterSection ? 'stampreporter' : 
    isBenchClerkSection ? 'benchclerk' :
    isJudgeSection ? 'judge' : 'lawyer'
  );
  let sectionTitle = getSectionTitle(
    isLawyerSection ? 'lawyer' : 
    isRegistrarSection ? 'registrar' : 
    isStampReporterSection ? 'stampreporter' : 
    isBenchClerkSection ? 'benchclerk' :
    isJudgeSection ? 'judge' : 'lawyer'
  );

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: sectionColor,
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
        <Typography variant="subtitle2" sx={{ mt: 1, opacity: 0.8 }}>
          {sectionTitle}
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

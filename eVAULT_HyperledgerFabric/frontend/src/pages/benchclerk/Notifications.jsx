import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  // Mock data
  const notifications = [
    {
      id: 1,
      type: 'new_case',
      title: 'New Case Assigned',
      message: 'Property Dispute Resolution case has been assigned to you',
      timestamp: '2 minutes ago',
      read: false,
      caseId: 'CASE-2025-001',
    },
    {
      id: 2,
      type: 'judge_decision',
      title: 'Judge Decision Pending Confirmation',
      message: 'Contract Violation case has received judge\'s decision',
      timestamp: '1 hour ago',
      read: false,
      caseId: 'CASE-2025-002',
    },
    {
      id: 3,
      type: 'new_case',
      title: 'New Case Assigned',
      message: 'Intellectual Property Rights case has been assigned to you',
      timestamp: '3 hours ago',
      read: true,
      caseId: 'CASE-2025-003',
    },
  ];

  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'new_case':
        navigate('/benchclerk/case-management');
        break;
      case 'judge_decision':
        navigate('/benchclerk/judge-decision-confirmation');
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Notifications
        </Typography>
        <Badge 
          badgeContent={notifications.filter(n => !n.read).length} 
          color="error" 
          sx={{ ml: 2 }}
        >
          <NotificationsActiveIcon color="action" />
        </Badge>
      </Box>

      <Paper elevation={3}>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <ListItem
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'rgba(74, 144, 226, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(74, 144, 226, 0.2)',
                  },
                }}
              >
                <ListItemIcon>
                  <Box position="relative">
                    <GavelIcon sx={{ color: '#4a90e2' }} />
                    {!notification.read && (
                      <CircleIcon
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          color: '#e74c3c',
                          fontSize: 12,
                        }}
                      />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" color="textPrimary">
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {notification.timestamp}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;

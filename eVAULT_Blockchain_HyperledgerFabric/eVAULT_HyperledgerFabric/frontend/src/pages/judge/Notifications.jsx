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
  Chip,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  Assignment as AssignmentIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  // Mock data
  const notifications = [
    {
      id: 1,
      type: 'new_case',
      title: 'New Case Assignment',
      message: 'Property Dispute Resolution case has been assigned for your review',
      timestamp: '2 minutes ago',
      read: false,
      caseId: 'CASE-2025-001',
      priority: 'high',
    },
    {
      id: 2,
      type: 'hold_update',
      title: 'On Hold Case Update',
      message: 'Lawyer has provided additional documents for Contract Violation case',
      timestamp: '1 hour ago',
      read: false,
      caseId: 'CASE-2025-002',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'pending_review',
      title: 'Case Pending Review',
      message: 'Intellectual Property Rights case requires your immediate attention',
      timestamp: '3 hours ago',
      read: true,
      caseId: 'CASE-2025-003',
      priority: 'low',
    },
  ];

  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'new_case':
      case 'pending_review':
        navigate('/judge/case-review');
        break;
      case 'hold_update':
        navigate('/judge/case-status');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_case':
        return <AssignmentIcon sx={{ color: '#1a237e' }} />;
      case 'hold_update':
        return <UpdateIcon sx={{ color: '#0d47a1' }} />;
      case 'pending_review':
        return <GavelIcon sx={{ color: '#1565c0' }} />;
      default:
        return <InfoIcon sx={{ color: '#1a237e' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
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

      <Paper 
        elevation={3}
        sx={{
          background: 'linear-gradient(to bottom, rgba(26, 35, 126, 0.05) 0%, rgba(13, 71, 161, 0.05) 100%)',
        }}
      >
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <ListItem
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'rgba(26, 35, 126, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(26, 35, 126, 0.15)',
                  },
                  transition: 'background-color 0.3s',
                }}
              >
                <ListItemIcon>
                  <Box position="relative">
                    {getNotificationIcon(notification.type)}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" color="textPrimary">
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.priority}
                        color={getPriorityColor(notification.priority)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {notification.timestamp} • Case ID: {notification.caseId}
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

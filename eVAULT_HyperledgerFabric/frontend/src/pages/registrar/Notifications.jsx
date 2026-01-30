import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';
import axios from 'axios';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUserData();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const caseNotifications = [];
        
        // First, get the case IDs assigned to this registrar from MongoDB
        if (user?._id) {
          const registrarCasesResponse = await fetch(`http://localhost:3000/registrar-cases/${user._id}`);
          if (registrarCasesResponse.ok) {
            const registrarCasesData = await registrarCasesResponse.json();
            const assignedCaseIds = registrarCasesData.case_ids || [];
            
            // Fetch details for each assigned case from blockchain
            for (const caseId of assignedCaseIds) {
              try {
                const caseResponse = await axios.get(`http://localhost:8000/api/registrar/case/${caseId}`);
                if (caseResponse.data.success && caseResponse.data.data) {
                  const c = caseResponse.data.data;
                  // Only add as notification if status is pending/submitted
                  const status = (c.status || '').toUpperCase();
                  if (status === 'PENDING' || status === 'SUBMITTED' || status === 'FORWARDED' || status === 'PENDING_REGISTRAR_REVIEW' || status === 'CREATED' || status) {
                    caseNotifications.push({
                      id: c.id || caseId,
                      type: 'new_case',
                      title: 'New Case Received',
                      message: `Case "${c.caseSubject || c.title || 'Untitled'}" has been submitted for review`,
                      caseId: caseId,
                      timestamp: c.createdAt || new Date().toISOString(),
                      read: false,
                      priority: 'high',
                    });
                  }
                }
              } catch (err) {
                console.error(`Error fetching case ${caseId}:`, err);
              }
            }
          }
        }

        // Also try to get user-specific notifications from MongoDB
        try {
          const userNotifResponse = await fetch(`http://localhost:3000/notification/${user?._id}`);
          if (userNotifResponse.ok) {
            const userNotifData = await userNotifResponse.json();
            if (userNotifData.notifications) {
              caseNotifications.push(...userNotifData.notifications);
            }
          }
        } catch (err) {
          console.log('No MongoDB notifications found');
        }

        setNotifications(caseNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []); // Empty dependency - only run once on mount

  const handleViewCase = (caseId) => {
    navigate(`/registrar/case-verification/${caseId}`);
  };

  const handleMarkAsRead = (notifId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const handleDelete = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_case':
        return <AssignmentIcon sx={{ color: '#3f51b5' }} />;
      case 'verified':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#ff9800' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NotificationsIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4">Notifications</Typography>
            <Typography variant="subtitle1">
              {notifications.filter(n => !n.read).length} unread notifications
            </Typography>
          </Box>
        </Box>
      </Paper>

      {notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 60, color: '#9e9e9e', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No notifications
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You're all caught up! New case notifications will appear here.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'rgba(63, 81, 181, 0.05)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip label="New" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {notification.caseId && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewCase(notification.caseId)}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                    )}
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(notification.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Notifications;
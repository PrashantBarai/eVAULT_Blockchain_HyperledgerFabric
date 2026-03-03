import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Divider,
  Badge,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  Assignment as AssignmentIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
  InboxOutlined as InboxIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';
import { formatRelativeDate } from '../../utils/dateFormat';

const FABRIC_API = 'http://localhost:8000/api/judge';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUserData();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user?._id) throw new Error('User data not found.');

        const caseNotifications = [];

        // Fetch pending cases from blockchain (these are new assignments)
        try {
          const pendingRes = await fetch(`${FABRIC_API}/cases/pending`);
          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            const pendingCases = pendingData.data || [];
            pendingCases.forEach(c => {
              caseNotifications.push({
                id: c.id,
                type: 'new_case',
                title: 'New Case Assignment',
                message: `Case "${c.title || c.caseSubject || 'Untitled'}" has been forwarded for your review.`,
                timestamp: c.createdAt || c.filedDate || new Date().toISOString(),
                read: false,
                caseId: c.caseNumber || c.id,
                priority: 'high',
                isActionable: true,
              });
            });
          }
        } catch (err) {
          console.error('Error fetching pending cases:', err);
        }

        // Fetch active cases (accepted but not judged)
        try {
          const activeRes = await fetch(`${FABRIC_API}/cases/active`);
          if (activeRes.ok) {
            const activeData = await activeRes.json();
            const activeCases = activeData.data || [];
            activeCases.forEach(c => {
              caseNotifications.push({
                id: c.id,
                type: 'pending_review',
                title: 'Case Pending Judgment',
                message: `Case "${c.title || c.caseSubject || 'Untitled'}" is awaiting your judgment.`,
                timestamp: c.createdAt || c.filedDate || new Date().toISOString(),
                read: true,
                caseId: c.caseNumber || c.id,
                priority: 'medium',
                isActionable: true,
              });
            });
          }
        } catch (err) {
          console.error('Error fetching active cases:', err);
        }

        // Also get user notifications from MongoDB
        try {
          const notifRes = await fetch(`http://localhost:3000/notification/${user._id}`);
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            const userNotifications = notifData.notifications || [];
            userNotifications.forEach(notif => {
              if (!caseNotifications.find(n => n.caseId === notif.case_id)) {
                caseNotifications.push({
                  id: notif.case_id || Math.random().toString(),
                  type: notif.type || 'notification',
                  title: notif.title || 'Notification',
                  message: notif.message || '',
                  timestamp: notif.timestamp || new Date().toISOString(),
                  read: notif.read || false,
                  caseId: notif.case_id,
                  priority: notif.priority || 'low',
                });
              }
            });
          }
        } catch (err) {
          console.log('No MongoDB notifications found');
        }

        setNotifications(caseNotifications);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      if (!user?._id) return;
      await axios.put(`http://localhost:3000/notification/${user._id}/mark-read`);
      setNotifications(prev => prev.map(n => n.isActionable ? n : { ...n, read: true }));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'new_case':
        navigate('/judge/case-review');
        break;
      case 'pending_review':
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        {notifications.some(n => !n.read && !n.isActionable) && (
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            sx={{ color: '#1a237e', borderColor: '#1a237e' }}
          >
            Mark Informational as Read
          </Button>
        )}
      </Box>

      {notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InboxIcon sx={{ fontSize: 60, color: '#9e9e9e', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No notifications
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You're all caught up! New case notifications will appear here.
          </Typography>
        </Paper>
      ) : (
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
                            color: notification.isActionable ? '#e74c3c' : '#1a237e',
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
                          {formatRelativeDate(notification.timestamp)} • Case ID: {notification.caseId}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Notifications;

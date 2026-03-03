import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Alert,
  Button,
  Badge,
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  DoneAll as DoneAllIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUserData, getAuthToken } from '../../utils/auth';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('You must be logged in to view cases.');
          setLoading(false);
          return;
        }

        const user = getUserData();
        if (!user) {
          setError('User data not found.');
          setLoading(false);
          return;
        }

        const userIdToUse = user._id;
        if (!userIdToUse) {
          setError('User ID is missing.');
          setLoading(false);
          return;
        }


        const response = await fetch(`http://localhost:3000/notification/${userIdToUse}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();
        setNotifications(data.notifications);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = (notification) => {
    navigate('/benchclerk/case-management');
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = getUserData();
      if (!user?._id) return;
      await axios.put(`http://localhost:3000/notification/${user._id}/mark-read`);
      setNotifications(prev => prev.map(n => n.isActionable ? n : { ...n, read: true }));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4">Notifications</Typography>
          <Badge
            badgeContent={unreadCount}
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
            sx={{ color: '#4a90e2', borderColor: '#4a90e2' }}
          >
            Mark Informational as Read
          </Button>
        )}
      </Box>

      <Paper elevation={3}>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'rgba(74, 144, 226, 0.1)',
                  '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.2)' },
                }}
              >
                <ListItemIcon>
                  <Box position="relative">
                    <GavelIcon sx={{ color: '#4a90e2' }} />
                    {!notification.read && (
                      <CircleIcon
                        sx={{ position: 'absolute', top: -4, right: -4, color: notification.isActionable ? '#e74c3c' : '#4a90e2', fontSize: 12 }}
                      />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="subtitle1">{notification.case_id}</Typography>}
                  secondary={
                    <Box>
                      <Typography variant="body2">{notification.message}</Typography>
                      <Typography variant="caption">{notification.timestamp}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box >
  );
};

export default Notifications;

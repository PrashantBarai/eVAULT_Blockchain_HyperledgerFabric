import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';
import { getUserData } from '../../utils/auth';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch notifications from the backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = getUserData();
        if (!user) throw new Error('You must be logged in to view notifications.');

        const lawyer_id = user._id;
        console.log('User data:', user)
        if (!lawyer_id) throw new Error('Lawyer ID not found.');

        console.log('Making request to:', `http://localhost:3000/notification/${lawyer_id}`);

        const response = await axios.get(`http://localhost:3000/notification/${lawyer_id}`, {
          headers: {
            // Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Full API response:', response);
        console.log('Response data:', response.data);

        if (response.data && response.data.notifications) {
          console.log('Notifications received:', response.data.notifications);
          setNotifications(response.data.notifications);
        } else {
          console.warn('Unexpected response structure:', response.data);
          throw new Error('No notifications found.');
        }
      } catch (err) {
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          stack: err.stack
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.timestamp && notification.timestamp.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMarkAllAsRead = async () => {
    try {
      const user = getUserData();
      await axios.put(`http://localhost:3000/notification/${user._id}/mark-read`);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h4" component="h1">
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} New`}
                color="error"
                size="small"
                sx={{ ml: 2, verticalAlign: 'middle' }}
              />
            )}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            sx={{ color: '#6B5ECD', borderColor: '#6B5ECD' }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search notifications..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: '#6B5ECD', mr: 1 }} />,
        }}
        sx={{ mb: 3 }}
      />
      {/* Notifications List */}
      {
        filteredNotifications.map((notification) => (
          <Card
            key={notification.case_id}
            sx={{
              width: '100%',
              mb: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              bgcolor: notification.read ? 'transparent' : 'rgba(107, 94, 205, 0.05)',
              borderLeft: notification.read ? 'none' : '4px solid #6B5ECD',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h6">{notification.message}</Typography>
                  <Chip
                    label={notification.read ? "Notification" : "New"}
                    size="small"
                    sx={{
                      bgcolor: notification.read ? '#e0e0e0' : '#6B5ECD',
                      color: notification.read ? '#666' : 'white',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {notification.timestamp}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      }
    </Box >
  );
};

export default Notifications;
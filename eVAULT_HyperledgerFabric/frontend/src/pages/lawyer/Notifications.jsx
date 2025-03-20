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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch notifications from the backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in to view notifications.');
        console.log('Token:', token); // Debug log
        const user_data = localStorage.getItem('user_data');
        const lawyer_id = JSON.parse(user_data).user_id;
        if (!lawyer_id) throw new Error('Lawyer ID not found.');

        console.log('Fetching notifications for lawyer:', lawyer_id); // Debug log

        const response = await axios.get(`http://localhost:8000/lawyer/notifs/${lawyer_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('API Response:', response.data); // Debug log

        if (response.data && response.data.notifications) {
          setNotifications(response.data.notifications);
        } else {
          throw new Error('No notifications found.');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err); // Debug log
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Filter notifications based on the search term
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.timestamp.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NotificationsIcon sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
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
      {filteredNotifications.map((notification) => (
        <Card
          key={notification.case_id}
          sx={{
            width: '100%',
            mb: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h6">{notification.message}</Typography>
                <Chip
                  label="Notification"
                  sx={{
                    bgcolor: '#6B5ECD',
                    color: 'white',
                  }}
                />
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {notification.timestamp}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Notifications;
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
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view cases.');
          setLoading(false);
          return;
        }

        const userString = localStorage.getItem('user_data');
        if (!userString) {
          setError('User data not found.');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userString);
        const userIdToUse = user.user_id;
        if (!userIdToUse) {
          setError('User ID is missing.');
          setLoading(false);
          return;
        }


        const response = await fetch(`http://localhost:8000/benchclerk/notifs/${userIdToUse}`, {
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

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Notifications</Typography>
        <Badge 
          badgeContent={notifications.length} 
          color="error" 
          sx={{ ml: 2 }}
        >
          <NotificationsActiveIcon color="action" />
        </Badge>
      </Box>

      <Paper elevation={3}>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: 'rgba(74, 144, 226, 0.1)',
                  '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.2)' },
                }}
              >
                <ListItemIcon>
                  <Box position="relative">
                    <GavelIcon sx={{ color: '#4a90e2' }} />
                    <CircleIcon
                      sx={{ position: 'absolute', top: -4, right: -4, color: '#e74c3c', fontSize: 12 }}
                    />
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
    </Box>
  );
};

export default Notifications;

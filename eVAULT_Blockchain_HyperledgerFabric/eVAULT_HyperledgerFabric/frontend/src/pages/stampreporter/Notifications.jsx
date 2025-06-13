import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in to view notifications.');

        const userString = localStorage.getItem('user_data');
        if (!userString) throw new Error('User data not found.');

        const user = JSON.parse(userString);
        const userId = user.user_id;

        const response = await axios.get(`http://localhost:8000/get-cases/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status !== 200) throw new Error('Failed to fetch notifications.');

        setNotifications(response.data.cases ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>Notifications</Typography>
        <Typography variant="subtitle1">
          You have {notifications.filter(n => n.status === 'New').length} new notifications
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <List>
          {loading ? (
            <Typography variant="body2" color="textSecondary">Loading...</Typography>
          ) : error ? (
            <Typography variant="body2" color="error">{error}</Typography>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{ 
                    py: 2,
                    bgcolor: notification.status === 'New' ? 'rgba(63, 81, 181, 0.05)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(63, 81, 181, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <GavelIcon sx={{ color: '#3f51b5' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {notification.case_subject}
                        </Typography>
                        {notification.status === 'New' && (
                          <Chip 
                            label="New" 
                            size="small" 
                            sx={{ 
                              bgcolor: '#3f51b5',
                              color: 'white',
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Case ID: {notification._id}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Lawyer: {notification.associated_lawyers}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            mt: 1,
                            color: 'text.secondary'
                          }}
                        >
                          Filed Date: {notification.filed_date}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton 
                    color="primary"
                    onClick={() => navigate(`/stampreporter/case-verification/${notification._id}`)}
                    sx={{ color: '#3f51b5' }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;
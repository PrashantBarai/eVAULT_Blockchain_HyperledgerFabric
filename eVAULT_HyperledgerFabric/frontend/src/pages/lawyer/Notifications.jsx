import React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const Notifications = () => {
  const [timeFilter, setTimeFilter] = useState('TODAY');

  const notifications = [
    {
      id: 1,
      title: 'Case Update: Criminal Case #123',
      description: 'New evidence has been submitted for review',
      time: '2 hours ago',
      type: 'update'
    },
    {
      id: 2,
      title: 'Hearing Scheduled',
      description: 'Next hearing for Civil Case #456 scheduled for March 15th',
      time: '1 day ago',
      type: 'schedule'
    }
  ];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3
      }}>
        <NotificationsIcon sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        width: '100%'
      }}>
        <Button 
          variant={timeFilter === 'TODAY' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('TODAY')}
          sx={{ 
            bgcolor: timeFilter === 'TODAY' ? '#6B5ECD' : 'transparent',
            color: timeFilter === 'TODAY' ? 'white' : '#6B5ECD',
            '&:hover': { bgcolor: timeFilter === 'TODAY' ? '#5B4EBD' : 'rgba(107, 94, 205, 0.04)' }
          }}
        >
          TODAY
        </Button>
        <Button 
          variant={timeFilter === 'THIS WEEK' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('THIS WEEK')}
          sx={{ 
            bgcolor: timeFilter === 'THIS WEEK' ? '#6B5ECD' : 'transparent',
            color: timeFilter === 'THIS WEEK' ? 'white' : '#6B5ECD',
            '&:hover': { bgcolor: timeFilter === 'THIS WEEK' ? '#5B4EBD' : 'rgba(107, 94, 205, 0.04)' }
          }}
        >
          THIS WEEK
        </Button>
        <Button 
          variant={timeFilter === 'THIS MONTH' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('THIS MONTH')}
          sx={{ 
            bgcolor: timeFilter === 'THIS MONTH' ? '#6B5ECD' : 'transparent',
            color: timeFilter === 'THIS MONTH' ? 'white' : '#6B5ECD',
            '&:hover': { bgcolor: timeFilter === 'THIS MONTH' ? '#5B4EBD' : 'rgba(107, 94, 205, 0.04)' }
          }}
        >
          THIS MONTH
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<CalendarTodayIcon />}
          sx={{ 
            ml: 'auto',
            color: '#6B5ECD', 
            borderColor: '#6B5ECD'
          }}
        >
          Custom Date
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search notifications..."
        variant="outlined"
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: '#6B5ECD', mr: 1 }} />,
        }}
        sx={{ mb: 3 }}
      />

      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          sx={{ 
            width: '100%',
            mb: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <CardContent sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h6">{notification.title}</Typography>
                <Chip 
                  label={notification.type} 
                  sx={{ 
                    bgcolor: notification.type === 'update' ? '#6B5ECD' : '#4CAF50',
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography color="textSecondary">{notification.description}</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {notification.time}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Notifications;

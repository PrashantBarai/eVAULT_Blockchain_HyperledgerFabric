import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      caseId: 'CASE123',
      title: 'New Case Assignment',
      summary: 'Property Dispute in Mumbai Suburb',
      date: '2025-03-01 10:30 AM',
      status: 'New'
    },
    {
      id: 2,
      caseId: 'CASE124',
      title: 'New Case Assignment',
      summary: 'Corporate Fraud Investigation',
      date: '2025-03-01 09:15 AM',
      status: 'New'
    },
    {
      id: 3,
      caseId: 'CASE125',
      title: 'New Case Assignment',
      summary: 'Environmental Protection Case',
      date: '2025-02-28 04:45 PM',
      status: 'New'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Notifications</Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        width: '100%'
      }}>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: '#3f51b5',
            '&:hover': { bgcolor: '#303f9f' }
          }}
        >
          Today
        </Button>
        <Button 
          variant="outlined" 
          sx={{ color: '#3f51b5', borderColor: '#3f51b5' }}
        >
          This Week
        </Button>
        <Button 
          variant="outlined" 
          sx={{ color: '#3f51b5', borderColor: '#3f51b5' }}
        >
          This Month
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<CalendarTodayIcon />}
          sx={{ 
            ml: 'auto',
            color: '#3f51b5', 
            borderColor: '#3f51b5'
          }}
        >
          Custom Date
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search notifications"
        variant="outlined"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: '#3f51b5', mr: 1 }} />,
        }}
      />

      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          sx={{ 
            mb: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateX(5px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }
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
                  label={notification.status} 
                  sx={{ 
                    bgcolor: '#3f51b5',
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography color="textSecondary">Case ID: {notification.caseId}</Typography>
              <Typography color="textSecondary">{notification.summary}</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {notification.date}
              </Typography>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`/registrar/case-assignment`)}
              sx={{ 
                bgcolor: '#3f51b5',
                '&:hover': { bgcolor: '#303f9f' }
              }}
            >
              Take Action
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Notifications;

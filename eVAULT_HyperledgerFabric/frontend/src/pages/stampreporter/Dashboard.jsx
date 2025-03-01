import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import {
  Description,
  Gavel,
  NotificationsActive,
  Person,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
  <Card 
    sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)'
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ textAlign: 'center', mt: 2 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Cases',
      value: 35,
      icon: <Gavel sx={{ fontSize: 30 }} />,
      color: '#3f51b5'
    },
    {
      title: 'Cases Verified',
      value: 18,
      icon: <CheckCircle sx={{ fontSize: 30 }} />,
      color: '#4caf50'
    },
    {
      title: 'Cases Rejected',
      value: 7,
      icon: <Cancel sx={{ fontSize: 30 }} />,
      color: '#f44336'
    },
    {
      title: 'Pending Cases',
      value: 10,
      icon: <Description sx={{ fontSize: 30 }} />,
      color: '#ff9800'
    },
    {
      title: 'New Notifications',
      value: 5,
      icon: <NotificationsActive sx={{ fontSize: 30 }} />,
      color: '#2196f3'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ 
              width: 80, 
              height: 80,
              bgcolor: 'white',
              color: '#3f51b5'
            }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4">Welcome, Stamp Reporter Raj Kumar</Typography>
            <Typography variant="subtitle1">
              Senior Stamp Reporter | Mumbai High Court
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Person />}
            sx={{ 
              ml: 'auto',
              bgcolor: '#3f51b5',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(63, 81, 181, 0.9)'
              }
            }}
            onClick={() => navigate('/stampreporter/profile')}
          >
            View Profile
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={index < 3 ? 4 : 6} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Cases</Typography>
              {/* Add recent cases list here */}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Activities</Typography>
              {/* Add recent activities list here */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Paper,
  CircularProgress,
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
import { getUserData } from '../../utils/auth';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    rejected: 0,
    pending: 0,
    notifications: 0
  });
  const user = getUserData();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?._id) return;

        let pendingCount = 0;
        let verifiedCount = 0;
        let rejectedCount = 0;
        let notificationCount = 0;

        // Fetch case IDs assigned to this stamp reporter from MongoDB
        const casesResponse = await axios.get(`http://localhost:3000/stampreporter-cases/${user._id}`);
        const assignedCaseIds = casesResponse.data.case_ids || [];

        // Fetch details for each case from blockchain
        let validCaseCount = 0;
        for (const caseId of assignedCaseIds) {
          try {
            const caseResponse = await axios.get(`http://localhost:8000/api/stampreporter/case/${caseId}`);
            if (caseResponse.data.success && caseResponse.data.data) {
              validCaseCount++;
              const status = (caseResponse.data.data.status || '').toUpperCase();
              if (status.includes('VERIFIED') || status.includes('APPROVED') || status.includes('FORWARDED_TO')) {
                verifiedCount++;
              } else if (status.includes('REJECTED')) {
                rejectedCount++;
              } else {
                pendingCount++;
              }
            }
            // If blockchain returns no data, skip this case (stale MongoDB reference)
          } catch (err) {
            // Skip cases that don't exist in blockchain - don't count stale MongoDB references
            console.log(`Case ${caseId} not found in blockchain, skipping`);
          }
        }

        // Get notifications count
        if (user?._id) {
          try {
            const notifResponse = await axios.get(`http://localhost:3000/notification/${user._id}`);
            const notifications = notifResponse.data.notifications || [];
            notificationCount = notifications.filter(n => !n.read).length;
          } catch (err) {
            console.log('No notifications found');
          }
        }

        setStats({
          total: validCaseCount,  // Only count cases that exist in blockchain
          verified: verifiedCount,
          rejected: rejectedCount,
          pending: pendingCount,
          notifications: notificationCount
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.total,
      icon: <Gavel sx={{ fontSize: 30 }} />,
      color: '#3f51b5'
    },
    {
      title: 'Cases Verified',
      value: stats.verified,
      icon: <CheckCircle sx={{ fontSize: 30 }} />,
      color: '#4caf50'
    },
    {
      title: 'Cases Rejected',
      value: stats.rejected,
      icon: <Cancel sx={{ fontSize: 30 }} />,
      color: '#f44336'
    },
    {
      title: 'Pending Cases',
      value: stats.pending,
      icon: <Description sx={{ fontSize: 30 }} />,
      color: '#ff9800'
    },
    {
      title: 'New Notifications',
      value: stats.notifications,
      icon: <NotificationsActive sx={{ fontSize: 30 }} />,
      color: '#2196f3'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
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
            <Typography variant="h4">Welcome, {user?.username || 'Stamp Reporter'}</Typography>
            <Typography variant="subtitle1">
              {user?.designation || 'Stamp Reporter'} | {user?.reportingArea || 'Court'}
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
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={index < 3 ? 4 : 6} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="textSecondary">
                  You have <strong>{stats.pending}</strong> pending cases that require verification.
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                  Total cases processed: <strong>{stats.verified + stats.rejected}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

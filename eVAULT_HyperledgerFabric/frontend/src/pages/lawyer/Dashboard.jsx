import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const StatCard = ({ title, value, icon, color }) => (
  <StyledCard>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </StyledCard>
);

const Dashboard = () => {
  const userString = localStorage.getItem('user_data'); // Get the user data as a string
  const userCaseDataString = localStorage.getItem('udata'); 
  let user = null;
  let userCaseData = null;
  try {
    userCaseData = JSON.parse(userCaseDataString);
    user = JSON.parse(userString); // Parse the string into an object
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }

  console.log('User data from localStorage:', user);
  console.log('Username:', user ? user.username : 'No user found');
  
  const stats = {
    pending: userCaseData.pending_cases,
    verified: userCaseData.verified_cases,
    rejected: userCaseData.rejected_cases,
  };

  const chartData = [
    { month: 'Jan', cases: 4 },
    { month: 'Feb', cases: 7 },
    { month: 'Mar', cases: 5 },
    { month: 'Apr', cases: 8 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, Adv. {user.username}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Pending Cases"
            value={stats.pending}
            icon={<PendingActionsIcon sx={{ color: '#f57c00' }} />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Verified Cases"
            value={stats.verified}
            icon={<VerifiedIcon sx={{ color: '#43a047' }} />}
            color="#43a047"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Rejected Cases"
            value={stats.rejected}
            icon={<CancelIcon sx={{ color: '#e53935' }} />}
            color="#e53935"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)' }}>
            <Typography variant="h6" gutterBottom>
              Case Submission Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#1a237e" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

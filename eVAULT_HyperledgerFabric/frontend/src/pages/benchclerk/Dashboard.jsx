import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Send as SendIcon,
  Pending as PendingIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(45deg, ${color} 30%, ${color}dd 90%)`,
      color: 'white',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h3" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // Mock data
  const clerkInfo = {
    name: 'John Smith',
    position: 'Senior Bench Clerk',
    department: 'Civil Court Division',
    joinDate: 'January 2020',
  };

  const stats = {
    totalCases: 156,
    forwardedToJudge: 89,
    pendingConfirmations: 12,
    newNotifications: 5,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Profile Summary */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome, {clerkInfo.name}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              Position: {clerkInfo.position}
            </Typography>
            <Typography variant="subtitle1">
              Department: {clerkInfo.department}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              Member since: {clerkInfo.joinDate}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            icon={<GavelIcon />}
            color="#4a90e2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Forwarded to Judge"
            value={stats.forwardedToJudge}
            icon={<SendIcon />}
            color="#8e44ad"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Confirmations"
            value={stats.pendingConfirmations}
            icon={<PendingIcon />}
            color="#e67e22"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Notifications"
            value={stats.newNotifications}
            icon={<NotificationsIcon />}
            color="#27ae60"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

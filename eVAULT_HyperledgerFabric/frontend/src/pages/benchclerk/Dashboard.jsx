import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, CircularProgress,
} from '@mui/material';
import {
  Gavel as GavelIcon, Send as SendIcon, Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getUserData } from '../../utils/auth';
import PropTypes from 'prop-types';

const FABRIC_API = 'http://localhost:8000/api/benchclerk';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', background: `linear-gradient(45deg, ${color} 30%, ${color}dd 90%)`, color: 'white' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>{icon}</Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h3" component="div">{value}</Typography>
    </CardContent>
  </Card>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element,
  color: PropTypes.string.isRequired,
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUserData();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${FABRIC_API}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = stats || { totalCases: 0, pendingCases: 0, forwardedCases: 0, completedCases: 0 };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)', color: 'white', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>Welcome, {user?.username || 'Bench Clerk'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Role: Bench Clerk</Typography>
            <Typography variant="subtitle1">Organization: BenchClerksOrg</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Channel: stampreporter-benchclerk-channel</Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Cases" value={displayStats.totalCases || 0} icon={<GavelIcon />} color="#4a90e2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Review" value={displayStats.pendingCases || 0} icon={<PendingIcon />} color="#e67e22" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Forwarded to Judge" value={displayStats.forwardedCases || 0} icon={<SendIcon />} color="#8e44ad" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Completed" value={displayStats.completedCases || 0} icon={<CheckCircleIcon />} color="#27ae60" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
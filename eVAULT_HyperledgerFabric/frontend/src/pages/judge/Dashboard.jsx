import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent, Avatar, Button,
  CircularProgress,
} from '@mui/material';
import {
  Gavel as GavelIcon, PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon, Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon, VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';

const FABRIC_API = 'http://localhost:8000/api/judge';

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

const QuickActionCard = ({ title, description, icon, onClick }) => (
  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: '#1a237e', mr: 2 }}>{icon}</Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Button endIcon={<ArrowForwardIcon />}
        sx={{
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)', color: 'white',
          '&:hover': { background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)' }
        }}>
        Take Action
      </Button>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUserData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${FABRIC_API}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch judge stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = stats || { totalCases: 0, pendingCases: 0, activeCases: 0, judgedCases: 0 };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}>
            <GavelIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>Welcome, {user?.username || 'Judge'}</Typography>
            <Typography variant="subtitle1">Role: Judge &bull; Organization: JudgesOrg</Typography>
            <Typography variant="subtitle1">Channel: benchclerk-judge-channel</Typography>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ mb: 4 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="New Cases" value={displayStats.pendingCases || 0}
              icon={<AssignmentIcon />} color="#1a237e" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Cases" value={displayStats.activeCases || 0}
              icon={<PendingIcon />} color="#0d47a1" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Judged Cases" value={displayStats.judgedCases || 0}
              icon={<CheckCircleIcon />} color="#1565c0" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Cases" value={displayStats.totalCases || 0}
              icon={<GavelIcon />} color="#283593" />
          </Grid>
        </Grid>
      )}

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>Quick Actions</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <QuickActionCard title="Review New Cases"
            description="Accept and review pending cases forwarded by the Bench Clerk."
            icon={<AssignmentIcon />} onClick={() => navigate('/judge/case-review')} />
        </Grid>
        <Grid item xs={12} md={4}>
          <QuickActionCard title="Case Status & Judgments"
            description="View active cases, record judgments, and track decided cases."
            icon={<PendingIcon />} onClick={() => navigate('/judge/case-status')} />
        </Grid>
        <Grid item xs={12} md={4}>
          <QuickActionCard title="View Judged Cases"
            description="Browse all judged cases with full evidence, documents, and judgment details."
            icon={<VerifiedUserIcon />} onClick={() => navigate('/judge/judged-cases')} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

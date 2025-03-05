import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

const QuickActionCard = ({ title, description, icon, onClick }) => (
  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: '#1a237e', mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Button
        endIcon={<ArrowForwardIcon />}
        sx={{
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)',
          }
        }}
      >
        Take Action
      </Button>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock data
  const judgeInfo = {
    name: 'Hon. Justice Sarah Williams',
    position: 'Senior Judge',
    department: 'Civil Division',
    experience: '15 years',
  };

  const stats = {
    newCases: 8,
    pendingDecisions: 12,
    finalizedCases: 156,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Profile Summary */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              mr: 2 
            }}
          >
            <GavelIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome, {judgeInfo.name}
            </Typography>
            <Typography variant="subtitle1">
              {judgeInfo.position} • {judgeInfo.department}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="New Cases"
            value={stats.newCases}
            icon={<AssignmentIcon />}
            color="#1a237e"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Pending Decisions"
            value={stats.pendingDecisions}
            icon={<PendingIcon />}
            color="#0d47a1"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Finalized Cases"
            value={stats.finalizedCases}
            icon={<CheckCircleIcon />}
            color="#1565c0"
          />
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <QuickActionCard
            title="Review New Case"
            description="Review and make decisions on newly assigned cases from the Bench Clerk."
            icon={<AssignmentIcon />}
            onClick={() => navigate('/judge/case-review')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <QuickActionCard
            title="Check Pending Cases"
            description="View and update status of cases awaiting your decision."
            icon={<PendingIcon />}
            onClick={() => navigate('/judge/case-status')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

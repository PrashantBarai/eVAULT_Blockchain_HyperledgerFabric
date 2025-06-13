import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CaseHistory = () => {
  const stats = {
    totalApproved: 89,
    totalRejected: 12,
    monthlyData: [
      { month: 'Jan', approved: 12, rejected: 2 },
      { month: 'Feb', approved: 15, rejected: 3 },
      { month: 'Mar', approved: 18, rejected: 1 },
      { month: 'Apr', approved: 10, rejected: 2 },
      { month: 'May', approved: 14, rejected: 1 },
      { month: 'Jun', approved: 20, rejected: 3 },
    ],
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ textAlign: 'center', mt: 2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4">Case History</Typography>
        <Typography variant="subtitle1">
          Statistical overview of case verifications
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Approved"
            value={stats.totalApproved}
            icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Rejected"
            value={stats.totalRejected}
            icon={<CancelIcon sx={{ fontSize: 30 }} />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Success Rate"
            value={`${Math.round((stats.totalApproved / (stats.totalApproved + stats.totalRejected)) * 100)}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 30 }} />}
            color="#3f51b5"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Monthly Statistics</Typography>
        <Box sx={{ height: 400, mt: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" name="Approved Cases" fill="#4caf50" />
              <Bar dataKey="rejected" name="Rejected Cases" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default CaseHistory;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GavelIcon from '@mui/icons-material/Gavel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { getUserData } from '../../utils/auth';

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
  const user = getUserData();

  const [stats, setStats] = useState({
    totalCases: 0,
    createdCases: 0,
    pendingCases: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (allCases.length > 0) {
      updateChartData(allCases, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  const updateChartData = (cases, year, month) => {
    let filteredCases = cases.filter(caseItem => {
      const date = new Date(caseItem.createdAt || caseItem.filedDate);
      const caseYear = date.getFullYear();
      const caseMonth = date.getMonth() + 1;
      
      if (year && caseYear !== parseInt(year)) return false;
      if (month !== 'all' && caseMonth !== parseInt(month)) return false;
      return true;
    });

    // Group by month
    const monthCounts = {};
    filteredCases.forEach(caseItem => {
      const date = new Date(caseItem.createdAt || caseItem.filedDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });

    const chartArray = Object.entries(monthCounts)
      .map(([month, cases]) => ({ month, cases }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
    
    setChartData(chartArray);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get user's case IDs from MongoDB
      let userCaseIds = [];
      try {
        const mongoResponse = await axios.get(`http://localhost:3000/user-cases/${user?.email}`);
        userCaseIds = mongoResponse.data.case_ids || [];
        console.log('User case IDs from MongoDB:', userCaseIds);
      } catch (mongoError) {
        console.warn('Could not fetch case references from MongoDB:', mongoError);
      }
      
      // Step 2: Fetch all cases from blockchain
      const casesResponse = await axios.get('http://localhost:8000/api/lawyer/cases/all');
      let cases = casesResponse.data.data || [];
      
      // Step 3: Filter to only user's cases
      if (userCaseIds.length > 0) {
        cases = cases.filter(c => userCaseIds.includes(c.id));
        console.log('Filtered to user cases:', cases);
      } else {
        // Fallback: filter by createdBy field
        const username = user?.username || user?.name;
        cases = cases.filter(c => 
          c.createdBy === username || c.createdBy === user?.email
        );
        console.log('Filtered by createdBy:', cases);
      }
      
      setAllCases(cases);
      
      // Calculate statistics
      const totalCases = cases.length;
      const createdCases = cases.filter(c => c.status === 'CREATED').length;
      const pendingCases = cases.filter(c => c.status === 'PENDING' || c.status === 'CREATED').length;
      
      setStats({
        totalCases,
        createdCases,
        pendingCases,
      });

      // Generate initial chart data
      updateChartData(cases, selectedYear, selectedMonth);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, Adv. {user ? user.username : 'User'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            icon={<AssignmentIcon sx={{ color: '#1976d2' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Created Cases"
            value={stats.createdCases}
            icon={<PendingActionsIcon sx={{ color: '#f57c00' }} />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Pending Cases"
            value={stats.pendingCases}
            icon={<GavelIcon sx={{ color: '#43a047' }} />}
            color="#43a047"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Case Creation Trends
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <MenuItem value={2024}>2024</MenuItem>
                    <MenuItem value={2025}>2025</MenuItem>
                    <MenuItem value={2026}>2026</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Month"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <MenuItem value="all">All Months</MenuItem>
                    <MenuItem value="1">January</MenuItem>
                    <MenuItem value="2">February</MenuItem>
                    <MenuItem value="3">March</MenuItem>
                    <MenuItem value="4">April</MenuItem>
                    <MenuItem value="5">May</MenuItem>
                    <MenuItem value="6">June</MenuItem>
                    <MenuItem value="7">July</MenuItem>
                    <MenuItem value="8">August</MenuItem>
                    <MenuItem value="9">September</MenuItem>
                    <MenuItem value="10">October</MenuItem>
                    <MenuItem value="11">November</MenuItem>
                    <MenuItem value="12">December</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {chartData.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cases" fill="#1a237e" name="Cases Created" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No cases found for the selected period
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
  
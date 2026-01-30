import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
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
import axios from 'axios';
import { getUserData } from '../../utils/auth';

const CaseHistory = () => {
  const [allCases, setAllCases] = useState([]);
  const [stats, setStats] = useState({
    totalVerified: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('last6months'); // 'last6months', 'last6years', 'specificYear'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const user = getUserData();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  // Generate available years (last 10 years)
  const availableYears = useMemo(() => {
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, [currentYear]);

  useEffect(() => {
    const fetchCaseStats = async () => {
      try {
        let pendingCases = [];
        let verifiedCases = [];
        
        if (user?._id) {
          const registrarCasesResponse = await axios.get(`http://localhost:3000/registrar-cases/${user._id}`);
          const assignedCaseIds = registrarCasesResponse.data.case_ids || [];
          
          for (const caseId of assignedCaseIds) {
            try {
              const caseResponse = await axios.get(`http://localhost:8000/api/registrar/case/${caseId}`);
              if (caseResponse.data.success && caseResponse.data.data) {
                const caseData = caseResponse.data.data;
                const status = (caseData.status || '').toUpperCase();
                if (status === 'VERIFIED' || status === 'APPROVED' || status === 'ASSIGNED' || status === 'VERIFIED_BY_REGISTRAR' || status === 'PENDING_STAMP_REPORTER_REVIEW') {
                  verifiedCases.push(caseData);
                } else {
                  pendingCases.push(caseData);
                }
              }
            } catch (err) {
              pendingCases.push({ id: caseId, createdAt: new Date().toISOString() });
            }
          }
          
          if (assignedCaseIds.length > 0 && pendingCases.length === 0 && verifiedCases.length === 0) {
            assignedCaseIds.forEach(id => pendingCases.push({ id, createdAt: new Date().toISOString() }));
          }
        }
        
        setAllCases([...pendingCases, ...verifiedCases]);
        setStats({
          totalVerified: verifiedCases.length,
          totalPending: pendingCases.length,
        });
      } catch (error) {
        console.error('Error fetching case stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseStats();
  }, []);

  // Generate chart data based on view mode
  const chartData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    if (viewMode === 'last6months') {
      // Last 6 months view
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthIndex = targetDate.getMonth();
        const year = targetDate.getFullYear();
        data.push({
          label: `${months[monthIndex]}'${String(year).slice(-2)}`,
          fullLabel: `${months[monthIndex]} ${year}`,
          monthIndex,
          year,
          verified: 0,
          pending: 0
        });
      }
      
      allCases.forEach(c => {
        const date = new Date(c.createdAt || c.filedDate || Date.now());
        const caseMonth = date.getMonth();
        const caseYear = date.getFullYear();
        const status = (c.status || '').toUpperCase();
        
        const matchingEntry = data.find(d => d.monthIndex === caseMonth && d.year === caseYear);
        if (matchingEntry) {
          if (status === 'VERIFIED' || status === 'APPROVED' || status === 'ASSIGNED' || status === 'VERIFIED_BY_REGISTRAR' || status === 'PENDING_STAMP_REPORTER_REVIEW') {
            matchingEntry.verified++;
          } else {
            matchingEntry.pending++;
          }
        }
      });
      
      return data;
      
    } else if (viewMode === 'last6years') {
      // Last 6 years view
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const year = currentYear - i;
        data.push({
          label: String(year),
          fullLabel: String(year),
          year,
          verified: 0,
          pending: 0
        });
      }
      
      allCases.forEach(c => {
        const date = new Date(c.createdAt || c.filedDate || Date.now());
        const caseYear = date.getFullYear();
        const status = (c.status || '').toUpperCase();
        
        const matchingEntry = data.find(d => d.year === caseYear);
        if (matchingEntry) {
          if (status === 'VERIFIED' || status === 'APPROVED' || status === 'ASSIGNED' || status === 'VERIFIED_BY_REGISTRAR' || status === 'PENDING_STAMP_REPORTER_REVIEW') {
            matchingEntry.verified++;
          } else {
            matchingEntry.pending++;
          }
        }
      });
      
      return data;
      
    } else {
      // Specific year - all 12 months
      const data = months.map((month, index) => ({
        label: month,
        fullLabel: `${month} ${selectedYear}`,
        monthIndex: index,
        year: selectedYear,
        verified: 0,
        pending: 0
      }));
      
      allCases.forEach(c => {
        const date = new Date(c.createdAt || c.filedDate || Date.now());
        const caseMonth = date.getMonth();
        const caseYear = date.getFullYear();
        const status = (c.status || '').toUpperCase();
        
        if (caseYear === selectedYear) {
          if (status === 'VERIFIED' || status === 'APPROVED' || status === 'ASSIGNED' || status === 'VERIFIED_BY_REGISTRAR' || status === 'PENDING_STAMP_REPORTER_REVIEW') {
            data[caseMonth].verified++;
          } else {
            data[caseMonth].pending++;
          }
        }
      });
      
      return data;
    }
  }, [allCases, viewMode, selectedYear, currentYear]);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getChartTitle = () => {
    switch (viewMode) {
      case 'last6months':
        return 'Monthly Statistics (Last 6 Months)';
      case 'last6years':
        return 'Yearly Statistics (Last 6 Years)';
      case 'specificYear':
        return `Monthly Statistics for ${selectedYear}`;
      default:
        return 'Statistics';
    }
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
            title="Cases Verified"
            value={stats.totalVerified}
            icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Cases Pending"
            value={stats.totalPending}
            icon={<PendingIcon sx={{ fontSize: 30 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Processed"
            value={stats.totalVerified + stats.totalPending}
            icon={<TrendingUpIcon sx={{ fontSize: 30 }} />}
            color="#3f51b5"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        {/* Filter Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6">{getChartTitle()}</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{ 
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  px: 2,
                }
              }}
            >
              <ToggleButton value="last6months">
                <CalendarMonthIcon sx={{ mr: 1, fontSize: 18 }} />
                Last 6 Months
              </ToggleButton>
              <ToggleButton value="last6years">
                <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
                Last 6 Years
              </ToggleButton>
              <ToggleButton value="specificYear">
                <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
                By Year
              </ToggleButton>
            </ToggleButtonGroup>
            
            {viewMode === 'specificYear' && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>

        <Box sx={{ height: 400, mt: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis 
                allowDecimals={false} 
                tickFormatter={(value) => Math.floor(value)}
                domain={[0, 'auto']}
              />
              <Tooltip 
                formatter={(value, name) => [Math.floor(value), name]}
                labelFormatter={(label) => {
                  const entry = chartData.find(d => d.label === label);
                  return entry?.fullLabel || label;
                }}
              />
              <Legend />
              <Bar dataKey="verified" name="Verified Cases" fill="#4caf50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending Cases" fill="#ff9800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default CaseHistory;

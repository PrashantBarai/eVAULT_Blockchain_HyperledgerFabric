import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
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
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getUserData } from '../../utils/auth';

const FABRIC_API = 'http://localhost:8000/api/benchclerk';

const CaseStatusTracking = () => {
  const [allCases, setAllCases] = useState([]);
  const [stats, setStats] = useState({
    totalForwarded: 0,
    totalConfirmed: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('last6months');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const user = getUserData();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

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
        let forwardedCases = [];
        let confirmedCases = [];
        let pendingCases = [];

        // Fetch pending cases from blockchain (benchclerk namespace)
        try {
          const pendingResponse = await fetch(`${FABRIC_API}/cases/pending`);
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            const cases = pendingData.data || [];
            cases.forEach(c => {
              const status = (c.status || '').toUpperCase();
              const caseEntry = {
                id: c.id,
                createdAt: c.createdAt || c.filedDate || new Date().toISOString(),
                status: status,
              };

              if (status.includes('FORWARDED_TO_JUDGE') || status.includes('PENDING_JUDGE')) {
                forwardedCases.push(caseEntry);
              } else if (status.includes('DECISION_CONFIRMED') || status.includes('COMPLETED') || status.includes('JUDGMENT')) {
                confirmedCases.push(caseEntry);
              } else {
                pendingCases.push(caseEntry);
              }
            });
          }
        } catch (err) {
          console.error('Error fetching pending cases:', err);
        }

        // Also fetch judged cases (decisions awaiting/confirmed)
        try {
          const judgedResponse = await fetch(`${FABRIC_API}/cases/judged`);
          if (judgedResponse.ok) {
            const judgedData = await judgedResponse.json();
            const cases = judgedData.data || [];
            cases.forEach(c => {
              // Avoid duplicates
              if (!confirmedCases.find(ec => ec.id === c.id) && !forwardedCases.find(ec => ec.id === c.id)) {
                confirmedCases.push({
                  id: c.id,
                  createdAt: c.createdAt || c.filedDate || new Date().toISOString(),
                  status: c.status || 'JUDGMENT_ISSUED',
                });
              }
            });
          }
        } catch (err) {
          console.error('Error fetching judged cases:', err);
        }

        // Also use stats endpoint for overall counts
        try {
          const statsResponse = await fetch(`${FABRIC_API}/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            const bcStats = statsData.data || {};
            // Use blockchain stats as fallback if we got no cases from individual calls
            if (forwardedCases.length === 0 && confirmedCases.length === 0 && pendingCases.length === 0) {
              forwardedCases = Array(bcStats.forwardedCases || 0).fill(null).map((_, i) => ({
                id: `fwd-${i}`, createdAt: new Date().toISOString(), status: 'FORWARDED_TO_JUDGE'
              }));
              confirmedCases = Array(bcStats.completedCases || 0).fill(null).map((_, i) => ({
                id: `conf-${i}`, createdAt: new Date().toISOString(), status: 'DECISION_CONFIRMED'
              }));
              pendingCases = Array(bcStats.pendingCases || 0).fill(null).map((_, i) => ({
                id: `pend-${i}`, createdAt: new Date().toISOString(), status: 'PENDING_BENCHCLERK_REVIEW'
              }));
            }
          }
        } catch (err) {
          console.error('Error fetching stats:', err);
        }

        setAllCases([...forwardedCases, ...confirmedCases, ...pendingCases]);
        setStats({
          totalForwarded: forwardedCases.length,
          totalConfirmed: confirmedCases.length,
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

  const chartData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const categorize = (status) => {
      const s = status.toUpperCase();
      if (s.includes('FORWARDED_TO_JUDGE') || s.includes('PENDING_JUDGE')) return 'forwarded';
      if (s.includes('DECISION') || s.includes('CONFIRMED') || s.includes('COMPLETED') || s.includes('JUDGMENT')) return 'confirmed';
      return 'pending';
    };

    if (viewMode === 'last6months') {
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthIndex = targetDate.getMonth();
        const year = targetDate.getFullYear();
        data.push({
          label: `${months[monthIndex]}'${String(year).slice(-2)}`,
          fullLabel: `${months[monthIndex]} ${year}`,
          monthIndex, year,
          forwarded: 0, confirmed: 0, pending: 0,
        });
      }

      allCases.forEach(c => {
        const date = new Date(c.createdAt);
        const caseMonth = date.getMonth();
        const caseYear = date.getFullYear();
        const category = categorize(c.status);
        const match = data.find(d => d.monthIndex === caseMonth && d.year === caseYear);
        if (match) match[category]++;
      });

      return data;
    } else if (viewMode === 'last6years') {
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const year = currentYear - i;
        data.push({
          label: String(year), fullLabel: String(year), year,
          forwarded: 0, confirmed: 0, pending: 0,
        });
      }

      allCases.forEach(c => {
        const date = new Date(c.createdAt);
        const caseYear = date.getFullYear();
        const category = categorize(c.status);
        const match = data.find(d => d.year === caseYear);
        if (match) match[category]++;
      });

      return data;
    } else {
      const data = months.map((month, index) => ({
        label: month, fullLabel: `${month} ${selectedYear}`,
        monthIndex: index, year: selectedYear,
        forwarded: 0, confirmed: 0, pending: 0,
      }));

      allCases.forEach(c => {
        const date = new Date(c.createdAt);
        const caseMonth = date.getMonth();
        const caseYear = date.getFullYear();
        const category = categorize(c.status);
        if (caseYear === selectedYear) data[caseMonth][category]++;
      });

      return data;
    }
  }, [allCases, viewMode, selectedYear, currentYear]);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) setViewMode(newMode);
  };

  const getChartTitle = () => {
    switch (viewMode) {
      case 'last6months': return 'Monthly Statistics (Last 6 Months)';
      case 'last6years': return 'Yearly Statistics (Last 6 Years)';
      case 'specificYear': return `Monthly Statistics for ${selectedYear}`;
      default: return 'Statistics';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-5px)' }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
        </Box>
        <Typography variant="h3" sx={{ textAlign: 'center', mt: 2 }}>{value}</Typography>
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
          p: 3, mb: 3,
          background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)',
          color: 'white', borderRadius: 2,
        }}
      >
        <Typography variant="h4">Case Status Tracking</Typography>
        <Typography variant="subtitle1">
          Statistical overview of cases processed
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Forwarded to Judge" value={stats.totalForwarded}
            icon={<SendIcon sx={{ fontSize: 30 }} />} color="#8e44ad" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Decisions Confirmed" value={stats.totalConfirmed}
            icon={<CheckCircleIcon sx={{ fontSize: 30 }} />} color="#27ae60" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Review" value={stats.totalPending}
            icon={<PendingIcon sx={{ fontSize: 30 }} />} color="#e67e22" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Processed" value={stats.totalForwarded + stats.totalConfirmed + stats.totalPending}
            icon={<TrendingUpIcon sx={{ fontSize: 30 }} />} color="#4a90e2" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6">{getChartTitle()}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange}
              size="small" sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 2 } }}>
              <ToggleButton value="last6months">
                <CalendarMonthIcon sx={{ mr: 1, fontSize: 18 }} /> Last 6 Months
              </ToggleButton>
              <ToggleButton value="last6years">
                <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} /> Last 6 Years
              </ToggleButton>
              <ToggleButton value="specificYear">
                <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} /> By Year
              </ToggleButton>
            </ToggleButtonGroup>

            {viewMode === 'specificYear' && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}>
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
            <BarChart data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false}
                tickFormatter={(value) => Math.floor(value)}
                domain={[0, 'auto']} />
              <Tooltip
                formatter={(value, name) => [Math.floor(value), name]}
                labelFormatter={(label) => {
                  const entry = chartData.find(d => d.label === label);
                  return entry?.fullLabel || label;
                }} />
              <Legend />
              <Bar dataKey="forwarded" name="Forwarded to Judge" fill="#8e44ad" radius={[4, 4, 0, 0]} />
              <Bar dataKey="confirmed" name="Decisions Confirmed" fill="#27ae60" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending Review" fill="#e67e22" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default CaseStatusTracking;

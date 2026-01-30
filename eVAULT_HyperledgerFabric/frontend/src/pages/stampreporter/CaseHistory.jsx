import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InboxOutlined as InboxIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { getUserData } from '../../utils/auth';

const CaseHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '6months', '6years', 'year'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchVerifiedCases = async () => {
      try {
        const user = getUserData();
        if (!user?._id) throw new Error('User data not found.');

        const verifiedCases = [];

        // Get case IDs assigned to this stamp reporter from MongoDB
        const casesResponse = await axios.get(`http://localhost:3000/stampreporter-cases/${user._id}`);
        const assignedCaseIds = casesResponse.data.case_ids || [];

        // Fetch details for each assigned case from blockchain
        for (const caseId of assignedCaseIds) {
          try {
            const caseResponse = await axios.get(`http://localhost:8000/api/stampreporter/case/${caseId}`);
            if (caseResponse.data.success && caseResponse.data.data) {
              const c = caseResponse.data.data;
              const status = (c.status || '').toUpperCase();
              
              // Only show verified/approved/rejected cases in history
              if (status.includes('VERIFIED') || status.includes('APPROVED') || status.includes('REJECTED') || status.includes('FORWARDED_TO')) {
                verifiedCases.push({
                  _id: caseId,
                  case_subject: c.caseSubject || c.title || 'Untitled Case',
                  associated_lawyers: c.associatedLawyers?.join(', ') || c.createdBy || 'N/A',
                  filed_date: c.filedDate || c.createdAt,
                  status: status.includes('REJECTED') ? 'Rejected' : 'Approved',
                  reason: c.verificationNotes || c.rejectionReason || '-',
                  verificationDate: c.updatedAt || c.filedDate || c.createdAt,
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching case ${caseId}:`, err);
          }
        }

        setCases(verifiedCases);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedCases();
  }, []);

  // Get list of available years from cases
  const availableYears = [...new Set(cases.map(c => {
    const date = new Date(c.verificationDate || c.filed_date);
    return date.getFullYear();
  }))].sort((a, b) => b - a);

  // Apply date filtering
  const getDateFilteredCases = () => {
    const now = new Date();
    
    return cases.filter(c => {
      const caseDate = new Date(c.verificationDate || c.filed_date);
      
      if (dateFilter === '6months') {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return caseDate >= sixMonthsAgo;
      } else if (dateFilter === '6years') {
        const sixYearsAgo = new Date(now);
        sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
        return caseDate >= sixYearsAgo;
      } else if (dateFilter === 'year') {
        return caseDate.getFullYear() === selectedYear;
      }
      return true; // 'all'
    });
  };

  const filteredCases = getDateFilteredCases().filter(
    (case_) =>
      (filterStatus === 'all' || case_.status.toLowerCase() === filterStatus) &&
      (case_._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
       case_.case_subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
       case_.associated_lawyers.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = (event, newStatus) => {
    if (newStatus !== null) {
      setFilterStatus(newStatus);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>Case History</Typography>
        <Typography variant="subtitle1">
          View all previously verified cases
        </Typography>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        <TextField
          fullWidth
          placeholder="Search by Case ID, Title, or Lawyer"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexShrink: 0,
          width: { xs: '100%', md: 'auto' }
        }}>
          <ToggleButtonGroup
            value={filterStatus}
            exclusive
            onChange={handleStatusChange}
            aria-label="case status filter"
            sx={{ height: '56px' }}
          >
            <ToggleButton 
              value="all"
              sx={{ 
                px: 3,
                '&.Mui-selected': {
                  bgcolor: '#3f51b5 !important',
                  color: 'white !important',
                }
              }}
            >
              All
            </ToggleButton>
            <ToggleButton 
              value="approved"
              sx={{ 
                px: 3,
                '&.Mui-selected': {
                  bgcolor: '#4caf50 !important',
                  color: 'white !important',
                }
              }}
            >
              <CheckCircleIcon sx={{ mr: 1 }} />
              Approved
            </ToggleButton>
            <ToggleButton 
              value="rejected"
              sx={{ 
                px: 3,
                '&.Mui-selected': {
                  bgcolor: '#f44336 !important',
                  color: 'white !important',
                }
              }}
            >
              <CancelIcon sx={{ mr: 1 }} />
              Rejected
            </ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant={dateFilter === '6months' ? 'contained' : 'outlined'}
            startIcon={<CalendarTodayIcon />}
            onClick={() => setDateFilter(dateFilter === '6months' ? 'all' : '6months')}
            sx={{ 
              color: dateFilter === '6months' ? 'white' : '#3f51b5',
              bgcolor: dateFilter === '6months' ? '#3f51b5' : 'transparent',
              borderColor: '#3f51b5',
              minWidth: '150px',
              '&:hover': {
                bgcolor: dateFilter === '6months' ? '#2f3f8f' : 'rgba(63, 81, 181, 0.1)',
              }
            }}
          >
            Last 6 Months
          </Button>
          <Button 
            variant={dateFilter === '6years' ? 'contained' : 'outlined'}
            startIcon={<CalendarTodayIcon />}
            onClick={() => setDateFilter(dateFilter === '6years' ? 'all' : '6years')}
            sx={{ 
              color: dateFilter === '6years' ? 'white' : '#3f51b5',
              bgcolor: dateFilter === '6years' ? '#3f51b5' : 'transparent',
              borderColor: '#3f51b5',
              minWidth: '150px',
              '&:hover': {
                bgcolor: dateFilter === '6years' ? '#2f3f8f' : 'rgba(63, 81, 181, 0.1)',
              }
            }}
          >
            Last 6 Years
          </Button>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={dateFilter === 'year' ? selectedYear : ''}
              label="Year"
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setDateFilter('year');
              }}
              size="medium"
            >
              {availableYears.length > 0 ? (
                availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))
              ) : (
                [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          {dateFilter !== 'all' && (
            <Button 
              variant="text"
              onClick={() => setDateFilter('all')}
              sx={{ color: '#f44336' }}
            >
              Clear Filter
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error" align="center">{error}</Typography>
      ) : filteredCases.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <InboxIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Case History Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cases.length === 0 
              ? "You haven't verified any cases yet."
              : "No cases match your current filters."}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><Typography variant="subtitle2">Case ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Title</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Lawyer</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Verification Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Reason</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow 
                  key={case_._id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {case_._id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.case_subject}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.associated_lawyers}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {case_.verificationDate ? new Date(case_.verificationDate).toLocaleDateString() : case_.filed_date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={case_.status} 
                      size="small"
                      sx={{ 
                        bgcolor: case_.status === 'Approved' ? '#4caf50' : '#f44336',
                        color: 'white',
                        fontWeight: 500
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {case_.reason}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CaseHistory;
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
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';

const CaseHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerifiedCases = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in to view cases.');

        const userString = localStorage.getItem('user_data');
        if (!userString) throw new Error('User data not found.');

        const user = JSON.parse(userString);
        const userId = user.user_id;

        const response = await axios.get(`http://localhost:8000/all-cases/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response);
        if (response.status !== 200) throw new Error('Failed to fetch verified cases.');

        setCases(response.data.cases ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedCases();
  }, []);

  const filteredCases = cases.filter(
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
            variant="outlined" 
            startIcon={<CalendarTodayIcon />}
            sx={{ 
              color: '#3f51b5',
              borderColor: '#3f51b5',
              minWidth: '200px'
            }}
          >
            Filter by Date
          </Button>
        </Box>
      </Box>

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
                  <Typography variant="body2">{case_.filed_date}</Typography>
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
    </Box>
  );
};

export default CaseHistory;
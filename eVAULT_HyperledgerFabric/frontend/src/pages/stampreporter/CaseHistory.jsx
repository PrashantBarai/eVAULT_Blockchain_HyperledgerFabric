import React, { useState } from 'react';
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

const CaseHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const cases = [
    {
      id: 'CASE123',
      title: 'Property Dispute in Mumbai Suburb',
      status: 'Approved',
      verificationDate: '2025-03-01',
      lawyer: 'Adv. Sarah Johnson',
      reason: 'All documents verified and complete',
    },
    {
      id: 'CASE124',
      title: 'Corporate Fraud Investigation',
      status: 'Rejected',
      verificationDate: '2025-03-01',
      lawyer: 'Adv. Michael Chen',
      reason: 'Incomplete documentation',
    },
    {
      id: 'CASE125',
      title: 'Environmental Protection Case',
      status: 'Approved',
      verificationDate: '2025-02-28',
      lawyer: 'Adv. Priya Sharma',
      reason: 'Valid environmental clearances provided',
    },
    {
      id: 'CASE126',
      title: 'Intellectual Property Rights',
      status: 'Approved',
      verificationDate: '2025-02-28',
      lawyer: 'Adv. John Smith',
      reason: 'Patent documentation verified',
    },
    {
      id: 'CASE127',
      title: 'Family Inheritance Dispute',
      status: 'Rejected',
      verificationDate: '2025-02-27',
      lawyer: 'Adv. Rahul Verma',
      reason: 'Missing succession certificates',
    },
  ];

  const filteredCases = cases.filter(
    (case_) =>
      (filterStatus === 'all' || case_.status.toLowerCase() === filterStatus) &&
      (case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
       case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       case_.lawyer.toLowerCase().includes(searchTerm.toLowerCase()))
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
                key={case_.id}
                sx={{ 
                  '&:hover': { 
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer'
                  }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {case_.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.title}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.lawyer}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.verificationDate}</Typography>
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

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';

const CaseStatusTracking = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const cases = [
    {
      id: 'CASE-2024-001',
      title: 'Property Documentation',
      status: 'Accepted',
      judgeName: 'Hon. Justice Williams',
      decisionDate: '2024-12-15',
      lawyer: 'Robert Brown',
    },
    {
      id: 'CASE-2024-002',
      title: 'Will Registration',
      status: 'Rejected',
      judgeName: 'Hon. Justice Rodriguez',
      decisionDate: '2024-12-10',
      lawyer: 'Sarah Wilson',
    },
    {
      id: 'CASE-2024-003',
      title: 'Land Deed Transfer',
      status: 'Pending Hearing',
      judgeName: 'Hon. Justice Martinez',
      decisionDate: '2024-11-28',
      lawyer: 'Michael Clark',
    },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending hearing':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredCases = cases.filter((case_) => {
    const matchesSearch = 
      case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.lawyer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      case_.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Status Tracking
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(e, newValue) => setStatusFilter(newValue || 'all')}
          aria-label="status filter"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all" aria-label="all cases">
            All
          </ToggleButton>
          <ToggleButton value="accepted" aria-label="accepted cases">
            Accepted
          </ToggleButton>
          <ToggleButton value="rejected" aria-label="rejected cases">
            Rejected
          </ToggleButton>
          <ToggleButton value="pending hearing" aria-label="pending cases">
            Pending Hearing
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Judge</TableCell>
              <TableCell sx={{ color: 'white' }}>Decision Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Lawyer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.id}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>
                  <Chip 
                    label={case_.status}
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{case_.judgeName}</TableCell>
                <TableCell>{case_.decisionDate}</TableCell>
                <TableCell>{case_.lawyer}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CaseStatusTracking;

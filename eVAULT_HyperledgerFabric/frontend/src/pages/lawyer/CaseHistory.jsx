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

const CaseHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with actual API call
  const cases = [
    {
      id: 1,
      caseNumber: 'CASE-2024-001',
      title: 'Property Documentation',
      client: 'Robert Brown',
      status: 'Completed',
      date: '2024-12-15',
      verifiedBy: 'Registrar Office',
    },
    {
      id: 2,
      caseNumber: 'CASE-2024-002',
      title: 'Will Registration',
      client: 'Sarah Wilson',
      status: 'Rejected',
      date: '2024-12-10',
      verifiedBy: 'Stamp Reporter',
    },
    {
      id: 3,
      caseNumber: 'CASE-2024-003',
      title: 'Land Deed Transfer',
      client: 'Michael Clark',
      status: 'Completed',
      date: '2024-11-28',
      verifiedBy: 'Registrar Office',
    },
    {
      id: 4,
      caseNumber: 'CASE-2024-004',
      title: 'Partnership Agreement',
      client: 'Tech Solutions Ltd',
      status: 'Pending',
      date: '2024-11-20',
      verifiedBy: 'In Process',
    },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredCases = cases.filter((case_) => {
    const matchesSearch = 
      case_.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.client.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      case_.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case History
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
          <ToggleButton value="completed" aria-label="completed cases">
            Completed
          </ToggleButton>
          <ToggleButton value="pending" aria-label="pending cases">
            Pending
          </ToggleButton>
          <ToggleButton value="rejected" aria-label="rejected cases">
            Rejected
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Verified By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.caseNumber}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.client}</TableCell>
                <TableCell>
                  <Chip 
                    label={case_.status}
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{case_.date}</TableCell>
                <TableCell>{case_.verifiedBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CaseHistory;

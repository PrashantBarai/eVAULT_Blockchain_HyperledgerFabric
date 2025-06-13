import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const CaseHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cases from the backend
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('You must be logged in to view cases.');
        }

        const userString = localStorage.getItem('user_data');
        const user = JSON.parse(userString);
        const userId = user.user_id;

        const response = await fetch(`http://localhost:8000/case-history/${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cases.');
        }

        const data = await response.json();
        setCases(data.cases);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

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
      case_.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.client?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      case_.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
              <TableRow key={case_._id}>
                <TableCell>{case_.caseNumber}</TableCell>
                <TableCell>{case_.case_subject}</TableCell>
                <TableCell>{case_.client}</TableCell>
                <TableCell>
                  <Chip
                    label={case_.status}
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(case_.filed_date).toLocaleDateString()}</TableCell>
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
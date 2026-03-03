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
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';
import { formatDate, DATE_FORMAT_LABEL } from '../../utils/dateFormat';

const Cases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cases from the backend
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const user = getUserData();
        if (!user) {
          throw new Error('You must be logged in to view cases.');
        }
        console.log('User data:', user);

        // Approach 1: Try to get cases linked to this user from MongoDB
        let userCaseIds = [];
        try {
          const mongoResponse = await fetch(`http://localhost:3000/user-cases/${user.email}`, {
            method: 'GET'
          });

          if (mongoResponse.ok) {
            const mongoData = await mongoResponse.json();
            console.log('MongoDB case references:', mongoData);
            userCaseIds = mongoData.case_ids || [];
          }
        } catch (mongoError) {
          console.warn('Could not fetch case references from MongoDB:', mongoError);
        }

        // Approach 2: Fetch all cases from blockchain
        const response = await fetch(`http://localhost:8000/api/lawyer/cases/all`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cases from blockchain.');
        }

        const data = await response.json();
        console.log('Blockchain cases:', data);

        let allCases = data.data || [];

        // If we have case IDs from MongoDB, show only those cases
        // Otherwise, show all cases (fallback for cases created before linking feature)
        if (userCaseIds.length > 0) {
          allCases = allCases.filter(c => userCaseIds.includes(c.id));
          console.log('Filtered to user cases:', allCases);
        } else {
          // Fallback: filter by createdBy field
          const username = user.username || user.name;
          allCases = allCases.filter(c =>
            c.createdBy === username || c.createdBy === user.email
          );
          console.log('Filtered by createdBy:', allCases);
        }

        setCases(allCases);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Filter cases based on search query only
  const filteredCases = cases.filter((case_) => {
    // Search filter
    const matchesSearch =
      (case_.caseSubject || case_.case_subject)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (case_.id || case_._id)?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (case_.clientName || case_.client)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (case_.caseNumber || case_.case_number)?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Function to get stage color and display name
  const getStageInfo = (currentOrg) => {
    const stageMapping = {
      'LawyersOrg': { label: 'With Lawyer', color: 'primary' },
      'RegistrarsOrg': { label: 'With Registrar (Queue)', color: 'warning' },
      'StampReportersOrg': { label: 'With Stamp Reporter (Verification)', color: 'info' },
      'BenchClerksOrg': { label: 'With Bench Clerk', color: 'secondary' },
      'JudgesOrg': { label: 'With Judge (Review)', color: 'success' },
    };
    return stageMapping[currentOrg] || { label: currentOrg || 'Unknown', color: 'default' };
  };

  const handleViewCase = (caseId) => {
    navigate(`/lawyer/case/${caseId}`);
  };

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          My Cases
          <Chip label={filteredCases.length} color="primary" size="small" />
        </Typography>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by case number, title, client name..."
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Case Number</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Current Stage</strong></TableCell>
              <TableCell><strong>Date Filed {DATE_FORMAT_LABEL}</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {searchQuery
                      ? 'No cases found matching your search'
                      : 'No cases available'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((case_) => {
                const stageInfo = getStageInfo(case_.currentOrg);
                return (
                  <TableRow key={case_.id || case_._id} hover>
                    <TableCell>{case_.caseNumber || case_.case_number || (case_.id || case_._id)}</TableCell>
                    <TableCell>{case_.caseSubject || case_.case_subject || case_.title}</TableCell>
                    <TableCell>{case_.clientName || case_.client}</TableCell>
                    <TableCell>
                      <Chip
                        label={stageInfo.label}
                        color={stageInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(case_.filedDate || case_.filed_date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewCase(case_.id || case_._id)}
                        sx={{
                          bgcolor: '#3f51b5',
                          '&:hover': {
                            bgcolor: '#2f3f8f',
                          },
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Cases;
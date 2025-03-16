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
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
        const token = localStorage.getItem('token');
        console.log(token);
        if (!token) {
          throw new Error('You must be logged in to view cases.');
        }

        const userString = localStorage.getItem('user_data');
        const user = JSON.parse(userString);
        const userId = user.user_id;

        const response = await fetch(`http://localhost:8000/get-cases/${userId}`, {
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

  // Filter cases based on search query
  const filteredCases = cases.filter(
    (case_) =>
      case_.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.case_subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.client?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Typography variant="h4" gutterBottom>
          My Cases
        </Typography>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow key={case_._id}>
                <TableCell>{case_.caseId}</TableCell>
                <TableCell>{case_.case_subject}</TableCell>
                <TableCell>{case_.client}</TableCell>
                <TableCell>{case_.status}</TableCell>
                <TableCell>{new Date(case_.filed_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewCase(case_._id)}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Cases;
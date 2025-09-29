import React, { useEffect, useState } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cases = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const userString = localStorage.getItem('user_data');
        if (!userString) throw new Error('User data not found.');

        const user = JSON.parse(userString);
        const userId = user._id;

        const response = await fetch(`http://localhost:8000/get-cases-registrar/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch cases.');

        const data = await response.json();
        console.log('Fetched cases:', data);

        // data.cases might be undefined if error
        setCases(data.cases ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // only filter the 4 fields you care about
  const filteredCases = cases.filter((case_) =>
    case_?._id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_?.case_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_?.case_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_?.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Typography variant="h4" gutterBottom>Pending Cases</Typography>
        <Typography variant="subtitle1">Cases requiring verification</Typography>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Case ID, Title, Case Type or Status"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><Typography variant="subtitle2">Case ID</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Title</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Case Type</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Action</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow
                  key={case_._id}
                  sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{case_._id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.case_subject}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.case_type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.status}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate(`/registrar/case-verification/${case_._id}`)}
                      sx={{
                        color: '#3f51b5',
                        borderColor: '#3f51b5',
                        '&:hover': {
                          borderColor: '#3f51b5',
                          bgcolor: 'rgba(63, 81, 181, 0.1)'
                        }
                      }}
                    >
                      Review
                    </Button>
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

export default Cases;

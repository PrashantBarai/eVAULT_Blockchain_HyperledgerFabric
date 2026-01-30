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
  InboxOutlined as InboxIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';
import axios from 'axios';

const Cases = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const user = getUserData();
        if (!user) throw new Error('User data not found.');
        
        const userId = user._id;
        console.log('Fetching cases for registrar:', userId);

        // Step 1: Get case IDs assigned to this specific registrar from MongoDB
        const registrarCasesResponse = await fetch(`http://localhost:3000/registrar-cases/${userId}`);
        if (!registrarCasesResponse.ok) {
          throw new Error('Failed to fetch registrar case assignments.');
        }
        
        const registrarCasesData = await registrarCasesResponse.json();
        const assignedCaseIds = registrarCasesData.case_ids || [];
        console.log('Assigned case IDs for this registrar:', assignedCaseIds);
        
        if (assignedCaseIds.length === 0) {
          setCases([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch case details from blockchain for assigned cases
        const response = await fetch('http://localhost:8000/api/registrar/cases/pending');
        if (!response.ok) throw new Error('Failed to fetch cases from blockchain.');

        const data = await response.json();
        console.log('All pending cases from blockchain:', data);

        // Step 3: Filter to only show cases assigned to this registrar
        const allCases = data.data || [];
        const myAssignedCases = allCases.filter(c => assignedCaseIds.includes(c.id));
        console.log('Cases assigned to this registrar:', myAssignedCases);

        // Map blockchain data to display format
        const formattedCases = myAssignedCases.map(c => ({
          _id: c.id,
          case_subject: c.caseSubject || c.title,
          case_type: c.type,
          status: c.status,
          createdAt: c.createdAt,
          department: c.department
        }));
        
        setCases(formattedCases);
      } catch (err) {
        console.error('Error fetching cases:', err);
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
      ) : filteredCases.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Cases Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no pending cases requiring verification at this time.
          </Typography>
        </Paper>
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

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
  CircularProgress,
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
        console.log('Fetching cases for stamp reporter:', userId);

        // Step 1: Get case IDs assigned to this stamp reporter from MongoDB
        const casesResponse = await axios.get(`http://localhost:3000/stampreporter-cases/${userId}`);
        const assignedCaseIds = casesResponse.data.case_ids || [];
        console.log('Assigned case IDs:', assignedCaseIds);

        if (assignedCaseIds.length === 0) {
          setCases([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch case details from blockchain for each assigned case
        const fetchedCases = [];
        for (const caseId of assignedCaseIds) {
          try {
            const caseResponse = await axios.get(`http://localhost:8000/api/stampreporter/case/${caseId}`);
            if (caseResponse.data.success && caseResponse.data.data) {
              const caseData = caseResponse.data.data;
              const status = (caseData.status || '').toUpperCase();
              
              // Only show pending cases (not verified or rejected)
              if (!status.includes('VERIFIED') && !status.includes('APPROVED') && !status.includes('REJECTED') && !status.includes('FORWARDED_TO')) {
                fetchedCases.push({
                  _id: caseId,
                  case_subject: caseData.caseSubject || caseData.title || 'Untitled',
                  case_type: caseData.type || caseData.caseType || 'N/A',
                  associated_lawyers: caseData.associatedLawyers?.join(', ') || caseData.createdBy || 'N/A',
                  filed_date: caseData.filedDate || caseData.createdAt || 'N/A',
                  priority: caseData.priority || 'Medium',
                  status: caseData.status || 'Pending',
                  department: caseData.department || 'N/A'
                });
              }
            }
            // If blockchain returns no data or success=false, skip this case (it doesn't exist)
          } catch (err) {
            console.error(`Error fetching case ${caseId} from blockchain - skipping (case may not exist):`, err.message);
            // Skip cases that don't exist in blockchain - don't add them to the list
            // This handles cases where MongoDB has stale references to deleted blockchain cases
          }
        }

        setCases(fetchedCases);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredCases = cases.filter(
    (case_) =>
      case_?._id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_?.case_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_?.associated_lawyers?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_?.case_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#ff9800';
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
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Pending Cases
        </Typography>
        <Typography variant="subtitle1">Cases requiring document verification</Typography>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Case ID, Title, Lawyer, or Case Type"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">
          {error}
        </Typography>
      ) : filteredCases.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InboxIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Pending Cases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no cases requiring verification at this time.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>
                  <Typography variant="subtitle2">Case ID</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Title</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Lawyer</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Filed Date</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Priority</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">Action</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow key={case_._id} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
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
                      {case_.filed_date ? new Date(case_.filed_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: getPriorityColor(case_.priority), fontWeight: 500 }}>
                      {case_.priority}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate(`/stampreporter/case-verification/${case_._id}`)}
                      sx={{
                        color: '#3f51b5',
                        borderColor: '#3f51b5',
                        '&:hover': {
                          borderColor: '#3f51b5',
                          bgcolor: 'rgba(63, 81, 181, 0.1)',
                        },
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

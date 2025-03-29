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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const CaseManagement = ({ userId }) => {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view cases.');
          setLoading(false);
          return;
        }

        const userString = localStorage.getItem('user_data');
        console.log(userString);
        if (!userString) {
          setError('User data not found.');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userString);
        const userIdToUse = userId || user.user_id;
        console.log(user.userId);
        if (!userIdToUse) {
          setError('User ID is missing.');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/get-cases/${userIdToUse}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }

        const data = await response.json();
        setCases(Array.isArray(data.cases) ? data.cases : []);
      } catch (error) {
        setError(error.message || 'Error fetching cases');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [userId]);

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleForwardToJudge = (caseId) => {
    if (!caseId) return;
    console.log('Forwarding case to judge:', caseId);
  };

  const filteredCases = cases.filter((case_) => {
    return (
      case_._id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.case_subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Management
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search cases..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
                <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Title</TableCell>
                <TableCell sx={{ color: 'white' }}>Type</TableCell>
                <TableCell sx={{ color: 'white' }}>Registrar</TableCell>
                <TableCell sx={{ color: 'white' }}>Filed Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((case_) => (
                <TableRow key={case_._id}>
                  <TableCell>{case_._id}</TableCell>
                  <TableCell>{case_.case_subject}</TableCell>
                  <TableCell>{case_.case_type}</TableCell>
                  <TableCell>{case_.assigned_registrar || 'N/A'}</TableCell>
                  <TableCell>{case_.filed_date}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewCase(case_)} sx={{ color: '#4a90e2' }}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleForwardToJudge(case_._id)} sx={{ color: '#8e44ad' }}>
                      <SendIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Case Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Case Details
            <IconButton onClick={() => setOpenDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedCase.case_subject}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Case ID: {selectedCase._id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Type: {selectedCase.case_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Assigned Registrar: {selectedCase.assigned_registrar || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Filed Date: {selectedCase.filed_date}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => handleForwardToJudge(selectedCase?._id)}
            sx={{
              background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
              color: 'white',
            }}
            disabled={!selectedCase}
          >
            Forward to Judge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseManagement;

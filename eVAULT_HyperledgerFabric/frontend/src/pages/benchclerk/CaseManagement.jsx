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
  Snackbar,
  Alert,
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
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
        if (!userString) {
          setError('User data not found.');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userString);
        const userIdToUse = userId || user.user_id;
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

  const handleForwardToJudge = async (caseId) => {
    if (!caseId) return;
    
    try {
      setForwarding(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/case/${caseId}/send-to-judge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to forward case to judge');
      }

      const result = await response.json();
      
      // Update the local state to reflect the changes
      setCases(cases.map(c => {
        if (c._id === caseId) {
          return {
            ...c,
            judge_registrar: result.assigned_judge,
            status: 'Sent to Judge'
          };
        }
        return c;
      }));

      // Show success message
      setSnackbar({
        open: true,
        message: `Case successfully forwarded to judge: ${result.assigned_judge}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error forwarding case:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setForwarding(false);
      setOpenDialog(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredCases = cases.filter((case_) => {
    return (
      case_._id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.case_subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.case_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (case_.judge_registrar?.toLowerCase() || '').includes(searchQuery.toLowerCase())
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
        placeholder="Search cases by ID, subject, type or judge..."
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
                <TableCell sx={{ color: 'white' }}>Judge</TableCell>
                <TableCell sx={{ color: 'white' }}>Filed Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.length > 0 ? (
                filteredCases.map((case_) => (
                  <TableRow key={case_._id}>
                    <TableCell>{case_._id}</TableCell>
                    <TableCell>{case_.case_subject}</TableCell>
                    <TableCell>{case_.case_type}</TableCell>
                    <TableCell>{case_.assigned_registrar || 'N/A'}</TableCell>
                    <TableCell>{case_.judge_registrar || 'Not assigned'}</TableCell>
                    <TableCell>{new Date(case_.filed_date).toLocaleDateString()}</TableCell>
                    <TableCell>{case_.status || 'Pending'}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleViewCase(case_)} 
                        sx={{ color: '#4a90e2' }}
                        disabled={forwarding}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {!case_.judge_registrar && (
                        <IconButton 
                          onClick={() => handleForwardToJudge(case_._id)} 
                          sx={{ color: '#8e44ad' }}
                          disabled={forwarding}
                        >
                          {forwarding ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No cases found
                  </TableCell>
                </TableRow>
              )}
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
                <strong>Case ID:</strong> {selectedCase._id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedCase.case_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {selectedCase.case_description || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Assigned Registrar:</strong> {selectedCase.assigned_registrar || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Assigned Judge:</strong> {selectedCase.judge_registrar || 'Not assigned'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Filed Date:</strong> {new Date(selectedCase.filed_date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {selectedCase.status || 'Pending'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedCase && !selectedCase.judge_registrar && (
            <Button
              variant="contained"
              startIcon={forwarding ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={() => handleForwardToJudge(selectedCase._id)}
              sx={{
                background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
                color: 'white',
              }}
              disabled={forwarding}
            >
              Forward to Judge
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaseManagement;
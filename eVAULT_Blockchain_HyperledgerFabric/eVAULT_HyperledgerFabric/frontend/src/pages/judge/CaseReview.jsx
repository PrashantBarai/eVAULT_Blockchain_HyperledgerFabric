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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment, // Added this missing import
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const CaseReview = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [decisionType, setDecisionType] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [openDecisionDialog, setOpenDecisionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [searchQuery, setSearchQuery] = useState('');

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
        const userIdToUse = user.user_id;
        if (!userIdToUse) {
          setError('User ID is missing.');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/get-cases/${userIdToUse}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }

        const data = await response.json();
        setCases(Array.isArray(data.cases) ? data.cases : []);
      } catch (error) {
        setError(error.message);
        setSnackbar({
          open: true,
          message: `Error: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleDecisionClick = () => {
    setOpenDecisionDialog(true);
  };

  const handleDecisionSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/case/${selectedCase._id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: decisionType,
          reason: decisionReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit decision');
      }

      const result = await response.json();
      
      // Update local state
      setCases(cases.map(c => 
        c._id === selectedCase._id ? { ...c, status: decisionType } : c
      ));
      
      setSnackbar({
        open: true,
        message: `Decision submitted successfully`,
        severity: 'success'
      });
      
      setOpenDecisionDialog(false);
      setOpenDialog(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChipColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'new': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'on hold': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const filteredCases = cases.filter((case_) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      case_._id?.toLowerCase().includes(searchLower) ||
      case_.case_subject?.toLowerCase().includes(searchLower) ||
      case_.case_type?.toLowerCase().includes(searchLower) ||
      case_.status?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Review & Decision
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
              <TableRow sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Title</TableCell>
                <TableCell sx={{ color: 'white' }}>Type</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Filed Date</TableCell>
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
                    <TableCell>
                      <Chip
                        label={case_.status || 'Pending'}
                        color={getStatusChipColor(case_.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(case_.filed_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        onClick={() => handleViewCase(case_)}
                        sx={{
                          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                          color: 'white',
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No cases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Case Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Case Details</Typography>
            <IconButton onClick={() => setOpenDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedCase.case_subject}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Case ID: {selectedCase._id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Type: {selectedCase.case_type}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status: 
                          <Chip
                            label={selectedCase.status || 'Pending'}
                            color={getStatusChipColor(selectedCase.status)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Filed Date: {new Date(selectedCase.filed_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Description: {selectedCase.case_description || 'No description available'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Typography variant="h6" gutterBottom>
                  Case History
                </Typography>
                <Stepper orientation="vertical">
                  {selectedCase.history?.length > 0 ? (
                    selectedCase.history.map((step, index) => (
                      <Step key={index} active={true}>
                        <StepLabel>
                          <Typography variant="subtitle2">{step.action}</Typography>
                          <Typography variant="caption">
                            {new Date(step.date).toLocaleDateString()} • {step.actor}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No history available
                    </Typography>
                  )}
                </Stepper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Take Action
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<GavelIcon />}
                      onClick={handleDecisionClick}
                      sx={{
                        mb: 2,
                        background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                      }}
                    >
                      Make Decision
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog
        open={openDecisionDialog}
        onClose={() => setOpenDecisionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Make Decision</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Decision</InputLabel>
            <Select
              value={decisionType}
              label="Decision"
              onChange={(e) => setDecisionType(e.target.value)}
            >
              <MenuItem value="accepted">Accept Case</MenuItem>
              <MenuItem value="rejected">Reject Case</MenuItem>
              <MenuItem value="on hold">Put On Hold</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason/Comments"
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDecisionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDecisionSubmit}
            sx={{
              background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
            }}
          >
            Submit Decision
          </Button>
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

export default CaseReview;
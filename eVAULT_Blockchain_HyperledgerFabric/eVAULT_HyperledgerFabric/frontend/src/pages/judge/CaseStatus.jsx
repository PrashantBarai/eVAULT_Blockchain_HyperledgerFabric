import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

const CaseStatus = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'pending': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'on hold': return 'warning';
      case 'finalized': return 'primary';
      default: return 'default';
    }
  };

  const filterCases = () => {
    const statusMap = ['pending', 'accepted', 'rejected', 'on hold', 'finalized'];
    const currentStatus = statusMap[tabValue];
    
    return cases.filter(case_ => {
      const matchesSearch = 
        case_._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.case_subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (case_.associated_lawyers?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = case_.status?.toLowerCase() === currentStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Status Tracking
      </Typography>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#1a237e !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1a237e',
            },
          }}
        >
          <Tab label="Pending" />
          <Tab label="Accepted" />
          <Tab label="Rejected" />
          <Tab label="On Hold" />
          <Tab label="Finalized" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
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
              {filterCases().length > 0 ? (
                filterCases().map((case_) => (
                  <TableRow key={case_._id}>
                    <TableCell>{case_._id}</TableCell>
                    <TableCell>{case_.case_subject}</TableCell>
                    <TableCell>{case_.case_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={case_.status || 'Pending'}
                        color={getStatusColor(case_.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(case_.filed_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewCase(case_)}
                        sx={{
                          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                        }}
                      >
                        View Details
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
        maxWidth="md"
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
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedCase.case_subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Case ID: {selectedCase._id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Case Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Type: {selectedCase.case_type}
                    <br />
                    Filed Date: {new Date(selectedCase.filed_date).toLocaleDateString()}
                    <br />
                    Status: {selectedCase.status || 'Pending'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedCase.status || 'Pending'}
                    color={getStatusColor(selectedCase.status)}
                    icon={<GavelIcon />}
                  />
                </Paper>
              </Grid>

              {selectedCase.case_description && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedCase.case_description}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseStatus;
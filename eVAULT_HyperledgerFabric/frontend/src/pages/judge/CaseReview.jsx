import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Chip, Grid, Card, CardContent,
  CircularProgress, Snackbar, Alert, InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon, Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateFormat';

const FABRIC_API = 'http://localhost:8000/api/judge';

const CaseReview = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPendingCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FABRIC_API}/cases/pending`);
      if (!response.ok) throw new Error('Failed to fetch pending cases');
      const data = await response.json();
      setCases(data.data || []);
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingCases(); }, []);

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleAcceptCase = async (caseData) => {
    const caseID = caseData?.id || caseData?.caseNumber;
    if (!caseID) return;
    try {
      setAccepting(true);
      const response = await fetch(`${FABRIC_API}/case/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseID }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to accept case');
      }
      setSnackbar({ open: true, message: `Case ${caseID} accepted successfully`, severity: 'success' });
      setOpenDialog(false);
      fetchPendingCases();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setAccepting(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const s = status.toUpperCase();
    if (s.includes('PENDING')) return 'warning';
    if (s.includes('FORWARDED')) return 'info';
    if (s.includes('RECEIVED')) return 'success';
    if (s.includes('JUDGMENT')) return 'primary';
    return 'default';
  };

  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.id?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.caseNumber?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Case Review &mdash; Pending from Bench Clerk</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cases forwarded by the Bench Clerk awaiting your acceptance. Accept a case to begin review.
      </Typography>

      <TextField fullWidth variant="outlined" placeholder="Search cases by ID, title, type..."
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 3 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
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
              {filteredCases.length > 0 ? filteredCases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.caseNumber || c.id}</TableCell>
                  <TableCell>{c.title || c.caseSubject}</TableCell>
                  <TableCell>{c.type || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={c.status || 'Pending'} color={getStatusColor(c.status)} size="small" />
                  </TableCell>
                  <TableCell>{c.filedDate ? formatDate(c.filedDate) : 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewCase(c)} sx={{ color: '#1a237e' }}>
                      <VisibilityIcon />
                    </IconButton>
                    <Button variant="contained" size="small" startIcon={<CheckCircleIcon />}
                      onClick={() => handleAcceptCase(c)} disabled={accepting}
                      sx={{ ml: 1, background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)', color: 'white' }}>
                      Accept
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No pending cases found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Case Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Case Details</Typography>
            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{selectedCase.title || selectedCase.caseSubject}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Case ID: {selectedCase.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Case Number: {selectedCase.caseNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Type: {selectedCase.type || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status: <Chip label={selectedCase.status || 'Pending'}
                            color={getStatusColor(selectedCase.status)} size="small" sx={{ ml: 1 }} />
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Filed: {selectedCase.filedDate ? formatDate(selectedCase.filedDate) : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Client: {selectedCase.clientName || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Description: {selectedCase.description || 'No description available'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Documents */}
                {selectedCase.documents?.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>Documents ({selectedCase.documents.length})</Typography>
                    {selectedCase.documents.map((doc, i) => (
                      <Card key={i} sx={{ mt: 1 }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2">
                              <strong>{doc.name}</strong> — {doc.type} {doc.validated ? '(Validated)' : '(Pending)'}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.open(`https://lime-occasional-xerinae-665.mypinata.cloud/ipfs/${doc.hash || doc.id}`, '_blank')}
                          >
                            View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}

                {/* History */}
                {selectedCase.history?.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Case History</Typography>
                    {selectedCase.history.map((h, i) => (
                      <Card key={i} sx={{ mt: 1 }}>
                        <CardContent>
                          <Typography variant="body2">
                            <strong>{h.status}</strong> — {h.organization} ({formatDate(h.timestamp)})
                          </Typography>
                          {h.comments && <Typography variant="caption">{h.comments}</Typography>}
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Actions</Typography>
                    <Button fullWidth variant="contained" startIcon={<CheckCircleIcon />}
                      onClick={() => handleAcceptCase(selectedCase)} disabled={accepting}
                      sx={{ mb: 2, background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)' }}>
                      {accepting ? 'Accepting...' : 'Accept Case'}
                    </Button>
                    {accepting && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 1 }} />}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaseReview;
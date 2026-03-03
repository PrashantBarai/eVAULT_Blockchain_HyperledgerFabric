import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Snackbar, Alert, Chip, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search as SearchIcon, Send as SendIcon, Visibility as VisibilityIcon,
  Close as CloseIcon, Gavel as GavelIcon,
} from '@mui/icons-material';
import { getUserData } from '../../utils/auth';
import { formatDate, DATE_FORMAT_LABEL } from '../../utils/dateFormat';

const FABRIC_API = 'http://localhost:8000/api/benchclerk';
const JUDGES_API = 'http://localhost:3000/judges';

const CaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]); // Added for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openForwardDialog, setOpenForwardDialog] = useState(false);
  const [judgeId, setJudgeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);
  const [judges, setJudges] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCasesAndJudges = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Fetch cases
      const casesRes = await fetch(`${FABRIC_API}/cases/pending`);
      if (!casesRes.ok) {
        const errData = await casesRes.json();
        throw new Error(errData.message || 'Failed to fetch cases');
      }
      const casesData = await casesRes.json();
      setCases(casesData.data || []);
      setFilteredCases(casesData.data || []); // Initialize filtered cases

      // Fetch judges
      const judgesRes = await fetch(JUDGES_API);
      if (!judgesRes.ok) {
        const errData = await judgesRes.json();
        throw new Error(errData.message || 'Failed to fetch judges');
      }
      const judgesData = await judgesRes.json();
      setJudges(judgesData.judges || []);

    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCasesAndJudges(); }, []);

  // Update filtered cases when searchQuery or cases change
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const newFilteredCases = cases.filter((c) => {
      return (c.id?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) || c.caseNumber?.toLowerCase().includes(q));
    });
    setFilteredCases(newFilteredCases);
  }, [searchQuery, cases]);

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleOpenForward = (caseData) => {
    setSelectedCase(caseData);
    setJudgeId('');
    setOpenForwardDialog(true);
  };

  const handleForwardToJudge = async () => {
    if (!selectedCase?.id) return;
    if (!judgeId) {
      setSnackbar({ open: true, message: 'Please select a judge before forwarding', severity: 'error' });
      return;
    }
    try {
      setForwarding(true);
      const user = getUserData();
      const response = await fetch(`${FABRIC_API}/case/forward-to-judge-and-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseID: selectedCase.id,
          assignmentDetails: {
            judgeId: judgeId,
            assignedBy: user?.username || 'benchclerk',
            assignedAt: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to forward case');
      }
      setSnackbar({ open: true, message: `Case ${selectedCase.id} forwarded to judge`, severity: 'success' });
      setOpenForwardDialog(false);
      setOpenDialog(false);
      fetchCasesAndJudges();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setForwarding(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      'PENDING_BENCHCLERK_REVIEW': 'warning', 'FORWARDED_TO_BENCHCLERK': 'info',
      'FORWARDED_TO_JUDGE': 'success', 'PENDING_JUDGE_REVIEW': 'primary',
    };
    return map[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Case Management</Typography>

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
              <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
                <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Title</TableCell>
                <TableCell sx={{ color: 'white' }}>Type</TableCell>
                <TableCell sx={{ color: 'white' }}>Filed Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.length > 0 ? filteredCases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.caseNumber || c.id}</TableCell>
                  <TableCell>{c.title || c.caseSubject}</TableCell>
                  <TableCell>{c.type || 'N/A'}</TableCell>
                  <TableCell>{c.filedDate ? formatDate(c.filedDate) : 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={c.status || 'Pending'} color={getStatusColor(c.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewCase(c)} sx={{ color: '#4a90e2' }}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenForward(c)} sx={{ color: '#8e44ad' }}
                      disabled={forwarding || c.status === 'FORWARDED_TO_JUDGE'}>
                      <SendIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} align="center">No pending cases found</TableCell></TableRow>
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
            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Case ID:</strong> {selectedCase.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Case Number:</strong> {selectedCase.caseNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Title:</strong> {selectedCase.title}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Type:</strong> {selectedCase.type || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Status:</strong> <Chip label={selectedCase.status} color={getStatusColor(selectedCase.status)} size="small" /></Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Description:</strong> {selectedCase.description || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Client:</strong> {selectedCase.clientName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Filed:</strong> {selectedCase.filedDate ? formatDate(selectedCase.filedDate) : 'N/A'}</Typography>
              </Grid>
              {selectedCase.documents?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Documents ({selectedCase.documents.length})</Typography>
                  {selectedCase.documents.map((doc, i) => (
                    <Card key={i} sx={{ mt: 1 }}><CardContent>
                      <Typography variant="body2"><strong>{doc.name}</strong> - {doc.type} {doc.validated ? '(Validated)' : '(Pending)'}</Typography>
                    </CardContent></Card>
                  ))}
                </Grid>
              )}
              {selectedCase.history?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>History</Typography>
                  {selectedCase.history.map((h, i) => (
                    <Card key={i} sx={{ mt: 1 }}><CardContent>
                      <Typography variant="body2"><strong>{h.status}</strong> - {h.organization} ({formatDate(h.timestamp)})</Typography>
                      {h.comments && <Typography variant="caption">{h.comments}</Typography>}
                    </CardContent></Card>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedCase && selectedCase.status !== 'FORWARDED_TO_JUDGE' && (
            <Button variant="contained" startIcon={<SendIcon />} onClick={() => { setOpenDialog(false); handleOpenForward(selectedCase); }}
              sx={{ background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)', color: 'white' }}>
              Forward to Judge
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Forward to Judge Dialog */}
      <Dialog open={openForwardDialog} onClose={() => setOpenForwardDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Forward Case to Judge</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Case: <strong>{selectedCase?.title || selectedCase?.id}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="judge-select-label">Select Judge</InputLabel>
            <Select
              labelId="judge-select-label"
              value={judgeId}
              label="Select Judge"
              onChange={(e) => setJudgeId(e.target.value)}
            >
              {judges.map(j => (
                <MenuItem key={j._id} value={j.judgeId || j._id}>
                  {j.username || j.email} {j.judgeId ? `(${j.judgeId})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForwardDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleForwardToJudge} disabled={forwarding}
            startIcon={forwarding ? <CircularProgress size={20} /> : <GavelIcon />}
            sx={{ background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)', color: 'white' }}>
            {forwarding ? 'Forwarding...' : 'Forward to Judge'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaseManagement;
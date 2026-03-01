import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Chip, Alert, CircularProgress, Snackbar,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  Gavel as GavelIcon, Check as CheckIcon, Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const FABRIC_API = 'http://localhost:8000/api/benchclerk';

const JudgeDecisionConfirmation = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchJudgedCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FABRIC_API}/cases/judged`);
      if (!response.ok) throw new Error('Failed to fetch judged cases');
      const data = await response.json();
      setCases(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJudgedCases(); }, []);

  const handleViewDecision = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedCase?.id) return;
    try {
      setConfirming(true);
      const response = await fetch(`${FABRIC_API}/case/confirm-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseID: selectedCase.id }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to confirm decision');
      }
      setSnackbar({ open: true, message: `Decision confirmed for case ${selectedCase.id} and forwarded to lawyer`, severity: 'success' });
      setOpenDialog(false);
      fetchJudgedCases();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setConfirming(false);
    }
  };

  const getDecisionColor = (decision) => {
    if (!decision) return 'default';
    const d = decision.toLowerCase();
    if (d.includes('approved') || d.includes('granted') || d.includes('favor')) return 'success';
    if (d.includes('rejected') || d.includes('dismissed') || d.includes('denied')) return 'error';
    return 'info';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Judge Decision Confirmation</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : cases.length === 0 ? (
        <Alert severity="info">No judged cases awaiting confirmation.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
                <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Title</TableCell>
                <TableCell sx={{ color: 'white' }}>Judge</TableCell>
                <TableCell sx={{ color: 'white' }}>Decision</TableCell>
                <TableCell sx={{ color: 'white' }}>Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.caseNumber || c.id}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.judgment?.judgeId || c.associatedJudge || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={c.judgment?.decision || 'Pending'} color={getDecisionColor(c.judgment?.decision)} size="small" icon={<GavelIcon />} />
                  </TableCell>
                  <TableCell>{c.judgment?.issuedAt ? new Date(c.judgment.issuedAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewDecision(c)} sx={{ color: '#4a90e2' }}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Decision Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Judge Decision Details
            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedCase.title}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Case ID:</strong> {selectedCase.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Case Number:</strong> {selectedCase.caseNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Type:</strong> {selectedCase.type || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Status:</strong> <Chip label={selectedCase.status} size="small" /></Typography>
              </Grid>

              {selectedCase.judgment && (
                <Grid item xs={12}>
                  <Card sx={{ mt: 2, bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <GavelIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Judgment
                      </Typography>
                      <Typography variant="body1"><strong>Decision:</strong>{' '}
                        <Chip label={selectedCase.judgment.decision} color={getDecisionColor(selectedCase.judgment.decision)} />
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}><strong>Reasoning:</strong> {selectedCase.judgment.reasoning || 'N/A'}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}><strong>Judge:</strong> {selectedCase.judgment.judgeId || 'N/A'}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}><strong>Issued:</strong> {selectedCase.judgment.issuedAt ? new Date(selectedCase.judgment.issuedAt).toLocaleString() : 'N/A'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {selectedCase.history?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Case History</Typography>
                  {selectedCase.history.map((h, i) => (
                    <Card key={i} sx={{ mt: 1 }}><CardContent>
                      <Typography variant="body2"><strong>{h.status}</strong> - {h.organization} ({new Date(h.timestamp).toLocaleString()})</Typography>
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
          <Button variant="contained" startIcon={confirming ? <CircularProgress size={20} /> : <CheckIcon />}
            onClick={handleConfirmDecision} disabled={confirming}
            sx={{ background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)', color: 'white' }}>
            {confirming ? 'Confirming...' : 'Confirm & Forward to Lawyer'}
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

export default JudgeDecisionConfirmation;
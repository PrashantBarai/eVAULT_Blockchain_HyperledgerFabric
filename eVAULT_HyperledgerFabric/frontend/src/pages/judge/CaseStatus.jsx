import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  Grid, CircularProgress, Snackbar, Alert, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, Gavel as GavelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateFormat';

const FABRIC_API = 'http://localhost:8000/api/judge';

const CaseStatus = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeCases, setActiveCases] = useState([]);
  const [judgedCases, setJudgedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Judgment dialog state
  const [openJudgmentDialog, setOpenJudgmentDialog] = useState(false);
  const [judgmentDecision, setJudgmentDecision] = useState('');
  const [judgmentReasoning, setJudgmentReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const [activeRes, judgedRes] = await Promise.all([
        fetch(`${FABRIC_API}/cases/active`),
        fetch(`${FABRIC_API}/cases/judged`),
      ]);
      if (activeRes.ok) {
        const d = await activeRes.json();
        setActiveCases(d.data || []);
      }
      if (judgedRes.ok) {
        const d = await judgedRes.json();
        setJudgedCases(d.data || []);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleOpenJudgment = (caseData) => {
    setSelectedCase(caseData);
    setJudgmentDecision('');
    setJudgmentReasoning('');
    setOpenJudgmentDialog(true);
  };

  const handleSubmitJudgment = async () => {
    const caseID = selectedCase?.id || selectedCase?.caseNumber;
    if (!caseID || !judgmentDecision || !judgmentReasoning) return;
    try {
      setSubmitting(true);
      const response = await fetch(`${FABRIC_API}/judgment/record-and-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseID,
          judgmentDetails: {
            decision: judgmentDecision,
            reasoning: judgmentReasoning,
            judgeId: 'JUDGE_DEFAULT',
          },
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to record judgment');
      }
      setSnackbar({ open: true, message: `Judgment recorded for case ${caseID} and synced to bench clerk & lawyer`, severity: 'success' });
      setOpenJudgmentDialog(false);
      setOpenDialog(false);
      fetchCases();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const s = status.toUpperCase();
    if (s.includes('RECEIVED') || s.includes('ACTIVE')) return 'info';
    if (s.includes('PENDING')) return 'warning';
    if (s.includes('JUDGMENT')) return 'success';
    if (s.includes('CONFIRMED') || s.includes('DECISION')) return 'primary';
    return 'default';
  };

  const currentCases = tabValue === 0 ? activeCases : judgedCases;

  const filteredCases = currentCases.filter((c) => {
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
      <Typography variant="h4" gutterBottom>Case Status & Judgments</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View your accepted cases and record judgments. Judgments are synced to bench clerk and lawyer automatically.
      </Typography>

      <TextField fullWidth variant="outlined" placeholder="Search cases..."
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 3 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}
          sx={{ '& .Mui-selected': { color: '#1a237e !important' }, '& .MuiTabs-indicator': { backgroundColor: '#1a237e' } }}>
          <Tab label={`Active Cases (${activeCases.length})`} />
          <Tab label={`Judged Cases (${judgedCases.length})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}><CircularProgress /></Box>
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
                    <Chip label={c.status || 'Active'} color={getStatusColor(c.status)} size="small" />
                  </TableCell>
                  <TableCell>{c.filedDate ? formatDate(c.filedDate) : 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewCase(c)} sx={{ color: '#1a237e' }}>
                      <VisibilityIcon />
                    </IconButton>
                    {tabValue === 0 && (
                      <Button variant="contained" size="small" startIcon={<GavelIcon />}
                        onClick={() => handleOpenJudgment(c)}
                        sx={{ ml: 1, background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)', color: 'white' }}>
                        Record Judgment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {tabValue === 0 ? 'No active cases. Accept cases from the Case Review page.' : 'No judged cases yet.'}
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
            <Typography variant="h6">Case Details</Typography>
            <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>{selectedCase.title || selectedCase.caseSubject}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Case Information</Typography>
                  <Typography variant="body2">Case ID: {selectedCase.id}</Typography>
                  <Typography variant="body2">Case Number: {selectedCase.caseNumber || 'N/A'}</Typography>
                  <Typography variant="body2">Type: {selectedCase.type || 'N/A'}</Typography>
                  <Typography variant="body2">Filed: {selectedCase.filedDate ? formatDate(selectedCase.filedDate) : 'N/A'}</Typography>
                  <Typography variant="body2">Client: {selectedCase.clientName || 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Status</Typography>
                  <Chip label={selectedCase.status || 'Active'} color={getStatusColor(selectedCase.status)} icon={<GavelIcon />} />
                  {selectedCase.judgment && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Judgment</Typography>
                      <Typography variant="body2"><strong>Decision:</strong> {selectedCase.judgment.decision}</Typography>
                      <Typography variant="body2"><strong>Reasoning:</strong> {selectedCase.judgment.reasoning}</Typography>
                      <Typography variant="body2"><strong>Date:</strong> {selectedCase.judgment.issuedAt ? formatDate(selectedCase.judgment.issuedAt) : 'N/A'}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              {selectedCase.description && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Description</Typography>
                    <Typography variant="body2">{selectedCase.description}</Typography>
                  </Paper>
                </Grid>
              )}
              {selectedCase.documents?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Documents ({selectedCase.documents.length})</Typography>
                  {selectedCase.documents.map((doc, i) => (
                    <Card key={i} sx={{ mt: 1 }}>
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          <strong>{doc.name}</strong> — {doc.type} {doc.validated ? '(Validated)' : ''}
                        </Typography>
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
                </Grid>
              )}
              {selectedCase.history?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>History</Typography>
                  {selectedCase.history.map((h, i) => (
                    <Card key={i} sx={{ mt: 1 }}><CardContent>
                      <Typography variant="body2"><strong>{h.status}</strong> — {h.organization} ({formatDate(h.timestamp)})</Typography>
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
          {selectedCase && !selectedCase.judgment && (
            <Button variant="contained" startIcon={<GavelIcon />}
              onClick={() => { setOpenDialog(false); handleOpenJudgment(selectedCase); }}
              sx={{ background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)', color: 'white' }}>
              Record Judgment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Record Judgment Dialog */}
      <Dialog open={openJudgmentDialog} onClose={() => !submitting && setOpenJudgmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Judgment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Case: <strong>{selectedCase?.title || selectedCase?.id}</strong>
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            The judgment will be recorded on the blockchain and automatically synced to the bench clerk and lawyer.
          </Alert>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Decision</InputLabel>
            <Select value={judgmentDecision} label="Decision" onChange={(e) => setJudgmentDecision(e.target.value)}>
              <MenuItem value="CASE_APPROVED">Case Approved / Granted</MenuItem>
              <MenuItem value="CASE_DISMISSED">Case Dismissed</MenuItem>
              <MenuItem value="CASE_SETTLED">Case Settled</MenuItem>
              <MenuItem value="RULING_IN_FAVOR_PLAINTIFF">Ruling in Favor of Plaintiff</MenuItem>
              <MenuItem value="RULING_IN_FAVOR_DEFENDANT">Ruling in Favor of Defendant</MenuItem>
              <MenuItem value="CASE_TRANSFERRED">Case Transferred</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={4} label="Reasoning / Comments"
            value={judgmentReasoning} onChange={(e) => setJudgmentReasoning(e.target.value)}
            placeholder="Enter reasoning for this judgment..." disabled={submitting} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJudgmentDialog(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitJudgment}
            disabled={!judgmentDecision || !judgmentReasoning || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <GavelIcon />}
            sx={{ background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)', color: 'white' }}>
            {submitting ? 'Recording...' : 'Submit Judgment'}
          </Button>
        </DialogActions>
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

export default CaseStatus;
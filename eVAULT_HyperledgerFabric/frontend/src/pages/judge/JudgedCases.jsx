import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
    Grid, CircularProgress, Snackbar, Alert, Card, CardContent, Divider,
} from '@mui/material';
import {
    Search as SearchIcon, Close as CloseIcon, Gavel as GavelIcon,
    Visibility as VisibilityIcon, Description as DescriptionIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateFormat';

const FABRIC_API = 'http://localhost:8000/api/judge';
const IPFS_GATEWAY = 'https://lime-occasional-xerinae-665.mypinata.cloud/ipfs/';

const JudgedCases = () => {
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchJudgedCases = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${FABRIC_API}/cases/judged`);
            if (response.ok) {
                const data = await response.json();
                setCases(data.data || []);
            }
        } catch (err) {
            setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJudgedCases(); }, []);

    const handleViewCase = (caseData) => {
        setSelectedCase(caseData);
        setOpenDialog(true);
    };

    const getDecisionColor = (decision) => {
        if (!decision) return 'default';
        const d = decision.toUpperCase();
        if (d.includes('APPROVED') || d.includes('GRANTED') || d.includes('FAVOR_PLAINTIFF')) return 'success';
        if (d.includes('DISMISSED')) return 'error';
        if (d.includes('SETTLED')) return 'info';
        if (d.includes('TRANSFERRED')) return 'warning';
        return 'primary';
    };

    const filteredCases = cases.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
            c.id?.toLowerCase().includes(q) ||
            c.title?.toLowerCase().includes(q) ||
            c.caseNumber?.toLowerCase().includes(q) ||
            c.type?.toLowerCase().includes(q) ||
            c.judgment?.decision?.toLowerCase().includes(q)
        );
    });

    return (
        <Box sx={{ p: 3 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 3, mb: 4,
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    color: 'white', borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GavelIcon sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h4" gutterBottom>Judged Cases</Typography>
                        <Typography variant="subtitle1">
                            View all cases where judgment has been recorded, with full evidence and decision details.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <TextField fullWidth variant="outlined" placeholder="Search by case ID, title, type, or decision..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />

            {loading ? (
                <Box display="flex" justifyContent="center" sx={{ my: 4 }}><CircularProgress /></Box>
            ) : filteredCases.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <GavelIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No judged cases found</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cases will appear here once judgments are recorded.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Case ID</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Decision</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Judgment Date</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documents</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCases.map((c) => (
                                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewCase(c)}>
                                    <TableCell>{c.caseNumber || c.id}</TableCell>
                                    <TableCell>{c.title || c.caseSubject}</TableCell>
                                    <TableCell>{c.type || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={c.judgment?.decision || c.status || 'Judged'}
                                            color={getDecisionColor(c.judgment?.decision || c.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {c.judgment?.issuedAt ? formatDate(c.judgment.issuedAt) : (c.judgment?.date ? formatDate(c.judgment.date) : 'N/A')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={<DescriptionIcon />}
                                            label={`${c.documents?.length || 0} docs`}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={(e) => { e.stopPropagation(); handleViewCase(c); }}
                                            sx={{
                                                background: 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)',
                                                color: 'white',
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Case Details Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GavelIcon color="success" />
                            <Typography variant="h6">Judged Case Details</Typography>
                        </Box>
                        <IconButton onClick={() => setOpenDialog(false)}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedCase && (
                        <Grid container spacing={3}>
                            {/* Case Information */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            Case Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Case ID:</strong> {selectedCase.id}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Case Number:</strong> {selectedCase.caseNumber || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Title:</strong> {selectedCase.title || selectedCase.caseSubject}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Type:</strong> {selectedCase.type || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Filed Date:</strong> {selectedCase.filedDate ? formatDate(selectedCase.filedDate) : 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Client:</strong> {selectedCase.clientName || 'N/A'}
                                        </Typography>
                                        {selectedCase.description && (
                                            <Typography variant="body2" sx={{ mt: 2 }}>
                                                <strong>Description:</strong> {selectedCase.description}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Judgment Details */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ height: '100%', bgcolor: '#e8f5e9' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ color: '#1b5e20' }}>
                                            <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Judgment Details
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        {selectedCase.judgment ? (
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Decision:</strong>{' '}
                                                    <Chip
                                                        label={selectedCase.judgment.decision}
                                                        color={getDecisionColor(selectedCase.judgment.decision)}
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Reasoning:</strong> {selectedCase.judgment.reasoning}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Judge ID:</strong> {selectedCase.judgment.judgeId || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Issued At:</strong>{' '}
                                                    {selectedCase.judgment.issuedAt
                                                        ? formatDate(selectedCase.judgment.issuedAt)
                                                        : selectedCase.judgment.date
                                                            ? formatDate(selectedCase.judgment.date)
                                                            : 'N/A'}
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography color="text.secondary">No judgment details available</Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Evidence / Documents */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Evidence & Documents ({selectedCase.documents?.length || 0})
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        {selectedCase.documents?.length > 0 ? (
                                            <Grid container spacing={2}>
                                                {selectedCase.documents.map((doc, i) => (
                                                    <Grid item xs={12} sm={6} md={4} key={i}>
                                                        <Card variant="outlined" sx={{ p: 2 }}>
                                                            <Typography variant="subtitle2" noWrap>
                                                                {doc.name || `Document ${i + 1}`}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                Type: {doc.type || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                Status: {doc.validated ? '✅ Validated' : '⏳ Pending'}
                                                            </Typography>
                                                            {doc.uploadedAt && (
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Uploaded: {formatDate(doc.uploadedAt)}
                                                                </Typography>
                                                            )}
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ mt: 1 }}
                                                                fullWidth
                                                                onClick={() => window.open(`${IPFS_GATEWAY}${doc.hash || doc.id}`, '_blank')}
                                                            >
                                                                View Document
                                                            </Button>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : (
                                            <Typography color="text.secondary">No documents attached to this case.</Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Case History / Timeline */}
                            {selectedCase.history?.length > 0 && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="primary">
                                                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                Case Timeline
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                            {selectedCase.history.map((h, i) => (
                                                <Paper key={i} sx={{ p: 2, mb: 1, bgcolor: '#fafafa', borderLeft: '4px solid #1b5e20' }}>
                                                    <Typography variant="body2">
                                                        <strong>{h.status}</strong> — {h.organization}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {h.timestamp ? formatDate(h.timestamp) : 'N/A'}
                                                    </Typography>
                                                    {h.comments && (
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                            {h.comments}
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
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

export default JudgedCases;

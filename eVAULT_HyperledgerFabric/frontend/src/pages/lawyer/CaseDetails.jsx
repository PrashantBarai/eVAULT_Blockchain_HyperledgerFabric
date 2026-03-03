import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useParams } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import GavelIcon from '@mui/icons-material/Gavel';
import UpdateIcon from '@mui/icons-material/Update';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';
import { getUserData, getAuthToken } from '../../utils/auth';
import { formatDate, DATE_FORMAT_LABEL } from '../../utils/dateFormat';

const CaseDetails = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFollowUpDialog, setOpenFollowUpDialog] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpType, setFollowUpType] = useState('');
  const [followUpDescription, setFollowUpDescription] = useState('');
  const [followUpPartyDetails, setFollowUpPartyDetails] = useState('');
  const [followUpFiles, setFollowUpFiles] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  // New state for local follow-up data before submission
  const [pendingFollowUp, setPendingFollowUp] = useState(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  console.log(id);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        // Fetch case details from blockchain - API now aggregates from multiple channels
        const response = await axios.get(`http://localhost:8000/api/lawyer/case/${id}`);
        console.log('Case details response:', response.data);
        // Backend returns { success, data } where data is the aggregated case object
        setCaseData(response.data.data || response.data.case || response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch case details');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);


  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // Handle closing the confirmation dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle sending the case to the registrar (initial OR follow-up)
  const handleSendToRegistrar = async () => {
    try {
      const user = getUserData();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (pendingFollowUp) {
        // --- FOLLOW-UP SUBMISSION FLOW ---
        const response = await axios.post(
          'http://localhost:8000/api/lawyer/case/follow-up',
          {
            caseID: id,
            reason: pendingFollowUp.fullReason,
            documents: pendingFollowUp.documentsMeta
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Follow-up submission failed');
        }

        alert('Follow-up submitted successfully! The case has been routed back to the Registrar.');
        setCaseData(prev => ({
          ...prev,
          status: 'FOLLOW_UP_SUBMITTED',
          currentOrg: 'RegistrarsOrg'
        }));
        setPendingFollowUp(null); // Clear pending state
      } else {
        // --- INITIAL SUBMISSION FLOW ---
        // Step 1: FIRST commit to blockchain (source of truth)
        const blockchainResponse = await axios.post(
          'http://localhost:8000/api/lawyer/case/submit',
          { caseID: id },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (!blockchainResponse.data.success) {
          throw new Error(blockchainResponse.data.message || 'Failed to submit case on blockchain');
        }

        console.log('Blockchain submit successful:', blockchainResponse.data);

        // Step 2: ONLY after blockchain success, assign case to registrar in MongoDB
        let assignedRegistrarName = 'Registrar';
        try {
          const assignResponse = await axios.post(
            'http://localhost:3000/assign-case-to-registrar',
            {
              caseID: id,
              caseSubject: caseData.caseSubject || caseData.title || caseData.case_subject,
              lawyerEmail: user.email
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          if (assignResponse.data.success) {
            assignedRegistrarName = assignResponse.data.assigned_registrar_name || 'Registrar';
            console.log('Case assigned to registrar in MongoDB:', assignResponse.data);
          }
        } catch (assignErr) {
          console.warn('MongoDB registrar assignment failed (non-critical):', assignErr.message);
        }

        alert(`Case successfully submitted to ${assignedRegistrarName} for registrar review.`);
        setCaseData(prev => ({
          ...prev,
          status: 'PENDING_REGISTRAR_REVIEW',
          currentOrg: 'RegistrarsOrg'
        }));
      }
    } catch (err) {
      console.error('Error sending case to registrar:', err);
      alert(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to send case to registrar. Please try again.');
    } finally {
      handleCloseDialog();
    }
  };

  // Follow-up button only activates when a judge decision exists on the case
  const hasJudgeDecision = caseData && caseData.judgment && caseData.judgment.decision;

  // Handle follow-up format locally (don't submit yet)
  const handleFollowUpSubmit = () => {
    if (!followUpReason.trim()) {
      setFollowUpError('Please provide a reason for follow-up.');
      return;
    }
    if (!followUpType) {
      setFollowUpError('Please select a follow-up type.');
      return;
    }

    // Build document metadata from files for local display
    const documentsMeta = followUpFiles.map((file, idx) => ({
      id: `FOLLOWUP_DOC_${Date.now()}_${idx}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      hash: '',
      validated: false,
      uploadedAt: new Date().toISOString(),
      fileObject: file // keep the file object for later pinning if needed
    }));

    const fullReason = [
      `[${followUpType}]`,
      followUpReason,
      followUpPartyDetails ? `Party Details: ${followUpPartyDetails}` : '',
      followUpDescription ? `Updated Description: ${followUpDescription}` : '',
    ].filter(Boolean).join(' | ');

    // Save locally
    setPendingFollowUp({
      fullReason,
      documentsMeta,
      displayReason: followUpReason,
      displayType: followUpType
    });

    setOpenFollowUpDialog(false);
    // Note: Don't clear the form fields yet so user can edit if they want to cancel and redo
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!caseData) {
    return <Typography>Case not found</Typography>;
  }

  // Format the data for display - support both MongoDB and blockchain field names
  const formattedCaseData = {
    id: caseData.id || caseData._id,
    title: caseData.title || caseData.caseSubject || caseData.case_subject,
    status: caseData.status,
    filedDate: formatDate(caseData.filedDate || caseData.filed_date),
    nextHearing: caseData.hearings && caseData.hearings.length > 0
      ? formatDate(caseData.hearings[caseData.hearings.length - 1].date)
      : 'Not scheduled',
    type: caseData.type || caseData.case_type || 'General',
    description: caseData.description || caseData.case_subject || '',
    plaintiff: caseData.uidParty1 || caseData.uid_party1,
    defendant: caseData.uidParty2 || caseData.uid_party2,
    judge: caseData.associatedJudge || caseData.associated_judge,
    lawyer: caseData.associatedLawyers || caseData.associated_lawyers,
    documents: (caseData.documents || []).map((doc, index) => ({
      name: doc.name || `Document ${index + 1}`,
      date: doc.uploadedAt ? formatDate(doc.uploadedAt) : formatDate(new Date()),
      cid: doc.hash || doc.id,
      type: doc.type || 'Unknown',
    })),
    // Build timeline from blockchain history and MongoDB timeline
    timeline: (() => {
      const events = [];

      // Map status to human-readable event names (defined once for reuse)
      const statusEventMap = {
        'SUBMITTED_TO_REGISTRAR': 'Submitted to Registrar',
        'RECEIVED_FROM_LAWYER': 'Received by Registrar',
        'PENDING_REGISTRAR_REVIEW': 'Pending Registrar Review',
        'VERIFIED_BY_REGISTRAR': 'Verified by Registrar',
        'FORWARDED_TO_STAMP_REPORTER': 'Forwarded to Stamp Reporter',
        'TRANSFERRED_TO_STAMPREPORTER': 'Transferred to Stamp Reporter',
        'ASSIGNED_TO_STAMP_REPORTER': 'Assigned to Stamp Reporter',
        'PENDING_STAMP_REPORTER_REVIEW': 'Pending Stamp Reporter Review',
        'VALIDATED_BY_STAMP_REPORTER': 'Validated by Stamp Reporter',
        'FORWARDED_TO_BENCH_CLERK': 'Forwarded to Bench Clerk',
        'FORWARDED_TO_BENCHCLERK': 'Forwarded to Bench Clerk',
        'PENDING_BENCH_CLERK_REVIEW': 'Pending Bench Clerk Review',
        'FORWARDED_TO_JUDGE': 'Forwarded to Judge',
        'PENDING_JUDGMENT': 'Pending Judgment',
        'CASE_CLOSED': 'Case Closed',
      };

      // Add filed date as first event
      events.push({
        date: formatDate(caseData.createdAt || caseData.filedDate || caseData.filed_date),
        event: 'Case Created At',
        description: 'Initial case documents filed on LawLedger',
      });

      // Add events from blockchain history if available
      if (caseData.history && Array.isArray(caseData.history)) {
        caseData.history.forEach((entry) => {
          const eventName = statusEventMap[entry.status] || entry.status;
          const eventDate = entry.timestamp
            ? formatDate(entry.timestamp)
            : formatDate(new Date());

          events.push({
            date: eventDate,
            event: eventName,
            description: entry.comment || `Status updated by ${entry.updatedBy || entry.organization || 'System'}`,
          });
        });
      }

      // Sort events by date
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

      return events;
    })(),
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(145deg, #6B5ECD11 0%, #8B7CF711 100%)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              {formattedCaseData.title}
            </Typography>
            <Chip
              label={formattedCaseData.status}
              color={formattedCaseData.status === 'In Progress' ? 'primary' : 'success'}
              sx={{
                background: 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)',
                color: 'white',
              }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Filed Date
                </Typography>
                <Typography variant="body1">{formattedCaseData.filedDate}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Case Type
                </Typography>
                <Typography variant="body1">{formattedCaseData.type}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Case Number
                </Typography>
                <Typography variant="body1">{caseData.caseNumber || caseData.case_number}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Plaintiff
                </Typography>
                <Typography variant="body1">{formattedCaseData.plaintiff}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Defendant
                </Typography>
                <Typography variant="body1">{formattedCaseData.defendant}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Client Name
                </Typography>
                <Typography variant="body1">{caseData.clientName || 'N/A'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Next Hearing
                </Typography>
                <Typography variant="body1">{formattedCaseData.nextHearing}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Judge
                </Typography>
                <Typography variant="body1">{formattedCaseData.judge || 'Not assigned'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Lawyer
                </Typography>
                <Typography variant="body1">{Array.isArray(formattedCaseData.lawyer) ? formattedCaseData.lawyer.join(', ') : formattedCaseData.lawyer}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1">{caseData.department || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body1">{caseData.createdBy || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Created At
                </Typography>
                <Typography variant="body1">
                  {caseData.createdAt
                    ? formatDate(caseData.createdAt)
                    : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <UpdateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Last Modified
                </Typography>
                <Typography variant="body1">
                  {caseData.lastModified
                    ? formatDate(caseData.lastModified)
                    : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1">{formattedCaseData.description || 'No description provided'}</Typography>
              </Box>
            </Grid>
            {caseData.judgment && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="text.primary">
                      <GavelIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#6B5ECD' }} />
                      Judge's Decision
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                      {caseData.judgment.decision?.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      {caseData.judgment.reasoning}
                    </Typography>
                    {caseData.judgment.issuedAt && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 2 }} color="text.secondary">
                        Issued on: {formatDate(caseData.judgment.issuedAt)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Dynamic Follow-Up Summary Section */}
          {pendingFollowUp && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0', border: '1px solid #ffcc80' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="#e65100">
                      <ReplayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Pending Follow-Up (Not Submitted Yet)
                    </Typography>
                    <IconButton size="small" onClick={() => setPendingFollowUp(null)} title="Cancel Follow-Up">
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {pendingFollowUp.displayType?.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Reason:</strong> {pendingFollowUp.displayReason}
                  </Typography>
                  {pendingFollowUp.documentsMeta?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">New Documents to Upload:</Typography>
                      <List dense>
                        {pendingFollowUp.documentsMeta.map((doc, idx) => (
                          <ListItem key={idx} sx={{ p: 0 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}><DescriptionIcon fontSize="small" color="primary" /></ListItemIcon>
                            <ListItemText primary={doc.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* "Send to Registrar" Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            {/* The main action button handles both initial submission and follow-up submission */}
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              disabled={!((caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg') || pendingFollowUp)}
              sx={{
                background: pendingFollowUp
                  ? 'linear-gradient(45deg, #FF6B35 30%, #FF8E53 90%)' // Orange for follow-up submit
                  : caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                    ? 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)' // Purple for initial submit
                    : '#9e9e9e',
                color: 'white',
                '&:hover': {
                  background: pendingFollowUp
                    ? 'linear-gradient(45deg, #E55A2B 30%, #E57D43 90%)'
                    : caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                      ? 'linear-gradient(45deg, #5A4CAD 30%, #7B6CE7 90%)'
                      : '#9e9e9e',
                },
                '&.Mui-disabled': {
                  color: 'white',
                  background: '#9e9e9e',
                },
              }}
            >
              {pendingFollowUp
                ? 'Submit Follow-Up to Registrar'
                : caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                  ? 'Send to Registrar'
                  : 'Already Forwarded'}
            </Button>

            {/* Follow Up button just opens the dialog to prepare locally */}
            {hasJudgeDecision && !pendingFollowUp && (
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={() => setOpenFollowUpDialog(true)}
                sx={{
                  ml: 2,
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  '&:hover': {
                    borderColor: '#E55A2B',
                    bgcolor: 'rgba(255, 107, 53, 0.04)',
                  },
                }}
              >
                Prepare Follow-Up
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to send this case to the registrar? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSendToRegistrar} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow Up Dialog */}
      <Dialog
        open={openFollowUpDialog}
        onClose={() => !followUpLoading && setOpenFollowUpDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ background: 'linear-gradient(45deg, #FF6B35 30%, #FF8E53 90%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReplayIcon />
            Case Follow-Up Submission
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {followUpError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {followUpError}
            </Alert>
          )}

          {/* Show previous judgment reference */}
          {caseData?.judgment && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Previous Judgment:</Typography>
              <Typography variant="body2">
                <strong>Decision:</strong> {caseData.judgment.decision?.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2">
                <strong>Reasoning:</strong> {caseData.judgment.reasoning}
              </Typography>
              {caseData.judgment.issuedAt && (
                <Typography variant="caption">Issued: {formatDate(caseData.judgment.issuedAt)}</Typography>
              )}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Follow-Up Type */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Follow-Up Type</InputLabel>
                <Select
                  value={followUpType}
                  label="Follow-Up Type"
                  onChange={(e) => setFollowUpType(e.target.value)}
                  disabled={followUpLoading}
                >
                  <MenuItem value="APPEAL">Appeal</MenuItem>
                  <MenuItem value="REVIEW_PETITION">Review Petition</MenuItem>
                  <MenuItem value="NEW_EVIDENCE">New Evidence Submission</MenuItem>
                  <MenuItem value="CLARIFICATION">Clarification Request</MenuItem>
                  <MenuItem value="MODIFICATION">Order Modification</MenuItem>
                  <MenuItem value="COMPLIANCE_REPORT">Compliance Report</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <TextField
                required
                label="Reason for Follow-Up"
                fullWidth
                multiline
                rows={3}
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
                disabled={followUpLoading}
                placeholder="Provide a detailed reason for this follow-up..."
              />
            </Grid>

            {/* Updated Case Description */}
            <Grid item xs={12}>
              <TextField
                label="Updated Case Description (if applicable)"
                fullWidth
                multiline
                rows={3}
                value={followUpDescription}
                onChange={(e) => setFollowUpDescription(e.target.value)}
                disabled={followUpLoading}
                placeholder="Update the case description with new facts or circumstances..."
              />
            </Grid>

            {/* Party Details */}
            <Grid item xs={12}>
              <TextField
                label="Party Details / Additional Parties"
                fullWidth
                multiline
                rows={2}
                value={followUpPartyDetails}
                onChange={(e) => setFollowUpPartyDetails(e.target.value)}
                disabled={followUpLoading}
                placeholder="Any changes to involved parties, new witnesses, etc."
              />
            </Grid>

            {/* File Upload */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>New Evidence / Documents</Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={followUpLoading}
                fullWidth
                sx={{ py: 1.5, borderStyle: 'dashed' }}
              >
                Click to Upload Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => setFollowUpFiles(prev => [...prev, ...Array.from(e.target.files)])}
                />
              </Button>
              {followUpFiles.length > 0 && (
                <List dense sx={{ mt: 1 }}>
                  {followUpFiles.map((file, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            edge="end"
                            size="small"
                            color="primary"
                            onClick={() => {
                              const url = URL.createObjectURL(file);
                              window.open(url, '_blank');
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => setFollowUpFiles(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenFollowUpDialog(false)} disabled={followUpLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleFollowUpSubmit}
            variant="contained"
            disabled={!followUpReason.trim() || !followUpType || followUpLoading}
            endIcon={followUpLoading && <CircularProgress size={20} />}
            sx={{
              background: 'linear-gradient(45deg, #FF6B35 30%, #FF8E53 90%)',
              color: 'white',
            }}
          >
            {followUpLoading ? 'Submitting...' : 'Submit Follow-Up'}
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {formattedCaseData.documents.map((doc, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid #eee',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{doc.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.date}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`https://lime-occasional-xerinae-665.mypinata.cloud/ipfs/${doc.cid}`, '_blank')}
                  >
                    View
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <UpdateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {formattedCaseData.timeline
                  .slice(0, timelineExpanded ? undefined : 4) // Show 4 items max when collapsed
                  .map((item, index) => (
                    <ListItem
                      key={index}
                      alignItems="flex-start"
                      sx={{
                        mb: 1,
                        borderLeft: '3px solid #6B5ECD',
                        bgcolor: '#f9f9f9',
                        borderRadius: '0 4px 4px 0'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {item.event}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.date}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
              </List>

              {formattedCaseData.timeline.length > 4 && (
                <Button
                  size="small"
                  fullWidth
                  onClick={() => setTimelineExpanded(!timelineExpanded)}
                  sx={{ mt: 1, color: '#6B5ECD' }}
                >
                  {timelineExpanded ? 'Show Less' : `Show All (${formattedCaseData.timeline.length})`}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CaseDetails;
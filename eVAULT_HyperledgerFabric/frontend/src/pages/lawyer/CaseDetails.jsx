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
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
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

  // Handle sending the case to the registrar
  const handleSendToRegistrar = async () => {
    try {
      const user = getUserData();

      if (!user) {
        throw new Error('Authentication required');
      }

      // Step 1: FIRST commit to blockchain (source of truth)
      // Blockchain must succeed before any MongoDB writes
      const blockchainResponse = await axios.post(
        'http://localhost:8000/api/lawyer/case/submit',
        { caseID: id },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
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
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (assignResponse.data.success) {
          assignedRegistrarName = assignResponse.data.assigned_registrar_name || 'Registrar';
          console.log('Case assigned to registrar in MongoDB:', assignResponse.data);
        }
      } catch (assignErr) {
        // MongoDB assignment failed but blockchain already committed - log but don't fail
        console.warn('MongoDB registrar assignment failed (non-critical):', assignErr.message);
        // Blockchain is source of truth - case IS submitted regardless of MongoDB
      }

      alert(`Case successfully submitted to ${assignedRegistrarName} for registrar review.`);
      // Update the case data to reflect the new status
      setCaseData(prev => ({
        ...prev,
        status: 'PENDING_REGISTRAR_REVIEW',
        currentOrg: 'RegistrarsOrg'
      }));
    } catch (err) {
      console.error('Error sending case to registrar:', err);
      alert(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to send case to registrar. Please try again.');
    } finally {
      handleCloseDialog();
    }
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

          {/* "Send to Registrar" Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              disabled={caseData.status !== 'CREATED' || caseData.currentOrg !== 'LawyersOrg'}
              sx={{
                background: caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                  ? 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)'
                  : '#9e9e9e',
                color: 'white',
                '&:hover': {
                  background: caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                    ? 'linear-gradient(45deg, #5A4CAD 30%, #7B6CE7 90%)'
                    : '#9e9e9e',
                },
                '&.Mui-disabled': {
                  color: 'white',
                  background: '#9e9e9e',
                },
              }}
            >
              {caseData.status === 'CREATED' && caseData.currentOrg === 'LawyersOrg'
                ? 'Send to Registrar'
                : 'Already Forwarded'}
            </Button>
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
              <Timeline>
                {formattedCaseData.timeline.map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {index < formattedCaseData.timeline.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2">{item.event}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.date}
                      </Typography>
                      <Typography variant="body2">{item.description}</Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CaseDetails;
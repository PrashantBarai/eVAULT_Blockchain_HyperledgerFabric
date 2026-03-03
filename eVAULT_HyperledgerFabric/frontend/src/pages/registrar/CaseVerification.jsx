import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken, getUserData } from '../../utils/auth';

const departments = [
  { id: 'civil', name: 'Civil Department' },
  { id: 'corporate', name: 'Corporate Department' },
  { id: 'family', name: 'Family Court Department' },
  { id: 'criminal', name: 'Criminal Law Department' },
  { id: 'property', name: 'Property Law Department' },
  { id: 'labor', name: 'Labor Department' },
];

const CaseVerification = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        // Fetch case details from blockchain API
        const response = await axios.get(`http://localhost:8000/api/registrar/case/${id}`);

        if (response.data && response.data.data) {
          // Map blockchain fields to display fields
          const blockchainCase = response.data.data;
          setCaseDetails({
            case_subject: blockchainCase.caseSubject || blockchainCase.title,
            case_type: blockchainCase.type,
            associated_lawyers: blockchainCase.associatedLawyers?.join(', ') || blockchainCase.createdBy,
            description: blockchainCase.description,
            status: blockchainCase.status,
            clientName: blockchainCase.clientName,
            uidParty1: blockchainCase.uidParty1,
            uidParty2: blockchainCase.uidParty2,
            createdAt: blockchainCase.createdAt,
            documents: blockchainCase.documents || []
          });
        } else {
          throw new Error('Case details not found.');
        }
      } catch (err) {
        console.error('Error fetching case details:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!selectedDepartment) {
      setError('Please select a department before forwarding.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let messages = [];
    let assignedStampReporterName = '';

    try {
      const user = getUserData();

      // Step 1: BLOCKCHAIN FIRST (source of truth)
      // Call verify-and-forward which does ALL blockchain operations sequentially:
      // 1. VerifyCase on lawyer-registrar-channel (marks as VERIFIED_BY_REGISTRAR)
      // 2. StoreCase on registrar-stampreporter-channel (cross-channel transfer)
      // 3. Update lawyer namespace on lawyer-registrar-channel (so lawyer dashboard sees update)
      // 4. MongoDB update (handled by backend after blockchain success)
      try {
        const forwardResponse = await axios.post(
          'http://localhost:8000/api/registrar/case/verify-and-forward',
          {
            caseID: id,
            department: selectedDepartment,
            verificationDetails: {
              isVerified: true,
              verifiedBy: user?.username || 'Registrar',
              verifiedAt: new Date().toISOString(),
              department: selectedDepartment,
              comment: `Case verified and forwarded to ${selectedDepartment} department`,
              registrarEmail: user?.email || '',
              registrarId: user?.licenseId || ''
            }
          }
        );

        if (forwardResponse.data.success) {
          messages.push('✓ Case verified and forwarded on blockchain');
          console.log('Case verified and forwarded:', forwardResponse.data);
        } else {
          throw new Error(forwardResponse.data.message || 'Failed to verify and forward case');
        }
      } catch (forwardErr) {
        console.error('Verify and forward failed:', forwardErr.message);
        throw new Error(`Failed to forward case on blockchain: ${forwardErr.response?.data?.message || forwardErr.message}`);
      }

      // Step 2: ONLY after blockchain success - assign case to stamp reporter in MongoDB
      try {
        const assignResponse = await axios.post(
          'http://localhost:3000/assign-case-to-stampreporter',
          {
            caseID: id,
            caseSubject: caseDetails.case_subject,
            registrarEmail: user?.email || '',
            department: selectedDepartment
          }
        );

        if (assignResponse.data.success) {
          assignedStampReporterName = assignResponse.data.assigned_stampreporter_name || 'Stamp Reporter';
          messages.push(`✓ Case assigned to: ${assignedStampReporterName}`);
        }
      } catch (assignErr) {
        console.warn('MongoDB stamp reporter assignment failed (non-critical):', assignErr.message);
        // Blockchain is source of truth - case IS forwarded regardless of MongoDB
      }

      // Step 3: Notify the lawyer about case status update
      try {
        const notifyResponse = await axios.post(
          'http://localhost:3000/notify-lawyer',
          {
            caseID: id,
            caseSubject: caseDetails.case_subject,
            lawyerEmail: caseDetails.associated_lawyers,
            status: 'FORWARDED_TO_STAMP_REPORTER',
            message: `Your case has been verified by Registrar and forwarded to ${assignedStampReporterName || 'Stamp Reporter'} (${selectedDepartment} department) for stamp verification.`,
            updatedBy: user?.username || 'Registrar'
          }
        );

        if (notifyResponse.data.success) {
          messages.push('✓ Lawyer notified about case status');
        }
      } catch (notifyErr) {
        console.warn('Lawyer notification failed:', notifyErr.message);
      }

      // NOTE: MongoDB timeline update is handled by the backend registrarController
      // after blockchain success. No duplicate write here.

      setOpenApproveDialog(false);
      setSuccessMessage(messages.join('\n'));
      setShowSuccess(true);

      // Show alert with assigned stamp reporter name (like lawyer does)
      alert(`Case successfully verified and assigned to ${assignedStampReporterName} for stamp verification.`);

      setTimeout(() => {
        navigate('/registrar/dashboard');
      }, 3000);
    } catch (err) {
      console.error('API Error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress /> {/* Use CircularProgress here */}
      </Box>
    );
  }

  if (error && !caseDetails) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Case Successfully Forwarded to Stamp Reporter!
          </Typography>
          {successMessage}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to dashboard...
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>Case Verification</Typography>
        <Typography variant="subtitle1">Case ID: {id}</Typography>
      </Paper>

      {caseDetails && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Case Details</Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Case Title</Typography>
            <Typography variant="body1">{caseDetails.case_subject}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Case Type</Typography>
            <Typography variant="body1">{caseDetails.case_type}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Lawyer Information</Typography>
            <Typography variant="body1">{caseDetails.associated_lawyers}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Parties Involved</Typography>
            <Typography variant="body2">Party 1: {caseDetails.uidParty1}</Typography>
            <Typography variant="body2">Party 2: {caseDetails.uidParty2}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Case Summary</Typography>
            <Typography variant="body1">{caseDetails.description || 'No description provided'}</Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            As a Registrar, your role is to assign the appropriate department and forward the case to Stamp Reporter for verification.
          </Alert>

          {/* Check if case is already forwarded/verified */}
          {caseDetails.status && (
            caseDetails.status.includes('VERIFIED') ||
            caseDetails.status.includes('FORWARDED') ||
            caseDetails.status.includes('STAMP_REPORTER') ||
            caseDetails.status.includes('TRANSFERRED')
          ) ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              This case has already been processed (Status: {caseDetails.status}). No further action required.
            </Alert>
          ) : null}

          <Box sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            mt: 4,
          }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={() => setOpenApproveDialog(true)}
              disabled={
                caseDetails.status && (
                  caseDetails.status.includes('VERIFIED') ||
                  caseDetails.status.includes('FORWARDED') ||
                  caseDetails.status.includes('STAMP_REPORTER') ||
                  caseDetails.status.includes('TRANSFERRED')
                )
              }
            >
              {caseDetails.status && (
                caseDetails.status.includes('VERIFIED') ||
                caseDetails.status.includes('FORWARDED') ||
                caseDetails.status.includes('STAMP_REPORTER') ||
                caseDetails.status.includes('TRANSFERRED')
              ) ? 'Already Forwarded' : 'Assign Department & Forward'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Approve Dialog */}
      <Dialog
        open={openApproveDialog}
        onClose={() => setOpenApproveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Department & Forward to Stamp Reporter</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Select the appropriate department for this case. After assignment, the case will be automatically forwarded to a Stamp Reporter for document verification.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Select Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            color="success"
            variant="contained"
            disabled={!selectedDepartment || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Forward'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseVerification;
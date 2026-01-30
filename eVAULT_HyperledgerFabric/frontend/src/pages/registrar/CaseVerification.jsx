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
    if (!selectedDepartment) return;
    
    setIsSubmitting(true);
    setError(null);
    let messages = [];
    
    try {
      const user = getUserData();
      
      // Single Step: Call FetchAndStoreCaseFromLawyerChannel which handles everything:
      // - Reads case from lawyer-registrar-channel
      // - Verifies and updates status to TRANSFERRED_TO_STAMPREPORTER on source channel
      // - Stores case on registrar-stampreporter-channel with status VERIFIED_BY_REGISTRAR
      // - Syncs to stampreporter chaincode via StoreCase
      // - Assigns to stamp reporter (status → PENDING_STAMP_REPORTER_REVIEW)
      try {
        const forwardResponse = await axios.post(
          'http://localhost:8000/api/registrar/case/forward-to-stampreporter',
          {
            caseID: id,
            department: selectedDepartment
          }
        );

        if (forwardResponse.data.success) {
          messages.push('✓ Case verified and forwarded to stamp reporter channel');
          console.log('Case forwarded to stamp reporter channel:', forwardResponse.data);
        } else {
          throw new Error(forwardResponse.data.message || 'Failed to forward case');
        }
      } catch (forwardErr) {
        console.error('Cross-channel forward failed:', forwardErr.message);
        throw new Error(`Failed to forward case: ${forwardErr.response?.data?.message || forwardErr.message}`);
      }

      // Step 2: Assign case to a stamp reporter in MongoDB (queue-based allocation)
      // This happens after blockchain operations to ensure consistency
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
          messages.push(`✓ Case assigned to stamp reporter: ${assignResponse.data.stampreporter_email || 'Success'}`);
          console.log('Case assigned to stamp reporter:', assignResponse.data);
        } else {
          messages.push(`⚠ MongoDB assignment: ${assignResponse.data.message}`);
        }
      } catch (assignErr) {
        console.warn('MongoDB assignment failed:', assignErr.message);
        messages.push(`⚠ Database assignment: ${assignErr.response?.data?.message || assignErr.message}`);
      }

      setOpenApproveDialog(false);
      setSuccessMessage(messages.join('\n'));
      setShowSuccess(true);
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
            >
              Assign Department & Forward
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
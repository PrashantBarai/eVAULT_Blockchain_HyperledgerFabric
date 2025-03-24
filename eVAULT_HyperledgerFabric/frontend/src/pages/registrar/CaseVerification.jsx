import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
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
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

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
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in to view case details.');

        const response = await axios.get(`http://localhost:8000/registrar/case-verification/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.case) {
          setCaseDetails(response.data.case);
        } else {
          throw new Error('Case details not found.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  const handleApprove = async () => {
    if (selectedDepartment) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You must be logged in to approve cases.');
  
        const requestData = { department: selectedDepartment };
        console.log("Sending request to API:", requestData);  // Debugging log
  
        const response = await axios.post(
          `http://localhost:8000/registrar/case-assignment/${id}`, 
          requestData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        console.log("Response:", response.data);  // Debugging log
  
        setOpenApproveDialog(false);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/registrar/dashboard');
        }, 2000);
      } catch (err) {
        console.error("API Error:", err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : err.message);
      }
    }
  };
  
  

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to reject cases.');
      await axios.post(
        `http://localhost:8000/case/${id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOpenRejectDialog(false);
      setShowSuccess(true);
      // setTimeout(() => {
      //   navigate('/registrar/case-assignment');
      // }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress /> {/* Use CircularProgress here */}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Case has been successfully processed! Redirecting...
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
            <Typography variant="body2" color="textSecondary">Bar Council ID: BCI123456</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary">Case Summary</Typography>
            <Typography variant="body1">{caseDetails.description}</Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Note: Uploaded documents and media files are not accessible at this stage.
          </Alert>

          <Box sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            mt: 4,
          }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setOpenRejectDialog(true)}
            >
              Reject Case
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setOpenApproveDialog(true)}
            >
              Approve & Forward
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
        <DialogTitle>Forward Case to Department</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
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
          <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            color="success"
            disabled={!selectedDepartment}
          >
            Confirm & Forward
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Reject Case</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error">
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseVerification;
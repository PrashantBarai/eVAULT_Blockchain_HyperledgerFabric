import React, { useState } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const departments = [
  { id: 'civil', name: 'Civil Department' },
  { id: 'criminal', name: 'Criminal Department' },
  { id: 'family', name: 'Family Court Department' },
  { id: 'corporate', name: 'Corporate Law Department' },
  { id: 'tax', name: 'Tax Law Department' },
  { id: 'constitutional', name: 'Constitutional Law Department' },
];

const CaseVerification = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [openApproveDialog, setOpenApproveDialog] = useState(false);

  const handleApprove = () => {
    if (selectedDepartment) {
      // TODO: Implement case approval logic with department
      setOpenApproveDialog(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/registrar/case-assignment');
      }, 2000);
    }
  };

  const handleReject = () => {
    // TODO: Implement case rejection logic
    setOpenRejectDialog(false);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/registrar/case-assignment');
    }, 2000);
  };

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
        >
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
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>Case Verification</Typography>
        <Typography variant="subtitle1">Case ID: {id}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Case Details</Typography>
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="textSecondary">Case Title</Typography>
          <Typography variant="body1">Property Dispute in Mumbai Suburb</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="textSecondary">Case Type</Typography>
          <Typography variant="body1">Civil Case</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="textSecondary">Lawyer Information</Typography>
          <Typography variant="body1">Adv. Sarah Johnson</Typography>
          <Typography variant="body2" color="textSecondary">Bar Council ID: BCI123456</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="textSecondary">Case Summary</Typography>
          <Typography variant="body1">
            This case involves a property dispute between two parties in the Mumbai suburban area.
            The dispute concerns ownership rights and boundary demarcation of a residential property.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Note: Uploaded documents and media files are not accessible at this stage.
        </Alert>

        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          justifyContent: 'flex-end',
          mt: 4 
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

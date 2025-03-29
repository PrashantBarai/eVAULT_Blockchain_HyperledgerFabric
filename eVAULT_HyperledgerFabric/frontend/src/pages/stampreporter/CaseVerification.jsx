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
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PictureAsPdf,
  Image,
  VideoLibrary,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentCard = ({ type, name, size }) => {
  const getIcon = () => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdf sx={{ fontSize: 40, color: '#f44336' }} />;
      case 'image':
        return <Image sx={{ fontSize: 40, color: '#4caf50' }} />;
      case 'video':
        return <VideoLibrary sx={{ fontSize: 40, color: '#2196f3' }} />;
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      {getIcon()}
      <Box>
        <Typography variant="subtitle1">{name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {size}
        </Typography>
      </Box>
    </Paper>
  );
};

const CaseVerification = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [openSignDialog, setOpenSignDialog] = useState(false);

  const documents = [
    { type: 'pdf', name: 'Case_Document.pdf', size: '2.5 MB' },
    { type: 'image', name: 'Evidence_1.jpg', size: '1.8 MB' },
    { type: 'image', name: 'Evidence_2.jpg', size: '2.1 MB' },
    { type: 'video', name: 'Testimony.mp4', size: '15.4 MB' },
  ];

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/case/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ digital_signature: digitalSignature }), // Use the state value
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.detail || "Failed to accept case.");
      }
  
      const data = await response.json();
      console.log("Case accepted:", data);
      setOpenSignDialog(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/stampreporter/dashboard');
      }, 2000);
    } catch (err) {
      console.error("Error accepting case:", err);
    }
  };  
  

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/case/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject case.');

      const data = await response.json();
      console.log('Case rejected:', data);
      setOpenRejectDialog(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/stampreporter/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting case:', err);
    }
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
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
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

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
          <Grid container spacing={2}>
            {documents.map((doc, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <DocumentCard {...doc} />
              </Grid>
            ))}
          </Grid>
        </Box>

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
            sx={{
              bgcolor: '#3f51b5',
              '&:hover': {
                bgcolor: '#2f3f8f',
              }
            }}
          >
            Reject Case
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setOpenSignDialog(true)}
            sx={{
              bgcolor: '#3f51b5',
              '&:hover': {
                bgcolor: '#2f3f8f',
              }
            }}
          >
            Approve & Sign
          </Button>
        </Box>
      </Paper>

      {/* Digital Signature Dialog */}
      <Dialog 
        open={openSignDialog} 
        onClose={() => setOpenSignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Digital Signature Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please enter your digital signature to approve and forward this case to the Bench Clerk.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Digital Signature"
            type="password"
            fullWidth
            value={digitalSignature}
            onChange={(e) => setDigitalSignature(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleApprove} 
            color="success"
            disabled={!digitalSignature}
          >
            Sign & Approve
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
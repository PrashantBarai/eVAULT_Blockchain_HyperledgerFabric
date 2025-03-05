import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const JudgeDecisionConfirmation = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Mock data
  const cases = [
    {
      id: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      judgeName: 'Hon. Justice Williams',
      decisionDate: '2025-03-05',
      decision: 'Approved',
      comments: 'All documents are in order. Case meets legal requirements.',
      lawyer: 'Jane Smith',
    },
    {
      id: 'CASE-2025-002',
      title: 'Contract Violation',
      judgeName: 'Hon. Justice Rodriguez',
      decisionDate: '2025-03-04',
      decision: 'Rejected',
      comments: 'Insufficient evidence provided. Additional documentation required.',
      lawyer: 'Michael Johnson',
    },
  ];

  const handleViewDecision = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleConfirmDecision = (caseId) => {
    // TODO: Implement confirmation logic and lawyer notification
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const getDecisionColor = (decision) => {
    switch (decision.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {showConfirmation && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setShowConfirmation(false)}
        >
          Decision confirmed and lawyer notified successfully!
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Judge Decision Confirmation
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Judge</TableCell>
              <TableCell sx={{ color: 'white' }}>Decision Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Decision</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.id}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.judgeName}</TableCell>
                <TableCell>{case_.decisionDate}</TableCell>
                <TableCell>
                  <Chip 
                    label={case_.decision}
                    color={getDecisionColor(case_.decision)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleViewDecision(case_)}
                    sx={{ color: '#4a90e2' }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Decision Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Judge's Decision Details
            <IconButton onClick={() => setOpenDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedCase.title}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Case ID: {selectedCase.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Judge: {selectedCase.judgeName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Decision Date: {selectedCase.decisionDate}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Lawyer: {selectedCase.lawyer}
              </Typography>
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Decision
                </Typography>
                <Chip 
                  label={selectedCase.decision}
                  color={getDecisionColor(selectedCase.decision)}
                  icon={<GavelIcon />}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1">
                  {selectedCase.comments}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={() => handleConfirmDecision(selectedCase?.id)}
            sx={{
              background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
              color: 'white',
            }}
          >
            Confirm & Notify Lawyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JudgeDecisionConfirmation;

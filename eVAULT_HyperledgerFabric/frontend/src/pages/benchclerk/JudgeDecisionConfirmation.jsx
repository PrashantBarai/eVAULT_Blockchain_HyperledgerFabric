import { useState } from 'react';
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
  Chip,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const JudgeDecisionConfirmation = () => {
  const [selectedCase, setSelectedCase] = useState(null);
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
  };

  const handleBackToList = () => {
    setSelectedCase(null);
  };

  const handleConfirmDecision = () => {
    // TODO: Implement confirmation logic and lawyer notification
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
      setSelectedCase(null); // Return to list view after confirmation
    }, 3000);
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

  if (selectedCase) {
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

        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToList}
          sx={{ mb: 3 }}
        >
          Back to Decisions
        </Button>

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
          <Typography variant="h4" gutterBottom>Judge&apos;s Decision Details</Typography>
          <Typography variant="subtitle1">Case ID: {selectedCase.id}</Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Case Information</Typography>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Case Title</Typography>
                <Typography variant="body1">{selectedCase.title}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Judge</Typography>
                <Typography variant="body1">{selectedCase.judgeName}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Decision Date</Typography>
                <Typography variant="body1">{selectedCase.decisionDate}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Lawyer</Typography>
                <Typography variant="body1">{selectedCase.lawyer}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Decision</Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 3 }}>
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
        </Paper>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          mt: 4 
        }}>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleConfirmDecision}
            sx={{
              bgcolor: '#3f51b5',
              '&:hover': {
                bgcolor: '#1a237e',
              }
            }}
          >
            Confirm & Notify Lawyer
          </Button>
        </Box>
      </Box>
    );
  }

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
            <TableRow sx={{ background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)' }}>
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
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDecision(case_)}
                    sx={{ 
                      color: '#3f51b5',
                      borderColor: '#3f51b5',
                      '&:hover': {
                        borderColor: '#3f51b5',
                        bgcolor: 'rgba(63, 81, 181, 0.1)',
                      }
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
    </Box>
  );
};

export default JudgeDecisionConfirmation;

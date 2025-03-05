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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const CaseReview = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [decisionType, setDecisionType] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [openDecisionDialog, setOpenDecisionDialog] = useState(false);

  // Mock data
  const cases = [
    {
      id: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      type: 'Civil',
      lawyerName: 'Jane Smith',
      submissionDate: '2025-03-05',
      status: 'New',
      documents: [
        { name: 'Property_Deed.pdf', type: 'PDF' },
        { name: 'Evidence_Photos.jpg', type: 'Image' },
        { name: 'Witness_Statements.pdf', type: 'PDF' },
      ],
      history: [
        { date: '2025-03-01', action: 'Case Filed', actor: 'Lawyer' },
        { date: '2025-03-03', action: 'Documents Verified', actor: 'Stamp Reporter' },
        { date: '2025-03-05', action: 'Forwarded to Judge', actor: 'Bench Clerk' },
      ]
    },
    // Add more mock cases here
  ];

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const handleDecisionClick = () => {
    setOpenDecisionDialog(true);
  };

  const handleDecisionSubmit = () => {
    // TODO: Implement decision submission logic
    setOpenDecisionDialog(false);
    setOpenDialog(false);
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'new': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'on hold': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Review & Decision
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Type</TableCell>
              <TableCell sx={{ color: 'white' }}>Lawyer</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.id}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.type}</TableCell>
                <TableCell>{case_.lawyerName}</TableCell>
                <TableCell>
                  <Chip
                    label={case_.status}
                    color={getStatusChipColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleViewCase(case_)}
                    sx={{
                      background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                      color: 'white',
                    }}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Case Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Case Details</Typography>
            <IconButton onClick={() => setOpenDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCase && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedCase.title}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Case ID: {selectedCase.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Type: {selectedCase.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Lawyer: {selectedCase.lawyerName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Submission Date: {selectedCase.submissionDate}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {selectedCase.documents.map((doc, index) => (
                    <Chip
                      key={index}
                      icon={<DescriptionIcon />}
                      label={doc.name}
                      sx={{ m: 0.5 }}
                      color="primary"
                    />
                  ))}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Case History
                </Typography>
                <Stepper orientation="vertical">
                  {selectedCase.history.map((step, index) => (
                    <Step key={index} active={true}>
                      <StepLabel>
                        <Typography variant="subtitle2">{step.action}</Typography>
                        <Typography variant="caption">
                          {step.date} • {step.actor}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Take Action
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<GavelIcon />}
                      onClick={handleDecisionClick}
                      sx={{
                        mb: 2,
                        background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                      }}
                    >
                      Make Decision
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog
        open={openDecisionDialog}
        onClose={() => setOpenDecisionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Make Decision</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Decision</InputLabel>
            <Select
              value={decisionType}
              label="Decision"
              onChange={(e) => setDecisionType(e.target.value)}
            >
              <MenuItem value="accept">Accept Case</MenuItem>
              <MenuItem value="reject">Reject Case</MenuItem>
              <MenuItem value="hold">Put On Hold</MenuItem>
              <MenuItem value="ruling">Provide Final Ruling</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason/Comments"
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDecisionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDecisionSubmit}
            sx={{
              background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
            }}
          >
            Submit Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseReview;

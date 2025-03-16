    
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
  TextField,
  Chip,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Step,
  StepLabel,
  Stepper,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

const CaseReview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');

  // Mock data
  const cases = [
    {
      id: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      type: 'Civil',
      lawyerName: 'Jane Smith',
      status: 'New',
      history: [
        { date: '2025-03-05', action: 'Case submitted by lawyer', actor: 'Jane Smith' },
        { date: '2025-03-06', action: 'Case verified by stamp reporter', actor: 'John Doe' },
        { date: '2025-03-07', action: 'Case forwarded to judge', actor: 'Bench Clerk' },
      ],
      documents: [
        { name: 'Property_Deed.pdf', type: 'PDF', size: '2.5 MB' },
        { name: 'Evidence_Photos.jpg', type: 'Image', size: '1.2 MB' },
        { name: 'Witness_Statements.pdf', type: 'PDF', size: '0.8 MB' },
      ],
    },
    {
      id: 'CASE-2025-002',
      title: 'Contract Violation',
      type: 'Commercial',
      lawyerName: 'Michael Johnson',
      status: 'New',
      history: [
        { date: '2025-03-04', action: 'Case submitted by lawyer', actor: 'Michael Johnson' },
        { date: '2025-03-05', action: 'Case verified by stamp reporter', actor: 'Sarah Wilson' },
        { date: '2025-03-06', action: 'Case forwarded to judge', actor: 'Bench Clerk' },
      ],
      documents: [
        { name: 'Contract.pdf', type: 'PDF', size: '3.1 MB' },
        { name: 'Communication_Records.pdf', type: 'PDF', size: '1.5 MB' },
      ],
    },
  ];

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setShowDecisionForm(false);
    setDecision('');
    setRemarks('');
  };

  const handleBackToList = () => {
    setSelectedCase(null);
    setShowDecisionForm(false);
    setDecision('');
    setRemarks('');
  };

  const handleShowDecisionForm = () => {
    setShowDecisionForm(true);
  };

  const handleSubmitDecision = () => {
    if (!decision) return;
    
    // TODO: Implement decision submission logic
    console.log('Decision submitted:', decision, 'Remarks:', remarks);
    
    // After submitting, go back to the list
    setSelectedCase(null);
    setShowDecisionForm(false);
    setDecision('');
    setRemarks('');
  };

  const filteredCases = cases.filter(
    (case_) =>
      case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCase) {
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToList}
          sx={{ mb: 3 }}
        >
          Back to Cases
        </Button>

        {showDecisionForm ? (
          <>
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
              <Typography variant="h4" gutterBottom>Make Decision</Typography>
              <Typography variant="subtitle1">Case ID: {selectedCase.id}</Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Decision Form</Typography>
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="decision-select-label">Decision</InputLabel>
                <Select
                  labelId="decision-select-label"
                  id="decision-select"
                  value={decision}
                  label="Decision"
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <MenuItem value="Approve">Approve</MenuItem>
                  <MenuItem value="Reject">Reject</MenuItem>
                  <MenuItem value="Request Additional Information">Request Additional Information</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Remarks"
                variant="outlined"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 2
              }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowDecisionForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  endIcon={<GavelIcon />}
                  onClick={handleSubmitDecision}
                  disabled={!decision}
                  sx={{
                    bgcolor: '#3f51b5',
                    '&:hover': {
                      bgcolor: '#1a237e',
                    }
                  }}
                >
                  Submit Decision
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          <>
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
              <Typography variant="h4" gutterBottom>Case Details</Typography>
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
                    <Typography variant="subtitle1" color="textSecondary">Case Type</Typography>
                    <Typography variant="body1">{selectedCase.type}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="textSecondary">Lawyer</Typography>
                    <Typography variant="body1">{selectedCase.lawyerName}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="textSecondary">Status</Typography>
                    <Chip
                      label={selectedCase.status}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Case History</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stepper orientation="vertical" sx={{ mt: 2 }}>
                {selectedCase.history.map((step, index) => (
                  <Step key={index} active={true} completed={true}>
                    <StepLabel>
                      <Typography variant="subtitle1">{step.action}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {step.date} - {step.actor}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Documents</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                {selectedCase.documents.map((doc, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {doc.type === 'PDF' ? (
                        <Box sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: 1
                        }}>
                          PDF
                        </Box>
                      ) : (
                        <Box sx={{ 
                          bgcolor: '#4caf50', 
                          color: 'white', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: 1
                        }}>
                          IMG
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body1">{doc.name}</Typography>
                        <Typography variant="body2" color="textSecondary">{doc.size}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              mt: 4 
            }}>
              <Button
                variant="contained"
                endIcon={<GavelIcon />}
                onClick={handleShowDecisionForm}
                sx={{
                  bgcolor: '#3f51b5',
                  '&:hover': {
                    bgcolor: '#1a237e',
                  }
                }}
              >
                Make Decision
              </Button>
            </Box>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Review
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search cases..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Type</TableCell>
              <TableCell sx={{ color: 'white' }}>Lawyer</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.id}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.type}</TableCell>
                <TableCell>{case_.lawyerName}</TableCell>
                <TableCell>
                  <Chip
                    label={case_.status}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewCase(case_)}
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

export default CaseReview;

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
  InputAdornment,
  Chip,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const CaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState('');
  const [showForwardForm, setShowForwardForm] = useState(false);

  // Mock data for judges
  const judges = [
    { id: 'J001', name: 'Hon. Justice Patel' },
    { id: 'J002', name: 'Hon. Justice Sharma' },
    { id: 'J003', name: 'Hon. Justice Singh' },
  ];

  // Mock data
  const cases = [
    {
      id: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      type: 'Civil',
      lawyerName: 'Jane Smith',
      submissionDate: '2025-03-05',
      documents: [
        { name: 'Property_Deed.pdf', type: 'PDF' },
        { name: 'Evidence_Photos.jpg', type: 'Image' },
      ],
      status: 'New',
    },
    {
      id: 'CASE-2025-002',
      title: 'Contract Violation',
      type: 'Commercial',
      lawyerName: 'Michael Johnson',
      submissionDate: '2025-03-04',
      documents: [
        { name: 'Contract.pdf', type: 'PDF' },
        { name: 'Communication_Records.pdf', type: 'PDF' },
      ],
      status: 'New',
    },
  ];

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setShowForwardForm(false);
  };

  const handleBackToList = () => {
    setSelectedCase(null);
    setShowForwardForm(false);
    setSelectedJudge('');
  };

  const handleShowForwardForm = () => {
    setShowForwardForm(true);
  };

  const handleForwardToJudge = () => {
    if (!selectedJudge) return;
    
    // TODO: Implement forward to judge logic
    console.log('Forwarding case to judge:', selectedJudge);
    
    // After forwarding, go back to the list
    setSelectedCase(null);
    setShowForwardForm(false);
    setSelectedJudge('');
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

        {showForwardForm ? (
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
              <Typography variant="h4" gutterBottom>Forward Case</Typography>
              <Typography variant="subtitle1">Case ID: {selectedCase.id}</Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Select Judge</Typography>
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="judge-select-label">Judge</InputLabel>
                <Select
                  labelId="judge-select-label"
                  id="judge-select"
                  value={selectedJudge}
                  label="Judge"
                  onChange={(e) => setSelectedJudge(e.target.value)}
                >
                  {judges.map((judge) => (
                    <MenuItem key={judge.id} value={judge.id}>
                      {judge.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 2
              }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowForwardForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleForwardToJudge}
                  disabled={!selectedJudge}
                  sx={{
                    bgcolor: '#3f51b5',
                    '&:hover': {
                      bgcolor: '#1a237e',
                    }
                  }}
                >
                  Forward Case
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
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Case Title</Typography>
                <Typography variant="body1">{selectedCase.title}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Case Type</Typography>
                <Typography variant="body1">{selectedCase.type}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Lawyer Information</Typography>
                <Typography variant="body1">{selectedCase.lawyerName}</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Submission Date</Typography>
                <Typography variant="body1">{selectedCase.submissionDate}</Typography>
              </Box>
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
                      <Typography variant="body1">{doc.name}</Typography>
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
                endIcon={<SendIcon />}
                onClick={handleShowForwardForm}
                sx={{
                  bgcolor: '#3f51b5',
                  '&:hover': {
                    bgcolor: '#1a237e',
                  }
                }}
              >
                Forward to Judge
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
        Case Management
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
              <TableCell sx={{ color: 'white' }}>Submission Date</TableCell>
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
                <TableCell>{case_.submissionDate}</TableCell>
                <TableCell>
                  <Chip 
                    label={case_.status}
                    color={case_.status === 'New' ? 'info' : 'default'}
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

export default CaseManagement;

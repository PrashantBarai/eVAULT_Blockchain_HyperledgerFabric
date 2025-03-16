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
  Grid,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const CaseStatus = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  // Function to determine the color of the status chip
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Mock data
  const cases = [
    {
      id: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      type: 'Civil',
      lawyerName: 'Jane Smith',
      status: 'Pending',
      lastUpdated: '2025-03-10',
      documents: [
        'Property_Deed.pdf',
        'Evidence_Photos.jpg',
        'Witness_Statements.pdf',
      ],
      decision: 'Awaiting final documentation from both parties before proceeding.'
    },
    {
      id: 'CASE-2025-002',
      title: 'Contract Violation',
      type: 'Commercial',
      lawyerName: 'Michael Johnson',
      status: 'Approved',
      lastUpdated: '2025-03-08',
      documents: [
        'Contract.pdf',
        'Communication_Records.pdf',
      ],
      decision: 'Case approved for hearing based on sufficient evidence provided.'
    },
    {
      id: 'CASE-2025-003',
      title: 'Intellectual Property Infringement',
      type: 'Intellectual Property',
      lawyerName: 'Robert Williams',
      status: 'Rejected',
      lastUpdated: '2025-03-05',
      documents: [
        'Patent_Documents.pdf',
        'Infringement_Evidence.jpg',
      ],
      decision: 'Case rejected due to insufficient evidence of infringement.'
    },
  ];

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
  };

  const handleBackToList = () => {
    setSelectedCase(null);
  };

  const filteredCases = cases.filter(
    (case_) =>
      case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.status.toLowerCase().includes(searchQuery.toLowerCase())
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

        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            mb: 3,
            background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
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
                <Typography variant="subtitle1" color="textSecondary">Last Updated</Typography>
                <Typography variant="body1">{selectedCase.lastUpdated}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="textSecondary">Status</Typography>
                <Chip
                  label={selectedCase.status}
                  color={getStatusColor(selectedCase.status)}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {selectedCase.decision && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Decision</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">{selectedCase.decision}</Typography>
            </Box>
          </Paper>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Documents</Typography>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            {selectedCase.documents.map((doc, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  {doc.includes('.pdf') ? (
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
                  <Typography variant="body1">{doc}</Typography>
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
            onClick={handleBackToList}
            sx={{
              bgcolor: '#3f51b5',
              '&:hover': {
                bgcolor: '#1a237e',
              }
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Status
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
            <TableRow sx={{ background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Type</TableCell>
              <TableCell sx={{ color: 'white' }}>Lawyer</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Last Updated</TableCell>
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
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{case_.lastUpdated}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewCase(case_)}
                    sx={{ 
                      color: '#0d47a1',
                      borderColor: '#0d47a1',
                      '&:hover': {
                        borderColor: '#0d47a1',
                        bgcolor: 'rgba(13, 71, 161, 0.1)',
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

export default CaseStatus;

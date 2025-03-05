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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const CaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

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
    setOpenDialog(true);
  };

  const handleForwardToJudge = (caseId) => {
    // TODO: Implement forward to judge logic
    console.log('Forwarding case to judge:', caseId);
  };

  const filteredCases = cases.filter(
    (case_) =>
      case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <TableRow sx={{ background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)' }}>
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
                  <IconButton
                    onClick={() => handleViewCase(case_)}
                    sx={{ color: '#4a90e2' }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleForwardToJudge(case_.id)}
                    sx={{ color: '#8e44ad' }}
                  >
                    <SendIcon />
                  </IconButton>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Case Details
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
                Type: {selectedCase.type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Lawyer: {selectedCase.lawyerName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Submission Date: {selectedCase.submissionDate}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Documents
              </Typography>
              {selectedCase.documents.map((doc, index) => (
                <Chip
                  key={index}
                  label={doc.name}
                  sx={{ m: 0.5 }}
                  color="primary"
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => handleForwardToJudge(selectedCase?.id)}
            sx={{
              background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
              color: 'white',
            }}
          >
            Forward to Judge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseManagement;

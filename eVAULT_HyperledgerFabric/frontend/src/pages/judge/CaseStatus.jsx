import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

const CaseStatus = () => {
  const [tabValue, setTabValue] = useState(0);
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
      status: 'Pending',
      lastUpdated: '2025-03-05',
      documents: ['Property_Deed.pdf', 'Evidence_Photos.jpg'],
      decision: null,
    },
    {
      id: 'CASE-2025-002',
      title: 'Contract Violation',
      type: 'Commercial',
      lawyerName: 'Michael Johnson',
      status: 'Accepted',
      lastUpdated: '2025-03-04',
      documents: ['Contract.pdf', 'Communication_Records.pdf'],
      decision: 'Case accepted for hearing. Scheduled for next week.',
    },
    {
      id: 'CASE-2025-003',
      title: 'Property Documentation',
      type: 'Civil',
      lawyerName: 'Sarah Wilson',
      status: 'On Hold',
      lastUpdated: '2025-03-03',
      documents: ['Property_Papers.pdf'],
      decision: 'Additional witness statements required.',
    },
    {
      id: 'CASE-2025-004',
      title: 'Intellectual Property Rights',
      type: 'Commercial',
      lawyerName: 'Robert Brown',
      status: 'Finalized',
      lastUpdated: '2025-03-02',
      documents: ['Patent_Documents.pdf', 'Evidence.pdf'],
      decision: 'Patent rights granted to the plaintiff.',
    },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'on hold': return 'warning';
      case 'finalized': return 'primary';
      default: return 'default';
    }
  };

  const filterCases = () => {
    const statusMap = ['Pending', 'Accepted', 'Rejected', 'On Hold', 'Finalized'];
    return cases.filter(case_ => {
      const matchesSearch = 
        case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.lawyerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = case_.status === statusMap[tabValue];
      
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Status Tracking
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#1a237e !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1a237e',
            },
          }}
        >
          <Tab label="Pending" />
          <Tab label="Accepted" />
          <Tab label="Rejected" />
          <Tab label="On Hold" />
          <Tab label="Finalized" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
              <TableCell sx={{ color: 'white' }}>Case ID</TableCell>
              <TableCell sx={{ color: 'white' }}>Title</TableCell>
              <TableCell sx={{ color: 'white' }}>Type</TableCell>
              <TableCell sx={{ color: 'white' }}>Lawyer</TableCell>
              <TableCell sx={{ color: 'white' }}>Last Updated</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterCases().map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.id}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.type}</TableCell>
                <TableCell>{case_.lawyerName}</TableCell>
                <TableCell>{case_.lastUpdated}</TableCell>
                <TableCell>
                  <Chip
                    label={case_.status}
                    color={getStatusColor(case_.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleViewCase(case_)}
                    sx={{
                      background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
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

      {/* Case Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
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
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedCase.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Case ID: {selectedCase.id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Case Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Type: {selectedCase.type}
                    <br />
                    Lawyer: {selectedCase.lawyerName}
                    <br />
                    Last Updated: {selectedCase.lastUpdated}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedCase.status}
                    color={getStatusColor(selectedCase.status)}
                    icon={<GavelIcon />}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Documents
                  </Typography>
                  {selectedCase.documents.map((doc, index) => (
                    <Chip
                      key={index}
                      icon={<DescriptionIcon />}
                      label={doc}
                      sx={{ m: 0.5 }}
                      color="primary"
                    />
                  ))}
                </Paper>
              </Grid>

              {selectedCase.decision && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Decision/Comments
                    </Typography>
                    <Typography variant="body2">
                      {selectedCase.decision}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseStatus;

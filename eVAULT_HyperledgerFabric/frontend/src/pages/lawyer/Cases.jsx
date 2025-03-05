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
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual API call
  const cases = [
    {
      id: 1,
      caseNumber: 'CASE-2025-001',
      title: 'Property Dispute Resolution',
      client: 'John Doe',
      status: 'Pending',
      date: '2025-03-01',
    },
    {
      id: 2,
      caseNumber: 'CASE-2025-002',
      title: 'Contract Review',
      client: 'Jane Smith',
      status: 'In Progress',
      date: '2025-02-28',
    },
    {
      id: 3,
      caseNumber: 'CASE-2025-003',
      title: 'Intellectual Property Rights',
      client: 'Tech Corp',
      status: 'Completed',
      date: '2025-02-27',
    },
  ];

  const filteredCases = cases.filter(
    (case_) =>
      case_.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCase = (caseId) => {
    navigate(`/lawyer/case/${caseId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Cases
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.caseNumber}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.client}</TableCell>
                <TableCell>{case_.status}</TableCell>
                <TableCell>{case_.date}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewCase(case_.id)}
                    sx={{
                      bgcolor: '#3f51b5',
                      '&:hover': {
                        bgcolor: '#2f3f8f',
                      },
                    }}
                  >
                    View
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

export default Cases;

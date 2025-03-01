import React from 'react';
import {
  Box,
  Typography,
  Paper,
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
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cases = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const pendingCases = [
    {
      id: 'CASE131',
      title: 'Real Estate Documentation Review',
      submissionDate: '2025-03-01',
      lawyer: 'Adv. Priya Sharma',
      priority: 'High',
      department: 'Property Law',
    },
    {
      id: 'CASE132',
      title: 'Corporate Merger Agreement',
      submissionDate: '2025-03-01',
      lawyer: 'Adv. Rajesh Kumar',
      priority: 'Medium',
      department: 'Corporate Law',
    },
    {
      id: 'CASE133',
      title: 'Patent Registration Documents',
      submissionDate: '2025-02-28',
      lawyer: 'Adv. Sarah Johnson',
      priority: 'High',
      department: 'Intellectual Property',
    },
    {
      id: 'CASE134',
      title: 'Property Transfer Deed',
      submissionDate: '2025-02-28',
      lawyer: 'Adv. Michael Chen',
      priority: 'Low',
      department: 'Property Law',
    },
  ];

  const filteredCases = pendingCases.filter(
    (case_) =>
      case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.lawyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#4caf50';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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
        <Typography variant="h4" gutterBottom>Pending Cases</Typography>
        <Typography variant="subtitle1">
          Cases requiring verification
        </Typography>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Case ID, Title, Lawyer, or Department"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><Typography variant="subtitle2">Case ID</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Title</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Lawyer</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Department</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Submission Date</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Priority</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Action</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((case_) => (
              <TableRow 
                key={case_.id}
                sx={{ 
                  '&:hover': { 
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {case_.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.title}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.lawyer}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.department}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{case_.submissionDate}</Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: getPriorityColor(case_.priority),
                      fontWeight: 500
                    }}
                  >
                    {case_.priority}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/registrar/case-verification/${case_.id}`)}
                    sx={{ 
                      color: '#3f51b5',
                      borderColor: '#3f51b5',
                      '&:hover': {
                        borderColor: '#3f51b5',
                        bgcolor: 'rgba(63, 81, 181, 0.1)',
                      }
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
    </Box>
  );
};

export default Cases;

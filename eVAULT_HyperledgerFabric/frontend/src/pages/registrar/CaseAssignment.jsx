import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CaseAssignment = () => {
  const navigate = useNavigate();

  const cases = [
    {
      id: 'CASE123',
      title: 'Property Dispute in Mumbai Suburb',
      submissionDate: '2025-03-01',
      lawyerName: 'Adv. Sarah Johnson',
      status: 'New'
    },
    {
      id: 'CASE124',
      title: 'Corporate Fraud Investigation',
      submissionDate: '2025-03-01',
      lawyerName: 'Adv. Michael Chen',
      status: 'New'
    },
    {
      id: 'CASE125',
      title: 'Environmental Protection Case',
      submissionDate: '2025-02-28',
      lawyerName: 'Adv. Priya Sharma',
      status: 'New'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Case Assignments</Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        width: '100%'
      }}>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: '#3f51b5',
            '&:hover': { bgcolor: '#303f9f' }
          }}
        >
          Today
        </Button>
        <Button 
          variant="outlined" 
          sx={{ color: '#3f51b5', borderColor: '#3f51b5' }}
        >
          This Week
        </Button>
        <Button 
          variant="outlined" 
          sx={{ color: '#3f51b5', borderColor: '#3f51b5' }}
        >
          This Month
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<CalendarTodayIcon />}
          sx={{ 
            ml: 'auto',
            color: '#3f51b5', 
            borderColor: '#3f51b5'
          }}
        >
          Custom Date
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search cases by ID, title, or lawyer name"
        variant="outlined"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: '#3f51b5', mr: 1 }} />,
        }}
      />

      {cases.map((case_) => (
        <Card 
          key={case_.id} 
          sx={{ 
            mb: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateX(5px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          <CardContent sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h6">{case_.title}</Typography>
                <Chip 
                  label={case_.status} 
                  sx={{ 
                    bgcolor: '#3f51b5',
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography color="textSecondary">Case ID: {case_.id}</Typography>
              <Typography color="textSecondary">Submitted by: {case_.lawyerName}</Typography>
              <Typography color="textSecondary">Date: {case_.submissionDate}</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate(`/registrar/case-verification/${case_.id}`)}
              sx={{ 
                bgcolor: '#3f51b5',
                '&:hover': { bgcolor: '#303f9f' }
              }}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default CaseAssignment;

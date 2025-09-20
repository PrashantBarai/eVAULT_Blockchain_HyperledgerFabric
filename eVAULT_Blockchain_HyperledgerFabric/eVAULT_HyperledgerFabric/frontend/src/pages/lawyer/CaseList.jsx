import React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Pagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';

const CaseList = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('Today');
  const [page, setPage] = useState(1);

  // Dummy data
  const cases = [
    {
      id: 1,
      name: 'Property Dispute Case',
      description: 'Case Description',
      caseNumber: 'CASE2024/001',
      date: '2024-02-15',
      status: 'Pending',
      type: 'Civil',
      clientName: 'John Smith'
    },
    {
      id: 2,
      name: 'Civil Rights Case',
      description: 'Case Description',
      caseNumber: 'CASE2024/002',
      date: '2024-02-14',
      status: 'In Progress',
      type: 'Civil',
      clientName: 'Jane Doe'
    },
    {
      id: 3,
      name: 'Corporate Law Case',
      description: 'Case Description',
      caseNumber: 'CASE2024/003',
      date: '2024-02-13',
      status: 'Completed',
      type: 'Corporate',
      clientName: 'ABC Corp'
    },
  ];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Header Section */}
      <Typography variant="h4" sx={{ mb: 3 }}>Case Lists</Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        width: '100%'
      }}>
        <Button 
          variant={timeFilter === 'Today' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('Today')}
          sx={{ 
            bgcolor: timeFilter === 'Today' ? '#6B5ECD' : 'transparent',
            '&:hover': { bgcolor: timeFilter === 'Today' ? '#5B4EBD' : '#6B5ECD' }
          }}
        >
          Today
        </Button>
        <Button 
          variant={timeFilter === 'This Week' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('This Week')}
          sx={{ 
            color: timeFilter === 'This Week' ? '#6B5ECD' : '#3f51b5', 
            borderColor: timeFilter === 'This Week' ? '#6B5ECD' : '#3f51b5'
          }}
        >
          This Week
        </Button>
        <Button 
          variant={timeFilter === 'This Month' ? 'contained' : 'text'}
          onClick={() => setTimeFilter('This Month')}
          sx={{ 
            color: timeFilter === 'This Month' ? '#6B5ECD' : '#3f51b5', 
            borderColor: timeFilter === 'This Month' ? '#6B5ECD' : '#3f51b5'
          }}
        >
          This Month
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<CalendarTodayIcon />}
          sx={{ 
            ml: 'auto',
            color: '#6B5ECD', 
            borderColor: '#6B5ECD'
          }}
        >
          Custom Date
        </Button>
      </Box>

      {/* Content Section */}
      <TextField
        fullWidth
        placeholder="Search Any Case"
        variant="outlined"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: '#6B5ECD', mr: 1 }} />,
        }}
      />

      {cases.map((case_) => (
        <Card 
          key={case_.id} 
          sx={{ 
            width: '100%',
            mb: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
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
                <Typography variant="h6">{case_.name}</Typography>
                <Chip 
                  label={case_.status} 
                  sx={{ 
                    bgcolor: 
                      case_.status === 'Pending' ? '#FF6B6B' : 
                      case_.status === 'In Progress' ? '#6B5ECD' : '#4CAF50',
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography color="text.secondary" sx={{ mb: 1 }}>{case_.description}</Typography>
              <Typography color="text.secondary">Case ID: {case_.id}</Typography>
              <Typography color="text.secondary">Case Type: {case_.type}</Typography>
              <Typography color="text.secondary">Client Name: {case_.clientName}</Typography>
            </Box>
            <IconButton 
              onClick={() => navigate(`/case-details/${case_.id}`)}
              sx={{ 
                bgcolor: '#6B5ECD',
                color: 'white',
                '&:hover': { bgcolor: '#5B4EBD' }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </CardContent>
        </Card>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={10}
          page={page}
          onChange={(event, value) => setPage(value)}
          sx={{
            '& .MuiPaginationItem-root': {
              color: '#6B5ECD',
            },
            '& .Mui-selected': {
              bgcolor: '#6B5ECD !important',
              color: 'white',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CaseList;

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 'CASE130',
      title: 'New Case Assigned for Verification',
      caseTitle: 'Commercial Property Dispute',
      lawyer: 'Adv. Rajesh Kumar',
      timestamp: '2 hours ago',
      isNew: true,
    },
    {
      id: 'CASE129',
      title: 'New Case Assigned for Verification',
      caseTitle: 'Intellectual Property Rights Violation',
      lawyer: 'Adv. Meera Patel',
      timestamp: '4 hours ago',
      isNew: true,
    },
    {
      id: 'CASE128',
      title: 'New Case Assigned for Verification',
      caseTitle: 'Environmental Compliance Case',
      lawyer: 'Adv. Suresh Singh',
      timestamp: '1 day ago',
      isNew: false,
    },
    {
      id: 'CASE127',
      title: 'New Case Assigned for Verification',
      caseTitle: 'Corporate Tax Dispute',
      lawyer: 'Adv. Priya Sharma',
      timestamp: '2 days ago',
      isNew: false,
    },
  ];

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
        <Typography variant="h4" gutterBottom>Notifications</Typography>
        <Typography variant="subtitle1">
          You have {notifications.filter(n => n.isNew).length} new notifications
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{ 
                  py: 2,
                  bgcolor: notification.isNew ? 'rgba(63, 81, 181, 0.05)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(63, 81, 181, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <GavelIcon sx={{ color: '#3f51b5' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {notification.title}
                      </Typography>
                      {notification.isNew && (
                        <Chip 
                          label="New" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#3f51b5',
                            color: 'white',
                          }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Case ID: {notification.id}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Case: {notification.caseTitle}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Lawyer: {notification.lawyer}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          color: 'text.secondary'
                        }}
                      >
                        {notification.timestamp}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton 
                  color="primary"
                  onClick={() => navigate(`/stampreporter/case-verification/${notification.id}`)}
                  sx={{ color: '#3f51b5' }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { useParams } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import GavelIcon from '@mui/icons-material/Gavel';
import UpdateIcon from '@mui/icons-material/Update';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';

const CaseDetails = () => {
  const { id } = useParams(); // Get the case_id from the URL
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false); // State for confirmation dialog
  console.log(id);
  // Fetch case details from the backend
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/case/${id}`); // Replace with your API endpoint
        setCaseData(response.data.case);
      } catch (err) {
        setError(err.message || 'Failed to fetch case details');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  // Handle opening the confirmation dialog
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // Handle closing the confirmation dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle sending the case to the registrar
  const handleSendToRegistrar = async () => {
    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user_data');
      if (!token) {
        alert('You must be logged in to perform this action.');
        return;
      }
      // const user = JSON.parse(userString);

      const response = await axios.post(
        `http://localhost:8000/case/${id}/send-to-registrar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert('Case successfully sent to the registrar.');
        // Optionally, update the case data to reflect the new status
        console.log(response.data);
        setCaseData(prev => ({ ...prev, status: 'Sent to Registrar' }));
      } else {
        throw new Error('Failed to send case to registrar');
      }
    } catch (err) {
      console.error('Error sending case to registrar:', err);
      alert('Failed to send case to registrar. Please try again.');
    } finally {
      handleCloseDialog();
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!caseData) {
    return <Typography>Case not found</Typography>;
  }

  // Format the data for display
  const formattedCaseData = {
    id: caseData._id,
    title: caseData.case_subject,
    status: caseData.status,
    filedDate: new Date(caseData.filed_date).toLocaleDateString(),
    nextHearing: '2024-03-15', // Replace with actual next hearing date from your data
    type: 'Criminal', // Replace with actual case type from your data
    description: caseData.case_subject, // Replace with actual description from your data
    plaintiff: caseData.uid_party1, // Replace with actual plaintiff name from your data
    defendant: caseData.uid_party2, // Replace with actual defendant name from your data
    judge: caseData.associated_judge,
    lawyer: caseData.associated_lawyers,
    documents: caseData.file_cids.map((cid, index) => ({
      name: `Document ${index + 1}`,
      date: new Date(caseData.filed_date).toLocaleDateString(),
      cid: cid,
    })),
    timeline: [
      {
        date: new Date(caseData.filed_date).toLocaleDateString(),
        event: 'Case Filed',
        description: 'Initial case documents submitted to the court',
      },
      // Add more timeline events dynamically from your data
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(145deg, #6B5ECD11 0%, #8B7CF711 100%)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              {formattedCaseData.title}
            </Typography>
            <Chip
              label={formattedCaseData.status}
              color={formattedCaseData.status === 'In Progress' ? 'primary' : 'success'}
              sx={{
                background: 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)',
                color: 'white',
              }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Filed Date
                </Typography>
                <Typography variant="body1">{formattedCaseData.filedDate}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Plaintiff
                </Typography>
                <Typography variant="body1">{formattedCaseData.plaintiff}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Defendant
                </Typography>
                <Typography variant="body1">{formattedCaseData.defendant}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Next Hearing
                </Typography>
                <Typography variant="body1">{formattedCaseData.nextHearing}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Judge
                </Typography>
                <Typography variant="body1">{formattedCaseData.judge}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Lawyer
                </Typography>
                <Typography variant="body1">{formattedCaseData.lawyer}</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* "Send to Registrar" Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              sx={{
                background: 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5A4CAD 30%, #7B6CE7 90%)',
                },
              }}
            >
              Send to Registrar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to send this case to the registrar? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSendToRegistrar} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {formattedCaseData.documents.map((doc, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid #eee',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{doc.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.date}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`https://ipfs.io/ipfs/${doc.cid}`, '_blank')}
                  >
                    View
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <UpdateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Timeline>
                {formattedCaseData.timeline.map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {index < formattedCaseData.timeline.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2">{item.event}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.date}
                      </Typography>
                      <Typography variant="body2">{item.description}</Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CaseDetails;
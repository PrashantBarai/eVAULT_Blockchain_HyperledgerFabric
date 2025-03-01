import React from 'react';
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

const CaseDetails = () => {
  const { id } = useParams();

  // Dummy data - replace with actual API call
  const caseData = {
    id: id,
    title: 'Criminal Case #123',
    status: 'In Progress',
    filedDate: '2024-02-15',
    nextHearing: '2024-03-15',
    type: 'Criminal',
    description: 'Case involving property dispute in Mumbai suburb...',
    plaintiff: 'John Doe',
    defendant: 'Jane Smith',
    judge: 'Hon. Justice Kumar',
    lawyer: 'Adv. Sharma',
    documents: [
      { name: 'Initial Filing', date: '2024-02-15' },
      { name: 'Evidence Document A', date: '2024-02-20' },
      { name: 'Witness Statement', date: '2024-02-25' },
    ],
    timeline: [
      {
        date: '2024-02-15',
        event: 'Case Filed',
        description: 'Initial case documents submitted to the court',
      },
      {
        date: '2024-02-20',
        event: 'Evidence Submission',
        description: 'Additional evidence documents submitted',
      },
      {
        date: '2024-02-25',
        event: 'Hearing Scheduled',
        description: 'First hearing scheduled for March 15th',
      },
    ],
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ 
        mb: 4,
        borderRadius: 2,
        background: 'linear-gradient(145deg, #6B5ECD11 0%, #8B7CF711 100%)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              {caseData.title}
            </Typography>
            <Chip
              label={caseData.status}
              color={caseData.status === 'In Progress' ? 'primary' : 'success'}
              sx={{ 
                background: 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)',
                color: 'white'
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
                <Typography variant="body1">{caseData.filedDate}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Plaintiff
                </Typography>
                <Typography variant="body1">{caseData.plaintiff}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Defendant
                </Typography>
                <Typography variant="body1">{caseData.defendant}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <CalendarTodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Next Hearing
                </Typography>
                <Typography variant="body1">{caseData.nextHearing}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Judge
                </Typography>
                <Typography variant="body1">{caseData.judge}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Lawyer
                </Typography>
                <Typography variant="body1">{caseData.lawyer}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Case Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {caseData.documents.map((doc, index) => (
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
                  <Button variant="outlined" size="small">
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
                {caseData.timeline.map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {index < caseData.timeline.length - 1 && <TimelineConnector />}
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

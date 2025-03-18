import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import {
  AssignmentTurnedIn,
  Gavel,
  NotificationsActive,
  Cancel,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ textAlign: 'center', mt: 2 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [registrar, setRegistrar] = useState(null);
  const [stats, setStats] = useState([]);
  const userString = localStorage.getItem('user_data');
  let user = null;
  user = JSON.parse(userString);
  const userID = user.user_id;
  useEffect(() => {
    const fetchRegistrarData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/registrar/${userID}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        setRegistrar(data);
        setStats([
          {
            title: 'Total Assigned Cases',
            value: data.total_cases,
            icon: <Gavel sx={{ fontSize: 30 }} />,
            color: '#3f51b5',
          },
          {
            title: 'Cases Verified',
            value: data.verified_cases,
            icon: <AssignmentTurnedIn sx={{ fontSize: 30 }} />,
            color: '#4caf50',
          },
          {
            title: 'Cases Rejected',
            value: data.rejected_cases,
            icon: <Cancel sx={{ fontSize: 30 }} />,
            color: '#f44336',
          },
          {
            title: 'New Notifications',
            value: data.notifications,
            icon: <NotificationsActive sx={{ fontSize: 30 }} />,
            color: '#ff9800',
          },
        ]);
      } catch (error) {
        console.error('Error fetching registrar data:', error);
      }
    };

    fetchRegistrarData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {registrar && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'white',
                color: '#3f51b5',
              }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h4">Welcome, Registrar {user.username}</Typography>
              {/* <Typography variant="subtitle1">{} | {registrar.court}</Typography> */}
            </Box>
            <Button
              variant="contained"
              startIcon={<Person />}
              sx={{
                ml: 'auto',
                bgcolor: 'white',
                color: '#3f51b5',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
              onClick={() => navigate('/registrar/profile')}
            >
              View Profile
            </Button>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;

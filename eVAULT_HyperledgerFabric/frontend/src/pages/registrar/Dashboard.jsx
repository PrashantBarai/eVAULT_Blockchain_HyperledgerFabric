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
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getUserData } from '../../utils/auth';

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
  const [loading, setLoading] = useState(true);
  const user = getUserData();
  
  useEffect(() => {
    const fetchRegistrarData = async () => {
      try {
        let pendingCount = 0;
        let verifiedCount = 0;
        
        console.log('Fetching registrar data for user:', user);
        
        // First, get the case IDs assigned to this registrar from MongoDB
        if (user?._id) {
          console.log('Fetching cases for registrar ID:', user._id);
          const registrarCasesResponse = await fetch(`http://localhost:3000/registrar-cases/${user._id}`);
          console.log('Registrar cases response status:', registrarCasesResponse.status);
          
          if (registrarCasesResponse.ok) {
            const registrarCasesData = await registrarCasesResponse.json();
            console.log('Registrar cases data:', registrarCasesData);
            const assignedCaseIds = registrarCasesData.case_ids || [];
            console.log('Assigned case IDs:', assignedCaseIds);
            
            // Only count cases that exist in blockchain (skip stale MongoDB references)
            for (const caseId of assignedCaseIds) {
              try {
                const caseResponse = await fetch(`http://localhost:8000/api/registrar/case/${caseId}`);
                console.log(`Case ${caseId} response:`, caseResponse.status);
                if (caseResponse.ok) {
                  const caseData = await caseResponse.json();
                  console.log(`Case ${caseId} data:`, caseData);
                  if (caseData.success && caseData.data) {
                    const status = (caseData.data.status || '').toUpperCase();
                    console.log(`Case ${caseId} status: ${status}`);
                    // Count as verified if forwarded to stamp reporter or later stages
                    if (status.includes('FORWARDED') || status.includes('VERIFIED') || 
                        status.includes('APPROVED') || status.includes('ASSIGNED_TO_STAMP') ||
                        status.includes('COMPLETED') || status.includes('STAMPREPORTER')) {
                      verifiedCount++;
                    } else {
                      // Count any other status as pending
                      pendingCount++;
                    }
                  }
                  // If success=false or no data, skip (stale reference)
                }
              } catch (err) {
                // Skip cases that don't exist in blockchain
                console.log(`Case ${caseId} not found in blockchain, skipping`);
              }
            }
          }
        }
        
        setRegistrar({ name: user?.username || 'Registrar' });
        setStats([
          {
            title: 'Pending Cases',
            value: pendingCount,
            icon: <Gavel sx={{ fontSize: 30 }} />,
            color: '#3f51b5',
          },
          {
            title: 'Cases Verified',
            value: verifiedCount,
            icon: <AssignmentTurnedIn sx={{ fontSize: 30 }} />,
            color: '#4caf50',
          },
          {
            title: 'Total Cases',
            value: pendingCount + verifiedCount,
            icon: <NotificationsActive sx={{ fontSize: 30 }} />,
            color: '#ff9800',
          },
        ]);
      } catch (error) {
        console.error('Error fetching registrar data:', error);
        // Set default stats on error
        setRegistrar({ name: user?.username || 'Registrar' });
        setStats([
          { title: 'Pending Cases', value: 0, icon: <Gavel sx={{ fontSize: 30 }} />, color: '#3f51b5' },
          { title: 'Cases Verified', value: 0, icon: <AssignmentTurnedIn sx={{ fontSize: 30 }} />, color: '#4caf50' },
          { title: 'Total Cases', value: 0, icon: <NotificationsActive sx={{ fontSize: 30 }} />, color: '#ff9800' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrarData();
  }, []); // Empty dependency - only run once on mount

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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getUserData } from '../../utils/auth';
import axios from 'axios';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = getUserData();
  const userId = user?._id;

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    court: '',
    employeeId: '',
    joiningDate: '',
    department: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3000/get-profile/${userId}`);
        if (!res.ok) throw new Error('Unable to load profile');
        const data = await res.json();
        console.log('Loaded profile:', data);
        
        if (data.profile) {
          setProfile({
            name: data.profile.name || user?.username || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || user?.phone_number || '',
            designation: data.profile.designation || 'Registrar',
            court: data.profile.court || '',
            employeeId: data.profile.registrarId || user?.registrarId || user?.licenseId || '',
            joiningDate: data.profile.joiningDate || '',
            department: data.profile.department || user?.department || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        // Fallback to user data from session
        if (user) {
          setProfile({
            name: user.username || '',
            email: user.email || '',
            phone: user.phone_number || '',
            designation: user.designation || 'Registrar',
            court: '',
            employeeId: user.registrarId || user.licenseId || '',
            joiningDate: '',
            department: user.department || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleSave = async () => {
    try {
      const payload = {
        ...profile,
        userId: userId,
      };
      const res = await fetch('http://localhost:3000/lawyer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{ 
              width: 100, 
              height: 100,
              bgcolor: 'white',
              color: '#3f51b5'
            }}
          >
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Box>
            <Typography variant="h4">{profile.name}</Typography>
            <Typography variant="subtitle1">{profile.designation}</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            sx={{ 
              ml: 'auto',
              bgcolor: 'white',
              color: '#3f51b5',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              }
            }}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Personal Information</Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={profile.name}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={profile.email}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profile.phone}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Designation"
              value={profile.designation}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Professional Information</Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Court"
              value={profile.court}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              value={profile.employeeId}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Department"
              value={profile.department}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Joining Date"
              value={profile.joiningDate}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;

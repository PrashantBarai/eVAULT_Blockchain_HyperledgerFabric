import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@courts.gov.in',
    phone: '+91 98765 43210',
    designation: 'Senior Registrar',
    court: 'Mumbai High Court',
    employeeId: 'REG2025001',
    joiningDate: '2020-01-15',
    department: 'Civil Division'
  });

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Implement save logic
  };

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

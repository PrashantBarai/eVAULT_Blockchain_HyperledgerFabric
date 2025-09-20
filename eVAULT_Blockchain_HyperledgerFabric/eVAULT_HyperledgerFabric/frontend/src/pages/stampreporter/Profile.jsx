import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Raj Kumar',
    title: 'Senior Stamp Reporter',
    employeeId: 'SR123456',
    email: 'raj.kumar@courts.gov.in',
    phone: '+91 98765 43210',
    department: 'Mumbai High Court',
    joinDate: '2020-01-15',
    address: '123, Court Staff Quarters, Mumbai - 400001',
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
        >
          Profile updated successfully!
        </Alert>
      )}

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
            <Typography variant="subtitle1">{profile.title}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Employee ID: {profile.employeeId}
            </Typography>
          </Box>
          <IconButton 
            sx={{ 
              ml: 'auto',
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
            onClick={() => setIsEditing(true)}
          >
            <EditIcon />
          </IconButton>
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
              value={editedProfile.name}
              onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              value={editedProfile.title}
              onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={editedProfile.email}
              onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={editedProfile.phone}
              onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Department"
              value={editedProfile.department}
              onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Join Date"
              value={editedProfile.joinDate}
              onChange={(e) => setEditedProfile({ ...editedProfile, joinDate: e.target.value })}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={editedProfile.address}
              onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
              disabled={!isEditing}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ 
                bgcolor: '#3f51b5',
                '&:hover': {
                  bgcolor: '#2f3f8f',
                }
              }}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;

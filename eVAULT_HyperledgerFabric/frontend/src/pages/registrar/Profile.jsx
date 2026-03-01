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
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getUserData } from '../../utils/auth';
import axios from 'axios';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
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

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3000/get-profile/${userId}`);
        if (!res.ok) throw new Error('Unable to load profile');
        const data = await res.json();
        console.log('Loaded profile:', data);

        if (data.profile) {
          const profileData = {
            name: data.profile.name || user?.username || '',
            email: data.profile.email || user?.email || '',
            phone: data.profile.phone || user?.phone_number || '',
            designation: data.profile.designation || 'Registrar',
            court: data.profile.court || '',
            employeeId: data.profile.registrarId || user?.registrarId || user?.licenseId || '',
            joiningDate: data.profile.joiningDate || '',
            department: data.profile.department || user?.department || ''
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        // Fallback to user data from session
        if (user) {
          const fallback = {
            name: user.username || '',
            email: user.email || '',
            phone: user.phone_number || '',
            designation: user.designation || 'Registrar',
            court: '',
            employeeId: user.registrarId || user.licenseId || '',
            joiningDate: '',
            department: user.department || ''
          };
          setProfile(fallback);
          setEditedProfile(fallback);
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
      setSaving(true);
      setError(null);
      const payload = {
        ...editedProfile,
        userId: userId,
      };
      const res = await fetch('http://localhost:3000/lawyer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setProfile({ ...editedProfile });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...profile });
  };

  const handleChange = (field) => (e) => {
    setEditedProfile({ ...editedProfile, [field]: e.target.value });
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
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>Profile updated successfully!</Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

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
            <Typography variant="h4">{profile.name || 'Registrar'}</Typography>
            <Typography variant="subtitle1">{profile.designation}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Employee ID: {profile.employeeId || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ bgcolor: 'white', color: '#3f51b5', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => { setEditedProfile({ ...profile }); setIsEditing(true); }}
                sx={{ bgcolor: 'white', color: '#3f51b5', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              >
                Edit Profile
              </Button>
            )}
          </Box>
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
              value={isEditing ? editedProfile.name : profile.name}
              onChange={handleChange('name')}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={isEditing ? editedProfile.email : profile.email}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={isEditing ? editedProfile.phone : profile.phone}
              onChange={handleChange('phone')}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Designation"
              value={isEditing ? editedProfile.designation : profile.designation}
              onChange={handleChange('designation')}
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
              value={isEditing ? editedProfile.court : profile.court}
              onChange={handleChange('court')}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              value={isEditing ? editedProfile.employeeId : profile.employeeId}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Department"
              value={isEditing ? editedProfile.department : profile.department}
              onChange={handleChange('department')}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Joining Date"
              value={isEditing ? editedProfile.joiningDate : profile.joiningDate}
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

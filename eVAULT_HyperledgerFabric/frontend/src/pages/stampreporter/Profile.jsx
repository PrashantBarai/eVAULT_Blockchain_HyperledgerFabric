import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { getUserData } from '../../utils/auth';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    reporterId: '',
    reportingArea: '',
    department: '',
    certificationDate: '',
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = getUserData();
        if (!user?._id) throw new Error('User data not found.');

        // Fetch profile from MongoDB
        const response = await axios.get(`http://localhost:3000/get-profile/${user._id}`);

        if (response.data) {
          // API returns { profile: {...} }
          const data = response.data.profile || response.data;
          const profileData = {
            name: data.username || data.name || '',
            email: data.email || '',
            phone: data.phone_number || data.phone || '',
            reporterId: data.reporterId || '',
            reportingArea: data.reportingArea || '',
            department: data.department || '',
            certificationDate: data.certificationDate || '',
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Fallback to sessionStorage data
        const user = getUserData();
        if (user) {
          const profileData = {
            name: user.username || user.name || '',
            email: user.email || '',
            phone: user.phone_number || user.phone || '',
            reporterId: user.reporterId || '',
            reportingArea: user.reportingArea || '',
            department: user.department || '',
            certificationDate: user.certificationDate || '',
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const user = getUserData();
      if (!user?._id) throw new Error('User not found');

      // Update profile in MongoDB
      await axios.put(`http://localhost:3000/update-profile/${user._id}`, {
        username: editedProfile.name,
        phone_number: editedProfile.phone,
        reportingArea: editedProfile.reportingArea,
        department: editedProfile.department,
      });

      setProfile(editedProfile);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
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

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
                <Typography variant="h4">{profile.name || 'Stamp Reporter'}</Typography>
                <Typography variant="subtitle1">Stamp Reporter</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Reporter ID: {profile.reporterId || 'N/A'}
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
                  label="Reporter ID"
                  value={editedProfile.reporterId}
                  disabled={true}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editedProfile.email}
                  disabled={true}
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
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Court</InputLabel>
                  <Select
                    value={editedProfile.reportingArea}
                    label="Court"
                    onChange={(e) => setEditedProfile({ ...editedProfile, reportingArea: e.target.value })}
                  >
                    <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                    <MenuItem value="High Court">High Court</MenuItem>
                    <MenuItem value="District Court">District Court</MenuItem>
                    <MenuItem value="Sessions Court">Sessions Court</MenuItem>
                    <MenuItem value="Magistrate Court">Magistrate Court</MenuItem>
                    <MenuItem value="Tribunal">Tribunal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={editedProfile.department}
                    label="Department"
                    onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                  >
                    <MenuItem value="Civil">Civil</MenuItem>
                    <MenuItem value="Criminal">Criminal</MenuItem>
                    <MenuItem value="Family">Family</MenuItem>
                    <MenuItem value="Corporate">Corporate</MenuItem>
                    <MenuItem value="Constitutional">Constitutional</MenuItem>
                    <MenuItem value="Revenue">Revenue</MenuItem>
                    <MenuItem value="Labour">Labour</MenuItem>
                    <MenuItem value="Consumer">Consumer</MenuItem>
                    <MenuItem value="Taxation">Taxation</MenuItem>
                    <MenuItem value="Cyber">Cyber</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Certification Date"
                  value={editedProfile.certificationDate}
                  disabled={true}
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
        </>
      )}
    </Box>
  );
};

export default Profile;

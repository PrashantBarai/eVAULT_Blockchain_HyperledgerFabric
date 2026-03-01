import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
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
    department: '',
    position: '',
    joinDate: '',
    employeeId: '',
    courtSection: '',
  });

  const [editedData, setEditedData] = useState({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userId) throw new Error('User data not found.');

        const res = await fetch(`http://localhost:3000/get-profile/${userId}`);
        if (!res.ok) throw new Error('Unable to load profile');
        const data = await res.json();

        if (data.profile) {
          const p = data.profile;
          const profileData = {
            name: p.name || p.username || user?.username || '',
            email: p.email || user?.email || '',
            phone: p.phone || p.phone_number || user?.phone_number || '',
            department: p.department || p.courtSection || '',
            position: p.position || 'Bench Clerk',
            joinDate: p.joinDate || p.joiningDate || '',
            employeeId: p.employeeId || p.clerkId || user?.clerkId || '',
            courtSection: p.courtSection || '',
          };
          setProfile(profileData);
          setEditedData(profileData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Fallback to session data
        if (user) {
          const fallback = {
            name: user.username || '',
            email: user.email || '',
            phone: user.phone_number || '',
            department: user.courtSection || '',
            position: 'Bench Clerk',
            joinDate: user.joiningDate || '',
            employeeId: user.clerkId || '',
            courtSection: user.courtSection || '',
          };
          setProfile(fallback);
          setEditedData(fallback);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...profile });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...editedData,
        userId: userId,
      };

      const res = await fetch('http://localhost:3000/lawyer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      setProfile({ ...editedData });
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
    setEditedData({ ...profile });
  };

  const handleChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value,
    });
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
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)',
          color: 'white',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '2.5rem',
            }}
          >
            <PersonIcon sx={{ fontSize: 50 }} />
          </Avatar>
          <Box>
            <Typography variant="h4">{profile.name || 'Bench Clerk'}</Typography>
            <Typography variant="subtitle1">{profile.position}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Employee ID: {profile.employeeId || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Profile Information</Typography>
          {!isEditing ? (
            <Button
              startIcon={<EditIcon />}
              onClick={handleEdit}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                variant="contained"
                disabled={saving}
                sx={{
                  mr: 1,
                  background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                variant="outlined"
                color="error"
                disabled={saving}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Personal Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={isEditing ? editedData.name : profile.name}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={isEditing ? editedData.email : profile.email}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={isEditing ? editedData.phone : profile.phone}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={isEditing ? editedData.employeeId : profile.employeeId}
              disabled
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
          Professional Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Department / Court Section"
              name="department"
              value={isEditing ? editedData.department : profile.department}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Position"
              name="position"
              value={isEditing ? editedData.position : profile.position}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Court Section"
              name="courtSection"
              value={isEditing ? editedData.courtSection : profile.courtSection}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Joining Date"
              name="joinDate"
              value={isEditing ? editedData.joinDate : profile.joinDate}
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
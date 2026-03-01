import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
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
    designation: '',
    courtName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    specialization: '',
    appointmentDate: '',
    judgementExpertise: '',
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

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
            designation: p.designation || 'Judge',
            courtName: p.courtName || p.courtAssigned || user?.courtAssigned || '',
            email: p.email || user?.email || '',
            phone: p.phone || p.phone_number || user?.phone_number || '',
            location: p.location || p.address || '',
            experience: p.experience || '',
            specialization: p.specialization || p.judgementExpertise || user?.judgementExpertise || '',
            appointmentDate: p.appointmentDate || user?.appointmentDate || '',
            judgementExpertise: p.judgementExpertise || user?.judgementExpertise || '',
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Fallback to session data
        if (user) {
          const fallback = {
            name: user.username || '',
            designation: 'Judge',
            courtName: user.courtAssigned || '',
            email: user.email || '',
            phone: user.phone_number || '',
            location: user.address || '',
            experience: '',
            specialization: user.judgementExpertise || '',
            appointmentDate: user.appointmentDate || '',
            judgementExpertise: user.judgementExpertise || '',
          };
          setProfile(fallback);
          setEditedProfile(fallback);
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
    setEditedProfile({ ...profile });
  };

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

  const handleChange = (field) => (event) => {
    setEditedProfile({
      ...editedProfile,
      [field]: event.target.value,
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Parse expertise into tags
  const expertiseTags = profile.judgementExpertise
    ? profile.judgementExpertise.split(',').map(e => e.trim()).filter(Boolean)
    : [];

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

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#fff',
                color: '#1a237e',
              }}
            >
              <GavelIcon sx={{ fontSize: 50 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {profile.name || 'Judge'}
              </Typography>
              <Typography variant="h6">
                {profile.designation} {profile.courtName ? `• ${profile.courtName}` : ''}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Personal Information</Typography>
                {!isEditing ? (
                  <IconButton onClick={handleEdit} color="primary">
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton onClick={handleSave} color="primary" disabled={saving}>
                      {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    </IconButton>
                    <IconButton onClick={handleCancel} color="error" disabled={saving}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={isEditing ? editedProfile.name : profile.name}
                    onChange={handleChange('name')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={isEditing ? editedProfile.email : profile.email}
                    disabled
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={isEditing ? editedProfile.phone : profile.phone}
                    onChange={handleChange('phone')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={isEditing ? editedProfile.location : profile.location}
                    onChange={handleChange('location')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <LocationOnIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Court Assigned"
                    value={isEditing ? editedProfile.courtName : profile.courtName}
                    onChange={handleChange('courtName')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <WorkIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Specialization / Expertise"
                    value={isEditing ? editedProfile.specialization : profile.specialization}
                    onChange={handleChange('specialization')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <BadgeIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience"
                    value={isEditing ? editedProfile.experience : profile.experience}
                    onChange={handleChange('experience')}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Appointment Date"
                    value={isEditing ? editedProfile.appointmentDate : profile.appointmentDate}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Expertise Tags */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Areas of Expertise
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {expertiseTags.length > 0 ? (
                  expertiseTags.map((exp, index) => (
                    <Chip
                      key={index}
                      label={exp}
                      color="primary"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No expertise tags set. Edit your profile to add your areas of expertise.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Designation
              </Typography>
              <TextField
                fullWidth
                label="Designation"
                value={isEditing ? editedProfile.designation : profile.designation}
                onChange={handleChange('designation')}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
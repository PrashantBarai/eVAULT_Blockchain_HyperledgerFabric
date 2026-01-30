import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import { getUserData } from '../../utils/auth';

const Profile = () => {

  // ✅ Get userId from auth utility
  const user = getUserData();
  const userId = user?._id; 
  console.log(userId)
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    barNumber: '',
    specialization: '',
    experience: '',
    address: '',
    bio: '',
  });

  // 🔥 LOAD PROFILE ON PAGE LOAD
  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`http://localhost:3000/get-profile/${userId}`);
      if (!res.ok) throw new Error("Unable to load profile");

      const data = await res.json();
      console.log('Loaded profile data:', data);
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  // Handle changes
  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save profile
  const handleSave = async () => {
    try {
      const payload = {
        ...profile,
        userId: userId,   // ← include logged-in user's id
      };

      const res = await fetch("http://localhost:3000/lawyer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card
        sx={{
          borderRadius: 2,
          background: 'linear-gradient(145deg, #6B5ECD11 0%, #8B7CF711 100%)',
          mb: 4,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid white',
                  boxShadow: 2,
                }}
                // src="/path-to-profile-image.jpg"
              />

              {/* Only UI - No Upload */}
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
                size="small"
              >
                <PhotoCamera />
              </IconButton>
            </Box>

            <Box sx={{ ml: 3 }}>
              <Typography variant="h4">{profile.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {profile.specialization}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              sx={{
                ml: 'auto',
                background: 'linear-gradient(45deg, #6B5ECD 30%, #8B7CF7 90%)',
                color: 'white',
              }}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={profile.name}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <TextField
                fullWidth
                label="Bar Registration Number"
                value={profile.barNumber}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("barNumber", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Specialization"
                value={profile.specialization}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("specialization", e.target.value)}
              />
              <TextField
                fullWidth
                label="Years of Experience"
                value={profile.experience}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("experience", e.target.value)}
              />
              <TextField
                fullWidth
                label="Address"
                value={profile.address}
                disabled={!isEditing}
                sx={{ mb: 2 }}
                onChange={(e) => handleChange("address", e.target.value)}
              />
              <TextField
                fullWidth
                label="Bio"
                value={profile.bio}
                disabled={!isEditing}
                multiline
                rows={4}
                onChange={(e) => handleChange("bio", e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          {/* Add recent activity list */}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;

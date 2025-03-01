import React, { useState } from 'react';
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

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@lawfirm.com',
    phone: '+91 9876543210',
    barNumber: 'BAR123456',
    specialization: 'Criminal Law',
    experience: '10 years',
    address: '123 Law Street, Mumbai, India',
    bio: 'Experienced criminal lawyer with a track record of handling high-profile cases.',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically make an API call to save the profile
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ 
        borderRadius: 2,
        background: 'linear-gradient(145deg, #6B5ECD11 0%, #8B7CF711 100%)',
        mb: 4 
      }}>
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
                src="/path-to-profile-image.jpg"
              />
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
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
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
              />
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Bar Registration Number"
                value={profile.barNumber}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Specialization"
                value={profile.specialization}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Years of Experience"
                value={profile.experience}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Address"
                value={profile.address}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Bio"
                value={profile.bio}
                disabled={!isEditing}
                multiline
                rows={4}
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
          {/* Add recent activity content here */}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;

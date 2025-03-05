import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  School as SchoolIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Hon. Justice Sarah Mitchell',
    designation: 'Senior Judge',
    courtName: 'High Court of Maharashtra',
    email: 'justice.mitchell@courts.gov.in',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    experience: '15 years',
    specialization: 'Civil Law',
    education: [
      'LL.B., Government Law College, Mumbai',
      'LL.M. in Constitutional Law, National Law School of India University',
    ],
    expertise: [
      'Constitutional Law',
      'Civil Law',
      'Property Law',
      'Contract Law',
      'Family Law',
    ],
    recentActivity: [
      {
        type: 'Case Ruling',
        description: 'Property Dispute Resolution',
        date: '2025-03-05',
      },
      {
        type: 'Case Review',
        description: 'Contract Violation Case',
        date: '2025-03-04',
      },
      {
        type: 'Document Verification',
        description: 'Family Property Division',
        date: '2025-03-03',
      },
    ],
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
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

  return (
    <Box sx={{ p: 3 }}>
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
                {profile.name}
              </Typography>
              <Typography variant="h6">
                {profile.designation} • {profile.courtName}
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
                    <IconButton onClick={handleSave} color="primary">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleCancel} color="error">
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
                    onChange={handleChange('email')}
                    disabled={!isEditing}
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
                    label="Experience"
                    value={isEditing ? editedProfile.experience : profile.experience}
                    onChange={handleChange('experience')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <WorkIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={isEditing ? editedProfile.specialization : profile.specialization}
                    onChange={handleChange('specialization')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <BadgeIcon sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Education and Expertise */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Education
              </Typography>
              <List dense>
                {profile.education.map((edu, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <SchoolIcon />
                    </ListItemIcon>
                    <ListItemText primary={edu} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Areas of Expertise
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.expertise.map((exp, index) => (
                  <Chip
                    key={index}
                    label={exp}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {profile.recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        <GavelIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${activity.type} • ${activity.date}`}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;

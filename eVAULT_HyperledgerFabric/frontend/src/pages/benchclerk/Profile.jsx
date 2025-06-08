import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Smith',
    email: 'john.smith@courts.gov',
    phone: '+1 (555) 123-4567',
    department: 'Civil Court Division',
    position: 'Senior Bench Clerk',
    joinDate: '2020-01-15',
    employeeId: 'BC-2020-001',
    address: '123 Judicial Avenue, Courtroom 5',
  });

  const [editedData, setEditedData] = useState({ ...profileData });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData({ ...editedData });
    setIsEditing(false);
    // TODO: Implement API call to save changes
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profileData });
  };

  const handleChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)',
          color: 'white',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '2.5rem',
            }}
          >
            {profileData.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4">{profileData.name}</Typography>
            <Typography variant="subtitle1">{profileData.position}</Typography>
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
                startIcon={<SaveIcon />}
                onClick={handleSave}
                variant="contained"
                sx={{
                  mr: 1,
                  background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
                }}
              >
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outlined"
                color="error"
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={isEditing ? editedData.name : profileData.name}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={isEditing ? editedData.email : profileData.email}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={isEditing ? editedData.phone : profileData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={isEditing ? editedData.department : profileData.department}
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
              value={isEditing ? editedData.position : profileData.position}
              onChange={handleChange}
              disabled={!isEditing}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Join Date"
              name="joinDate"
              value={isEditing ? editedData.joinDate : profileData.joinDate}
              onChange={handleChange}
              disabled={true}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={isEditing ? editedData.employeeId : profileData.employeeId}
              onChange={handleChange}
              disabled={true}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={isEditing ? editedData.address : profileData.address}
              onChange={handleChange}
              disabled={!isEditing}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;

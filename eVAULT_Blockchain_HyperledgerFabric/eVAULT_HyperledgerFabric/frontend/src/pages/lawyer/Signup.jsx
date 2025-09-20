import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userData = {
      username,
      email,
      phone_number: phoneNumber, // Change to snake_case
      password,
      user_type: userType, // Change to snake_case
    };
  
    try {
      const response = await fetch('http://127.0.0.1:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Signup successful:', data);
        if (data.userType=='lawyer'){
          navigate('/lawyer/login');
        }else if (data.userType=='registrar'){
          navigate('/registrar/login');
        }else if (data.userType=='stamp-reporter'){
          navigate('/stampreporter/login');
        }else if (data.userType=='bench-clerk'){
          navigate('/benchclerk/login');
        }else if (data.userType=='judge'){
          navigate('/judge/login');
        }
        // navigate('/'); 
      } else {
        const errorData = await response.json();
        console.error('Signup failed:', errorData);
        alert(`Signup failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during signup:', error);
      alert('An error occurred during signup. Please try again.');
    }
  };

  // Navbar component
  const Navbar = () => (
    <AppBar position="static" sx={{ bgcolor: '#3f51b5' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          eVault
        </Typography>
        <Button color="inherit" onClick={() => navigate('/login')}>
          Login
        </Button>
      </Toolbar>
    </AppBar>
  );

  return (
    <Container component="main" maxWidth="xs">
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#3f51b5' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Lawyer Signup
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="user-type-label">User Type</InputLabel>
              <Select
                labelId="user-type-label"
                id="user-type"
                value={userType}
                label="User Type"
                onChange={(e) => setUserType(e.target.value)}
              >
                <MenuItem value="lawyer">Lawyer</MenuItem>
                <MenuItem value="registrar">Registrar</MenuItem>
                <MenuItem value="stamp-reporter">Stamp Reporter</MenuItem>
                <MenuItem value="bench-clerk">Bench Clerk</MenuItem>
                <MenuItem value="judge">Judge</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                bgcolor: '#3f51b5',
                '&:hover': {
                  bgcolor: '#2f3f8f',
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
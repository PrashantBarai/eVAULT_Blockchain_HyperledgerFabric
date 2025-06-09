import { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link as MuiLink,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';

const FinalLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Define role-based dashboard paths
  const roleDashboardPaths = {
    lawyer: '/lawyer/dashboard',
    judge: '/judge/dashboard',
    benchclerk: '/benchclerk/dashboard',
    registrar: '/registrar/dashboard',
    stampreporter: '/stampreporter/dashboard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!role) {
      setError('Please select a role');
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    // For roles that require license ID
    if (['lawyer', 'judge', 'benchclerk', 'registrar', 'stampreporter'].includes(role) && !licenseId) {
      setError('License ID is required for this role');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/', {
        email,
        password,
      });

      const { access_token, user_data } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user_data));
      localStorage.setItem('user_role', role);

      // Navigate to the appropriate dashboard based on role
      if (roleDashboardPaths[role]) {
        navigate(roleDashboardPaths[role]);
      } else {
        navigate('/'); // Fallback for unknown roles
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: 2,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <Avatar 
            sx={{ 
              m: 1, 
              width: 56, 
              height: 56,
              bgcolor: '#3f51b5',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          <Typography 
            component="h1" 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: '#1a237e',
              textAlign: 'center'
            }}
          >
            eVAULT Login
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                borderRadius: 1
              }}
            >
              {error}
            </Alert>
          )}
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 1, 
              width: '100%' 
            }}
          >
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3f51b5',
                  },
                },
              }}
            >
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="lawyer">Lawyer</MenuItem>
                <MenuItem value="judge">Judge</MenuItem>
                <MenuItem value="benchclerk">Bench Clerk</MenuItem>
                <MenuItem value="registrar">Registrar</MenuItem>
                <MenuItem value="stampreporter">Stamp Reporter</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3f51b5',
                  },
                },
              }}
            />
            
            {['lawyer', 'judge', 'benchclerk', 'registrar', 'stampreporter'].includes(role) && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="License ID"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#3f51b5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3f51b5',
                    },
                  },
                }}
              />
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3f51b5',
                  },
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #303f9f 30%, #3f51b5 90%)',
                boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #283593 30%, #303f9f 90%)',
                  boxShadow: '0 4px 6px 2px rgba(63, 81, 181, .5)',
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  '& a': {
                    color: '#3f51b5',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                }}
              >
                Don&apos;t have an account?{' '}
                <MuiLink component={Link} to="/signup">
                  Sign Up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default FinalLogin;
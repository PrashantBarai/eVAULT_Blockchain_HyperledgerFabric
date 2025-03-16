// import React, { useState } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   TextField,
//   Button,
//   Container,
//   Avatar,
// } from '@mui/material';
// import {
//   LockOutlined as LockOutlinedIcon,
// } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // TODO: Add actual authentication logic
//     navigate('/benchclerk/dashboard');
//   };

//   return (
//     <Container component="main" maxWidth="xs">
//       <Box
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           background: 'linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)',
//         }}
//       >
//         <Paper
//           elevation={3}
//           sx={{
//             p: 4,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             background: 'rgba(255, 255, 255, 0.95)',
//             backdropFilter: 'blur(10px)',
//             borderRadius: 2,
//           }}
//         >
//           <Avatar sx={{ m: 1, bgcolor: '#4a90e2' }}>
//             <LockOutlinedIcon />
//           </Avatar>
//           <Typography component="h1" variant="h5" sx={{ mb: 3, color: '#4a90e2' }}>
//             Bench Clerk Login
//           </Typography>
//           <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               label="Email Address"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               label="Password"
//               type="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ 
//                 mt: 3, 
//                 mb: 2,
//                 background: 'linear-gradient(45deg, #4a90e2 30%, #8e44ad 90%)',
//                 '&:hover': {
//                   background: 'linear-gradient(45deg, #357abd 30%, #693380 90%)',
//                 }
//               }}
//             >
//               Sign In
//             </Button>
//           </Box>
//         </Paper>
//       </Box>
//     </Container>
//   );
// };

// export default Login;

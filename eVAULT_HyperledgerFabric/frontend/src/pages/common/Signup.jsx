import { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Link as MuiLink,
  Alert,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PersonAddOutlined as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    // Common fields
    fullName: '',
    email: '',
    licenseId: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    address: '',
    
    // Lawyer-specific fields
    barCouncilNumber: '',
    practicingAreas: '',
    experienceYears: '',
    
    // Judge-specific fields
    courtAssigned: '',
    judgementExpertise: '',
    appointmentDate: '',
    
    // Bench Clerk-specific fields
    courtSection: '',
    clerkId: '',
    joiningDate: '',
    
    // Registrar-specific fields
    registrarId: '',
    department: '',
    designation: '',
    
    // Stamp Reporter-specific fields
    reporterId: '',
    reportingArea: '',
    certificationDate: '',
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!role) newErrors.role = 'Please select a role';
    } else if (step === 1) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.licenseId) newErrors.licenseId = 'License ID is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    } else if (step === 2) {
      // Role-specific validation
      if (role === 'lawyer') {
        if (!formData.barCouncilNumber) newErrors.barCouncilNumber = 'Bar Council Number is required';
        if (!formData.practicingAreas) newErrors.practicingAreas = 'Practicing areas are required';
      } else if (role === 'judge') {
        if (!formData.courtAssigned) newErrors.courtAssigned = 'Court assignment is required';
        if (!formData.judgementExpertise) newErrors.judgementExpertise = 'Judgement expertise is required';
      } else if (role === 'benchclerk') {
        if (!formData.courtSection) newErrors.courtSection = 'Court section is required';
        if (!formData.clerkId) newErrors.clerkId = 'Clerk ID is required';
      } else if (role === 'registrar') {
        if (!formData.registrarId) newErrors.registrarId = 'Registrar ID is required';
        if (!formData.department) newErrors.department = 'Department is required';
      } else if (role === 'stampreporter') {
        if (!formData.reporterId) newErrors.reporterId = 'Reporter ID is required';
        if (!formData.reportingArea) newErrors.reportingArea = 'Reporting area is required';
      }
    } else if (step === 3) {
      if (documents.length === 0) newErrors.documents = 'Please upload at least one document';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(activeStep) && activeStep === steps.length - 1) {
      // In a real application, this would send the data to the server
      console.log('Form submitted:', formData);
      console.log('Documents:', documents);
      
      // Show success message
      setSuccessMessage(`Registration successful! Your ${role} account is pending approval.`);
      
      // Only redirect after explicit form submission
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      // If not on the final step, treat as "Next" button
      handleNext();
    }
  };

  const steps = ['Select Role', 'Basic Information', 'Role-specific Details', 'Document Upload', 'Review & Submit'];

  const getRoleSpecificFields = () => {
    const textFieldSx = {
      '& .MuiOutlinedInput-root': {
        '&:hover fieldset': {
          borderColor: '#3f51b5',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#3f51b5',
        },
      },
    };

    switch (role) {
      case 'lawyer':
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Bar Council Number"
              name="barCouncilNumber"
              value={formData.barCouncilNumber}
              onChange={handleChange}
              error={!!errors.barCouncilNumber}
              helperText={errors.barCouncilNumber}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Practicing Areas"
              name="practicingAreas"
              placeholder="e.g., Criminal, Civil, Corporate"
              value={formData.practicingAreas}
              onChange={handleChange}
              error={!!errors.practicingAreas}
              helperText={errors.practicingAreas}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Years of Experience"
              name="experienceYears"
              type="number"
              value={formData.experienceYears}
              onChange={handleChange}
              error={!!errors.experienceYears}
              helperText={errors.experienceYears}
              sx={textFieldSx}
            />
          </>
        );
      
      case 'judge':
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Court Assigned"
              name="courtAssigned"
              value={formData.courtAssigned}
              onChange={handleChange}
              error={!!errors.courtAssigned}
              helperText={errors.courtAssigned}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Judgement Expertise"
              name="judgementExpertise"
              placeholder="e.g., Constitutional, Criminal, Civil"
              value={formData.judgementExpertise}
              onChange={handleChange}
              error={!!errors.judgementExpertise}
              helperText={errors.judgementExpertise}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Appointment Date"
              name="appointmentDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.appointmentDate}
              onChange={handleChange}
              error={!!errors.appointmentDate}
              helperText={errors.appointmentDate}
              sx={textFieldSx}
            />
          </>
        );
      
      case 'benchclerk':
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Court Section"
              name="courtSection"
              value={formData.courtSection}
              onChange={handleChange}
              error={!!errors.courtSection}
              helperText={errors.courtSection}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Clerk ID"
              name="clerkId"
              value={formData.clerkId}
              onChange={handleChange}
              error={!!errors.clerkId}
              helperText={errors.clerkId}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Joining Date"
              name="joiningDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.joiningDate}
              onChange={handleChange}
              error={!!errors.joiningDate}
              helperText={errors.joiningDate}
              sx={textFieldSx}
            />
          </>
        );
      
      case 'registrar':
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Registrar ID"
              name="registrarId"
              value={formData.registrarId}
              onChange={handleChange}
              error={!!errors.registrarId}
              helperText={errors.registrarId}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              error={!!errors.department}
              helperText={errors.department}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              error={!!errors.designation}
              helperText={errors.designation}
              sx={textFieldSx}
            />
          </>
        );
      
      case 'stampreporter':
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Reporter ID"
              name="reporterId"
              value={formData.reporterId}
              onChange={handleChange}
              error={!!errors.reporterId}
              helperText={errors.reporterId}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Reporting Area"
              name="reportingArea"
              value={formData.reportingArea}
              onChange={handleChange}
              error={!!errors.reportingArea}
              helperText={errors.reportingArea}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Certification Date"
              name="certificationDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.certificationDate}
              onChange={handleChange}
              error={!!errors.certificationDate}
              helperText={errors.certificationDate}
              sx={textFieldSx}
            />
          </>
        );
      
      default:
        return null;
    }
  };

  const getStepContent = (step) => {
    const textFieldSx = {
      '& .MuiOutlinedInput-root': {
        '&:hover fieldset': {
          borderColor: '#3f51b5',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#3f51b5',
        },
      },
    };

    switch (step) {
      case 0:
        return (
          <FormControl 
            fullWidth 
            margin="normal" 
            required 
            error={!!errors.role}
            sx={textFieldSx}
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
            {errors.role && <Typography color="error" variant="caption">{errors.role}</Typography>}
          </FormControl>
        );
      
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="License ID"
              name="licenseId"
              value={formData.licenseId}
              onChange={handleChange}
              error={!!errors.licenseId}
              helperText={errors.licenseId}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={textFieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              error={!!errors.contactNumber}
              helperText={errors.contactNumber}
              sx={textFieldSx}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={3}
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              sx={textFieldSx}
            />
          </>
        );
      
      case 2:
        return getRoleSpecificFields();
      
      case 3:
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, color: '#1a237e' }}>
              Please upload the required documents:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {role === 'lawyer' && 'Bar Council Certificate, Government ID, Educational Certificates'}
              {role === 'judge' && 'Appointment Letter, Government ID, Educational Certificates'}
              {role === 'benchclerk' && 'Appointment Letter, Government ID, Educational Certificates'}
              {role === 'registrar' && 'Appointment Letter, Government ID, Educational Certificates'}
              {role === 'stampreporter' && 'Certification, Government ID, Educational Certificates'}
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ 
                my: 2,
                color: '#3f51b5',
                borderColor: '#3f51b5',
                '&:hover': {
                  borderColor: '#303f9f',
                  backgroundColor: 'rgba(63, 81, 181, 0.08)',
                },
              }}
            >
              Upload Documents
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
            
            {documents.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(63, 81, 181, 0.05)', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#303f9f', fontWeight: 500 }}>Uploaded Files:</Typography>
                {documents.map((file, index) => (
                  <Typography key={index} variant="body2">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Typography>
                ))}
              </Box>
            )}
            
            {errors.documents && (
              <Typography color="error" variant="caption">
                {errors.documents}
              </Typography>
            )}
          </Box>
        );
      
      case 4:
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e', fontWeight: 600 }}>
              Review Your Information
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Role:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Full Name:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.fullName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Email:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.email}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>License ID:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.licenseId}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Contact Number:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.contactNumber}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Address:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.address}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(63, 81, 181, 0.2)' }} />
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: '#1a237e', fontWeight: 500 }}>
                  Role-specific Information
                </Typography>
              </Grid>
              
              {role === 'lawyer' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Bar Council Number:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.barCouncilNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Practicing Areas:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.practicingAreas}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Experience (Years):</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.experienceYears}
                    </Typography>
                  </Grid>
                </>
              )}
              
              {role === 'judge' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Court Assigned:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.courtAssigned}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Judgement Expertise:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.judgementExpertise}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#3f51b5' }}>Appointment Date:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {formData.appointmentDate}
                    </Typography>
                  </Grid>
                </>
              )}
              
              {/* Similar sections for other roles */}
              
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(63, 81, 181, 0.2)' }} />
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: '#1a237e', fontWeight: 500 }}>
                  Documents Uploaded
                </Typography>
                {documents.length > 0 ? (
                  documents.map((file, index) => (
                    <Typography key={index} variant="body2">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="error">
                    No documents uploaded
                  </Typography>
                )}
              </Grid>
            </Grid>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              By clicking &apos;Submit&apos;, you confirm that all the information provided is accurate and agree to the terms and conditions of eVAULT.
            </Typography>
          </Box>
        );
      
      default:
        return 'Unknown step';
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
        maxWidth="md"
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
            <PersonAddIcon fontSize="large" />
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
            Register for eVAULT
          </Typography>
          
          {successMessage && (
            <Alert 
              severity="success" 
              sx={{ 
                width: '100%', 
                mb: 3,
                borderRadius: 1 
              }}
            >
              {successMessage}
            </Alert>
          )}
          
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ 
              width: '100%', 
              mb: 4,
              '& .MuiStepLabel-root .Mui-completed': {
                color: '#3f51b5', 
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: '#3f51b5', 
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box 
            component="form" 
            sx={{ 
              mt: 1, 
              width: '100%' 
            }} 
            onSubmit={handleSubmit}
          >
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{
                  color: '#3f51b5',
                  '&:hover': {
                    backgroundColor: 'rgba(63, 81, 181, 0.08)',
                  },
                }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    py: 1,
                    px: 3,
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
                  Submit
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    py: 1,
                    px: 3,
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
                  Next
                </Button>
              )}
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
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
              Already have an account?{' '}
              <MuiLink component={Link} to="/">
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;

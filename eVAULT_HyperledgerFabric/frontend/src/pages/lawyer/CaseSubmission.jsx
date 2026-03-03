import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getUserData, getAuthToken } from '../../utils/auth';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '1200px',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const UploadArea = styled(Box)(({ theme }) => ({
  border: '2px dashed #6B5ECD',
  borderRadius: '12px',
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: 'rgba(107, 94, 205, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(107, 94, 205, 0.1)',
  },
}));

const FilePreview = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  background: 'rgba(107, 94, 205, 0.05)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&:hover fieldset': {
      borderColor: '#6B5ECD',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6B5ECD',
    },
  },
}));

const CaseSubmission = () => {
  const [formData, setFormData] = useState({
    uidParty1: '',
    uidParty2: '',
    filedDate: null,
    associatedLawyers: '',
    caseSubject: '',
    latestUpdate: '',
    client: '',
    caseType: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if required fields are filled
  const isFormValid =
    formData.uidParty1.trim() !== '' &&
    formData.uidParty2.trim() !== '' &&
    formData.caseSubject.trim() !== '' &&
    formData.client.trim() !== '' &&
    formData.caseType.trim() !== '' &&
    formData.description.trim() !== '' &&
    files.length > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Log all form details before submission
    console.log('Case Submission Form Data:', formData);
    console.log('Uploaded Files:', files);

    // Get user from auth utility
    const user = getUserData();
    if (!user) {
      alert('Please login to submit a case');
      return;
    }

    if (!isFormValid) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    console.log(user);

    // Upload files to IPFS and get CIDs
    let documents = [];
    if (files.length > 0) {
      try {
        for (const file of files) {
          const formDataForIPFS = new FormData();
          formDataForIPFS.append('file', file);

          // Upload to IPFS via FastAPI backend (secure - API keys hidden)
          const ipfsResponse = await fetch('http://localhost:3000/upload-to-ipfs', {
            method: 'POST',
            body: formDataForIPFS,
          });

          if (ipfsResponse.ok) {
            const ipfsResult = await ipfsResponse.json();
            documents.push({
              id: `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: file.type || 'application/octet-stream',
              hash: ipfsResult.ipfsHash,
              validated: false,
              uploadedAt: new Date().toISOString(),
              signatureHistory: []
            });
            console.log('File uploaded to IPFS via Pinata:', ipfsResult.ipfsHash);
          } else {
            const errorText = await ipfsResponse.text();
            console.error('IPFS upload failed for file:', file.name, errorText);
          }
        }
      } catch (ipfsError) {
        console.error('Error uploading to IPFS:', ipfsError);
        alert('Failed to upload files to IPFS. Creating case without documents.');
      }
    }

    // Send as JSON instead of FormData
    const jsonData = {
      uid_party1: formData.uidParty1,
      uid_party2: formData.uidParty2,
      filed_date: formData.filedDate,
      associated_lawyers: formData.associatedLawyers,
      associated_judge: '',
      case_subject: formData.caseSubject,
      latest_update: formData.latestUpdate,
      status: 'pending',
      user_id: user._id,
      user_name: user.name || user.username || 'Unknown Lawyer',
      client: formData.client,
      case_type: formData.caseType,
      description: formData.description,
      documents: documents
    };

    console.log('Sending JSON data:', jsonData);

    try {
      const response = await fetch('http://localhost:8000/api/lawyer/case/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });
      console.log(response);
      if (!response.ok) {
        throw new Error('Failed to create case');
      }
      const result = await response.json();
      console.log('Blockchain response:', result);

      // Link the case to user in MongoDB
      if (result.case_id) {
        try {
          const linkData = new FormData();
          linkData.append('case_id', result.case_id);
          linkData.append('user_type', user.user_type || 'lawyer');
          linkData.append('username', user.username || user.name);
          linkData.append('license_id', user.licenseId || user.license_id || '');
          linkData.append('email', user.email);

          const linkResponse = await fetch('http://localhost:3000/link-case', {
            method: 'POST',
            body: linkData
          });

          if (linkResponse.ok) {
            const linkResult = await linkResponse.json();
            console.log('Case linked to user in MongoDB:', linkResult);
          } else {
            console.error('Failed to link case to user');
          }
        } catch (linkError) {
          console.error('Error linking case:', linkError);
        }
      }

      alert('Case created successfully!');

      // Reset form after successful submission
      setFormData({
        uidParty1: '',
        uidParty2: '',
        filedDate: null,
        associatedLawyers: '',
        caseSubject: '',
        latestUpdate: '',
        client: '',
        caseType: '',
        description: '',
      });
      setFiles([]);

      // Log pending cases info for debugging
      if (result.user?.pending_cases) {
        console.log('Updated pending cases:', result.user.pending_cases);
      }
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setIsSubmitting(false); // Re-enable button on error or success
    }
  };

  return (
    <StyledContainer>
      <Typography variant="h4" gutterBottom sx={{ color: '#2C3E50', mb: 4 }}>
        Case Details
      </Typography>

      <StyledPaper>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', mb: 3 }}>
            Case Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="UID of Party 1"
                name="uidParty1"
                value={formData.uidParty1}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="UID of Party 2"
                name="uidParty2"
                value={formData.uidParty2}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Filed On (Date)"
                  value={formData.filedDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, filedDate: date }))}
                  renderInput={(params) => <StyledTextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="case-type-label">Case Type</InputLabel>
                <Select
                  labelId="case-type-label"
                  id="case-type"
                  name="caseType"
                  value={formData.caseType}
                  label="Case Type"
                  onChange={handleChange}
                >
                  <MenuItem value="civil">Civil</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="family">Family</MenuItem>
                  <MenuItem value="criminal">Criminal</MenuItem>
                  <MenuItem value="property">Property</MenuItem>
                  <MenuItem value="labor">Labor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="Associated Lawyers"
                name="associatedLawyers"
                value={formData.associatedLawyers}
                onChange={handleChange}
                helperText="Enter names separated by commas"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="Client"
                name="client"
                value={formData.client}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Case Subject"
                name="caseSubject"
                value={formData.caseSubject}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Latest Case Update"
                name="latestUpdate"
                value={formData.latestUpdate}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50', mt: 2 }}>
                Uploaded Evidences (Required)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (in format of .jpg, .jpeg, .png, .pdf, .mp4, .mkv, .doc, .txt)
              </Typography>

              <input
                type="file"
                id="file-upload"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.mp4,.mkv,.doc,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <UploadArea>
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#6B5ECD', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                    Drop files here or click to upload (Required)
                  </Typography>
                </UploadArea>
              </label>

              {files.map((file, index) => (
                <FilePreview key={index}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                    sx={{ color: '#4a90e2', mr: 1 }}
                    title="View File"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{ color: '#FF6B6B' }}
                    title="Remove File"
                  >
                    <DeleteIcon />
                  </IconButton>
                </FilePreview>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#6B5ECD',
                    color: '#6B5ECD',
                    borderRadius: '8px',
                    px: 4,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isFormValid || isSubmitting}
                  sx={{
                    background: (!isFormValid || isSubmitting) ? '#ccc' : 'linear-gradient(135deg, #6B5ECD 0%, #8B7CF7 100%)',
                    borderRadius: '8px',
                    px: 4,
                  }}
                >
                  {isSubmitting ? <><CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> Creating...</> : 'Create Case'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </StyledPaper>
    </StyledContainer>
  );
};

export default CaseSubmission;
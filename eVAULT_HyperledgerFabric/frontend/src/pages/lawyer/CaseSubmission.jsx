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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { jwtDecode } from 'jwt-decode';

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
    associatedJudge: '',
    caseSubject: '',
    latestUpdate: '',
    client: '', // New field for client
  });
  const [files, setFiles] = useState([]);

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

    // Retrieve JWT token from localStorage
    const token = localStorage.getItem('token');
    console.log("Token from localStorage:", token);
    if (!token) {
      alert('You must be logged in to submit a case.');
      return;
    }

    const userString = localStorage.getItem('user_data');
    let user = null;
    user = JSON.parse(userString); 
    console.log(user);

    const formDataToSend = new FormData();
    formDataToSend.append('uid_party1', formData.uidParty1);
    formDataToSend.append('uid_party2', formData.uidParty2);
    formDataToSend.append('filed_date', formData.filedDate);
    formDataToSend.append('associated_lawyers', formData.associatedLawyers);
    formDataToSend.append('associated_judge', formData.associatedJudge);
    formDataToSend.append('case_subject', formData.caseSubject);
    formDataToSend.append('latest_update', formData.latestUpdate);
    formDataToSend.append('status', 'open'); 
    formDataToSend.append('user_id', user.user_id); 
    formDataToSend.append('client', formData.client); // Append client field

    files.forEach((file) => {
      formDataToSend.append('files', file);
    });

    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch('http://localhost:8000/submit-case', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      console.log(response);
      if (!response.ok) {
        throw new Error('Failed to submit case');
      }

      const result = await response.json();
      alert('Case submitted successfully!');
      console.log('Case ID:', result.case_id);
    } catch (error) {
      console.error('Error submitting case:', error);
      alert('Failed to submit case. Please try again.');
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
              <StyledTextField
                fullWidth
                label="Associated Lawyers"
                name="associatedLawyers"
                value={formData.associatedLawyers}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="Associated Judge"
                name="associatedJudge"
                value={formData.associatedJudge}
                onChange={handleChange}
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
                Uploaded Evidences
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
                    Drop files here or click to upload
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
                    onClick={() => handleRemoveFile(index)}
                    sx={{ color: '#FF6B6B' }}
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
                  sx={{
                    background: 'linear-gradient(135deg, #6B5ECD 0%, #8B7CF7 100%)',
                    borderRadius: '8px',
                    px: 4,
                  }}
                >
                  Submit Case
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
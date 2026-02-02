import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PictureAsPdf,
  Image,
  VideoLibrary,
  Description,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { getUserData, getAuthToken } from '../../utils/auth';

const DocumentCard = ({ type, name, size }) => {
  const getIcon = () => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf sx={{ fontSize: 40, color: "#f44336" }} />;
      case "image":
        return <Image sx={{ fontSize: 40, color: "#4caf50" }} />;
      case "video":
        return <VideoLibrary sx={{ fontSize: 40, color: "#2196f3" }} />;
      default:
        return <Description sx={{ fontSize: 40, color: "#9e9e9e" }} />;
    }
  };

  return (
    <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
      {getIcon()}
      <Box>
        <Typography variant="subtitle1">{name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {size || "Unknown size"}
        </Typography>
      </Box>
    </Paper>
  );
};

const CaseVerification = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        const user = getUserData();
        
        if (!user) {
          throw new Error('Authentication required');
        }

        // Fetch case details from blockchain API
        const response = await fetch(`http://localhost:8000/api/stampreporter/case/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || "Failed to fetch case details");
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const c = data.data;
          setCaseData({
            _id: id,
            case_subject: c.caseSubject || c.title || 'Untitled Case',
            case_type: c.caseType || 'N/A',
            associated_lawyers: c.associatedLawyers?.join(', ') || c.createdBy || 'N/A',
            filed_date: c.filedDate || c.createdAt,
            description: c.description || 'No description provided',
            status: c.status || 'Pending',
            file_cids: c.fileCids || c.documents || [],
            department: c.department || 'N/A',
            rejected: c.rejected || null,
          });
        } else {
          throw new Error("Case data not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError('');
      const user = getUserData();
      let assignedBenchClerkName = '';
      
      // Step 1: FIRST check if bench clerks exist and assign in MongoDB
      // This prevents blockchain operations if no bench clerk is available
      try {
        const assignResponse = await fetch('http://localhost:3000/assign-case-to-benchclerk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseID: id,
            caseSubject: caseData.case_subject,
            stampReporterEmail: user?.email || ''
          })
        });
        
        const assignData = await assignResponse.json();
        
        if (!assignResponse.ok) {
          const errorMsg = assignData.detail || 'Failed to assign case';
          if (errorMsg.includes('No bench clerks') || assignResponse.status === 404) {
            throw new Error('No Bench Clerk users are registered in the system. Please ensure at least one Bench Clerk account exists before forwarding cases.');
          }
          throw new Error(errorMsg);
        }
        
        if (assignData.success) {
          assignedBenchClerkName = assignData.assigned_benchclerk_name || 'Bench Clerk';
          console.log('Case assigned to bench clerk:', assignData);
        } else {
          throw new Error(assignData.message || 'Failed to assign case');
        }
      } catch (assignErr) {
        console.error('Bench clerk assignment failed:', assignErr);
        throw assignErr;
      }
      
      // Step 2: Call validate-and-forward which does BOTH blockchain operations:
      // 1. ValidateDocuments on registrar-stampreporter-channel
      // 2. ForwardCaseToBenchClerk on stampreporter-benchclerk-channel
      const response = await fetch('http://localhost:8000/api/stampreporter/case/validate-and-forward', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          caseID: id,
          validationDetails: {
            digital_signature: digitalSignature,
            verifiedBy: user?.username || user?.email || 'Stamp Reporter',
            verifiedAt: new Date().toISOString(),
            status: 'VALIDATED_BY_STAMP_REPORTER',
            stampReporterId: user?.licenseId || '',
            stampReporterEmail: user?.email || ''
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Failed to validate and forward case");
      }

      // Step 3: Notify the lawyer about case status update
      try {
        await fetch('http://localhost:3000/notify-lawyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseID: id,
            caseSubject: caseData.case_subject,
            lawyerEmail: caseData.associated_lawyers,
            status: 'FORWARDED_TO_BENCH_CLERK',
            message: `Your case has been validated by Stamp Reporter and forwarded to ${assignedBenchClerkName} for further processing.`,
            updatedBy: user?.username || 'Stamp Reporter'
          })
        });
      } catch (notifyErr) {
        console.warn('Lawyer notification failed:', notifyErr.message);
      }

      // Step 4: Update case status and timeline in MongoDB
      try {
        await fetch('http://localhost:3000/update-case-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseID: id,
            status: 'FORWARDED_TO_BENCH_CLERK',
            timeline: [
              {
                status: 'VALIDATED_BY_STAMP_REPORTER',
                timestamp: new Date().toISOString(),
                updatedBy: user?.username || 'Stamp Reporter',
                comment: `Documents validated with digital signature`
              },
              {
                status: 'FORWARDED_TO_BENCH_CLERK',
                timestamp: new Date().toISOString(),
                updatedBy: user?.username || 'Stamp Reporter',
                comment: `Case forwarded to ${assignedBenchClerkName} for scheduling`
              }
            ]
          })
        });
      } catch (updateErr) {
        console.warn('Case status update failed:', updateErr.message);
      }

      setShowSuccess(true);
      setOpenSignDialog(false);
      
      // Show alert with assigned bench clerk name
      alert(`Case successfully validated and assigned to ${assignedBenchClerkName} for further processing.`);
      
      setTimeout(() => navigate("/stampreporter/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const user = getUserData();
      
      // Call blockchain API to reject the case (with cross-channel sync to lawyer)
      const response = await fetch(`http://localhost:8000/api/stampreporter/case/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          caseID: id,
          reason: rejectReason,
          rejectedBy: user?.name || user?.email || 'Stamp Reporter'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Failed to reject case");
      }

      setShowSuccess(true);
      setOpenRejectDialog(false);
      setTimeout(() => navigate("/stampreporter/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentType = (filename) => {
    if (!filename) return "unknown";
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return "pdf";
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return "image";
    if (['mp4', 'mov', 'avi'].includes(ext)) return "video";
    return "unknown";
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!caseData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Case data not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Case successfully processed! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Case Verification
        </Typography>
        <Typography variant="subtitle1">Case ID: {id}</Typography>
        <Typography variant="subtitle1">Status: {caseData.status}</Typography>
        {caseData.rejected?.status && (
          <Typography variant="subtitle1" color="error.light">
            Rejection Reason: {caseData.rejected.reason}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Case Details
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Case Title
            </Typography>
            <Typography variant="body1">{caseData.case_subject || "N/A"}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Case Type
            </Typography>
            <Typography variant="body1">{caseData.case_type || "N/A"}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Lawyer Information
            </Typography>
            <Typography variant="body1">{caseData.associated_lawyers || "N/A"}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Filed Date
            </Typography>
            <Typography variant="body1">
              {new Date(caseData.filed_date).toLocaleDateString() || "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Description
            </Typography>
            <Typography variant="body1">{caseData.description || "No description provided"}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents
          </Typography>
          <Grid container spacing={2}>
            {caseData.file_cids && caseData.file_cids.length > 0 ? (
              caseData.file_cids.map((file, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Button 
                    component="a"
                    href={`https://lime-occasional-xerinae-665.mypinata.cloud/ipfs/${file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    <DocumentCard
                      type={getDocumentType(file.filename)}
                      name={file.filename || `Document ${index + 1}`}
                      size={file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : null}
                    />
                  </Button>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary">
                  No documents uploaded
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Check if case is already validated/forwarded */}
        {caseData.status && (
          caseData.status.includes('VALIDATED') || 
          caseData.status.includes('FORWARDED') || 
          caseData.status.includes('BENCH_CLERK') ||
          caseData.status.includes('JUDGE')
        ) ? (
          <Alert severity="warning" sx={{ mt: 3 }}>
            This case has already been processed (Status: {caseData.status}). No further action required.
          </Alert>
        ) : null}

        {!(caseData.status && (
          caseData.status.includes('VALIDATED') || 
          caseData.status.includes('FORWARDED') || 
          caseData.status.includes('BENCH_CLERK') ||
          caseData.status.includes('JUDGE') ||
          caseData.status === 'Verified'
        )) && (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setOpenRejectDialog(true)}
              disabled={actionLoading}
            >
              Reject Case
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setOpenSignDialog(true)}
              disabled={actionLoading}
            >
              Validate & Forward to Bench Clerk
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog
        open={openSignDialog}
        onClose={() => !actionLoading && setOpenSignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Digital Signature Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please enter your digital signature to approve and forward this case.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Digital Signature"
            type="password"
            fullWidth
            value={digitalSignature}
            onChange={(e) => setDigitalSignature(e.target.value)}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            color="success"
            disabled={!digitalSignature || actionLoading}
            endIcon={actionLoading && <CircularProgress size={20} />}
          >
            Sign & Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRejectDialog}
        onClose={() => !actionLoading && setOpenRejectDialog(false)}
      >
        <DialogTitle>Reject Case</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            disabled={!rejectReason || actionLoading}
            endIcon={actionLoading && <CircularProgress size={20} />}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseVerification;
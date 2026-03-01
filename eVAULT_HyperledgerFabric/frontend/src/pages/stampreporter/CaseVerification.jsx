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
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PauseCircle as PauseCircleIcon,
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
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // 'reject' or 'on-hold'
  const [actionReason, setActionReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
            case_type: c.type || c.caseType || 'N/A',
            associated_lawyers: c.associatedLawyers?.join(', ') || c.createdBy || 'N/A',
            filed_date: c.filedDate || c.createdAt,
            description: c.description || 'No description provided',
            status: c.status || 'Pending',
            documents: c.documents || [],
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
      
      // Step 1: BLOCKCHAIN FIRST (source of truth)
      // validate-and-forward does ALL blockchain ops + MongoDB update in backend
      const response = await fetch('http://localhost:8000/api/stampreporter/case/validate-and-forward', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // Step 2: Assign case to bench clerk in MongoDB (non-critical)
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
        if (assignData.success) {
          assignedBenchClerkName = assignData.assigned_benchclerk_name || 'Bench Clerk';
        }
      } catch (assignErr) {
        console.warn('MongoDB bench clerk assignment failed (non-critical):', assignErr.message);
      }

      // Step 3: Notify lawyer (non-critical)
      try {
        await fetch('http://localhost:3000/notify-lawyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseID: id,
            caseSubject: caseData.case_subject,
            lawyerEmail: caseData.associated_lawyers,
            status: 'FORWARDED_TO_BENCH_CLERK',
            message: `Your case has been validated by Stamp Reporter and forwarded to ${assignedBenchClerkName || 'Bench Clerk'} for further processing.`,
            updatedBy: user?.username || 'Stamp Reporter'
          })
        });
      } catch (notifyErr) {
        console.warn('Lawyer notification failed:', notifyErr.message);
      }

      // NOTE: MongoDB timeline update is handled by backend after blockchain success

      setShowSuccess(true);
      setSuccessMessage(`Case validated and forwarded to ${assignedBenchClerkName || 'Bench Clerk'} successfully!`);
      setOpenSignDialog(false);
      
      alert(`Case successfully validated and assigned to ${assignedBenchClerkName || 'Bench Clerk'} for further processing.`);
      setTimeout(() => navigate("/stampreporter/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Unified handler for Reject and On Hold actions
   */
  const handleCaseAction = async () => {
    if (!actionType || !actionReason) return;
    
    try {
      setActionLoading(true);
      setError('');
      const user = getUserData();
      
      const isReject = actionType === 'reject';
      const endpoint = isReject 
        ? 'http://localhost:8000/api/stampreporter/case/reject'
        : 'http://localhost:8000/api/stampreporter/case/on-hold';
      
      const body = isReject 
        ? { caseID: id, reason: actionReason, rejectedBy: user?.username || user?.email || 'Stamp Reporter' }
        : { caseID: id, reason: actionReason, heldBy: user?.username || user?.email || 'Stamp Reporter' };

      // Blockchain + MongoDB handled by backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || `Failed to ${isReject ? 'reject' : 'put on hold'} case`);
      }

      // Notify lawyer (non-critical)
      try {
        const statusLabel = isReject ? 'Rejected by Stamp Reporter' : 'Put On Hold by Stamp Reporter';
        await fetch('http://localhost:3000/notify-lawyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseID: id,
            caseSubject: caseData.case_subject,
            lawyerEmail: caseData.associated_lawyers,
            status: isReject ? 'REJECTED_BY_STAMP_REPORTER' : 'ON_HOLD_BY_STAMP_REPORTER',
            message: `Your case has been ${statusLabel.toLowerCase()}. Reason: ${actionReason}`,
            updatedBy: user?.username || 'Stamp Reporter'
          })
        });
      } catch (notifyErr) {
        console.warn('Lawyer notification failed:', notifyErr.message);
      }

      const statusMsg = isReject ? 'rejected' : 'put on hold';
      setSuccessMessage(`Case successfully ${statusMsg}!`);
      setShowSuccess(true);
      setOpenActionDialog(false);
      
      alert(`Case successfully ${statusMsg}. Reason: ${actionReason}`);
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
          {successMessage || 'Case successfully processed!'} Redirecting...
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
            {caseData.documents && caseData.documents.length > 0 ? (
              caseData.documents.map((doc, index) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id || index}>
                  <Button 
                    component="a"
                    href={doc.hash ? `https://lime-occasional-xerinae-665.mypinata.cloud/ipfs/${doc.hash}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    <DocumentCard
                      type={getDocumentType(doc.name)}
                      name={doc.name || `Document ${index + 1}`}
                      size={doc.uploadedAt ? `Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}` : null}
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
          caseData.status.includes('JUDGE') ||
          caseData.status.includes('REJECTED') ||
          caseData.status.includes('ON_HOLD')
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
          caseData.status.includes('REJECTED') ||
          caseData.status.includes('ON_HOLD') ||
          caseData.status === 'Verified'
        )) && (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => {
                setActionType('reject');
                setActionReason('');
                setOpenActionDialog(true);
              }}
              disabled={actionLoading}
            >
              Reject Case
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<PauseCircleIcon />}
              onClick={() => {
                setActionType('on-hold');
                setActionReason('');
                setOpenActionDialog(true);
              }}
              disabled={actionLoading}
              sx={{ color: 'white' }}
            >
              Put On Hold
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

      {/* Digital Signature Dialog (Approve) */}
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

      {/* Reject / On Hold Action Dialog */}
      <Dialog
        open={openActionDialog}
        onClose={() => !actionLoading && setOpenActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'reject' ? 'Reject Case' : 'Put Case On Hold'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Select Action</FormLabel>
              <RadioGroup
                row
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <FormControlLabel
                  value="reject"
                  control={<Radio color="error" />}
                  label="Completely Reject"
                />
                <FormControlLabel
                  value="on-hold"
                  control={<Radio color="warning" />}
                  label="Put On Hold"
                />
              </RadioGroup>
            </FormControl>
            
            {actionType === 'reject' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Reject:</strong> The case will be sent back to the lawyer as rejected. 
                The lawyer must resubmit the case from scratch.
              </Alert>
            )}
            {actionType === 'on-hold' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>On Hold:</strong> The case will be held for review. 
                The lawyer will be notified and may provide additional information.
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              label={actionType === 'reject' ? 'Reason for Rejection' : 'Reason for Hold'}
              type="text"
              fullWidth
              multiline
              rows={4}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              disabled={actionLoading}
              placeholder={
                actionType === 'reject' 
                  ? 'Explain why this case is being rejected...' 
                  : 'Explain why this case is being put on hold...'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCaseAction}
            color={actionType === 'reject' ? 'error' : 'warning'}
            variant="contained"
            disabled={!actionReason || actionLoading}
            endIcon={actionLoading && <CircularProgress size={20} />}
            sx={actionType === 'on-hold' ? { color: 'white' } : {}}
          >
            {actionLoading 
              ? 'Processing...' 
              : actionType === 'reject' 
                ? 'Confirm Rejection' 
                : 'Confirm On Hold'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseVerification;
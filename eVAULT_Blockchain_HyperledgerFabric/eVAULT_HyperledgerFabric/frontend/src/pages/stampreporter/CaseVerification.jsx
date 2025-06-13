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
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user_data'));
        
        if (!token || !user) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`http://localhost:8000/case-stamp-verif/${id}`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ user_id: user.user_id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch case details");
        }

        const data = await response.json();
        setCaseData(data.case);
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
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/case/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ digital_signature: digitalSignature }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to approve case");
      }

      setShowSuccess(true);
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
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/case/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reject case");
      }

      setShowSuccess(true);
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

        {caseData.status !== "Verified" && (
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
              Approve & Sign
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
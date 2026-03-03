import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  ArrowForward as ArrowForwardIcon,
  InboxOutlined as InboxIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUserData } from '../../utils/auth';
import { formatDate } from '../../utils/dateFormat';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUserData();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user?._id) throw new Error('User data not found.');

        const caseNotifications = [];

        // Get case IDs assigned to this stamp reporter from MongoDB
        const casesResponse = await axios.get(`http://localhost:3000/stampreporter-cases/${user._id}`);
        const assignedCaseIds = casesResponse.data.case_ids || [];

        // Fetch details for each assigned case from blockchain
        for (const caseId of assignedCaseIds) {
          try {
            const caseResponse = await axios.get(`http://localhost:8000/api/stampreporter/case/${caseId}`);
            if (caseResponse.data.success && caseResponse.data.data) {
              const c = caseResponse.data.data;
              const status = (c.status || '').toUpperCase();

              // Only show pending cases as notifications
              if (!status.includes('VERIFIED') &&
                !status.includes('APPROVED') &&
                !status.includes('REJECTED') &&
                !status.includes('VALIDATED') &&
                !status.includes('BENCHCLERK') &&
                !status.includes('JUDGE') &&
                status !== 'FORWARDED_TO_BENCHCLERK' &&
                status !== 'FORWARDED_TO_STAMPREPORTER_COMPLETED') {
                caseNotifications.push({
                  id: caseId,
                  type: 'new_case',
                  title: 'Case Pending Verification',
                  case_subject: c.caseSubject || c.title || 'Untitled Case',
                  caseId: caseId,
                  associated_lawyers: c.associatedLawyers?.join(', ') || c.createdBy || 'N/A',
                  filed_date: c.filedDate || c.createdAt,
                  timestamp: c.createdAt || new Date().toISOString(),
                  status: 'New',
                  priority: c.priority || 'Medium',
                  isActionable: true,
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching case ${caseId}:`, err);
          }
        }

        // Also get user notifications from MongoDB
        if (user?._id) {
          try {
            const notifResponse = await axios.get(`http://localhost:3000/notification/${user._id}`);
            const userNotifications = notifResponse.data.notifications || [];

            userNotifications.forEach(notif => {
              if (!caseNotifications.find(n => n.caseId === notif.case_id)) {
                caseNotifications.push({
                  id: notif.case_id || Math.random().toString(),
                  type: notif.type || 'notification',
                  title: notif.message || 'New Notification',
                  case_subject: notif.message,
                  caseId: notif.case_id,
                  timestamp: notif.timestamp,
                  status: notif.read ? 'Read' : 'New',
                });
              }
            });
          } catch (err) {
            console.log('No additional notifications');
          }
        }

        setNotifications(caseNotifications);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const newNotificationsCount = notifications.filter(n => n.status === 'New').length;

  const handleMarkAllAsRead = async () => {
    try {
      if (!user?._id) return;
      await axios.put(`http://localhost:3000/notification/${user._id}/mark-read`);
      setNotifications(prev => prev.map(n => n.isActionable ? n : { ...n, status: 'Read' }));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Notifications</Typography>
            <Typography variant="subtitle1">
              You have {newNotificationsCount} new notification{newNotificationsCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {notifications.some(n => n.status === 'New' && !n.isActionable) && (
            <Button
              variant="contained"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, boxShadow: 'none' }}
            >
              Mark Informational as Read
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error" align="center">{error}</Typography>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <InboxIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any pending notifications at this time.
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    py: 2,
                    bgcolor: notification.status === 'New' ? 'rgba(63, 81, 181, 0.05)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(63, 81, 181, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <GavelIcon sx={{ color: '#3f51b5' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {notification.case_subject}
                        </Typography>
                        {notification.status === 'New' && (
                          <Chip
                            label={notification.isActionable ? "Action Required" : "New"}
                            size="small"
                            sx={{
                              bgcolor: notification.isActionable ? '#f44336' : '#3f51b5',
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Case ID: {notification.caseId}
                        </Typography>
                        {notification.associated_lawyers && (
                          <Typography variant="body2" color="textSecondary">
                            Lawyer: {notification.associated_lawyers}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            color: 'text.secondary'
                          }}
                        >
                          {notification.timestamp ? formatDate(notification.timestamp) : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  {notification.isActionable && notification.caseId && (
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/stampreporter/case-verification/${notification.caseId}`)}
                      sx={{ color: '#3f51b5' }}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Notifications;
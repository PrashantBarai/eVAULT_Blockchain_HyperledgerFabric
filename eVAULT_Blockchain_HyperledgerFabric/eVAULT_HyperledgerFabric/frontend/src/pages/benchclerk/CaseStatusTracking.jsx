import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const CaseStatusTracking = ({ userId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cases from API
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view cases.");
          setLoading(false);
          return;
        }

        const userString = localStorage.getItem("user_data");
        const user = userString ? JSON.parse(userString) : null;
        const userIdToUse = userId || user?.user_id;

        if (!userIdToUse) {
          setError("User ID is missing.");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/get-cases/${userIdToUse}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch cases");
        }

        const data = await response.json();
        console.log("Fetched cases:", data); // Debugging log

        setCases(Array.isArray(data) ? data : data.cases || []);
      } catch (err) {
        console.error("Error fetching cases:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [userId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.case_subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.associated_lawyers.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Case Status Tracking
      </Typography>

      {/* Search & Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(e, newValue) => setStatusFilter(newValue || "all")}
          aria-label="status filter"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="verified">Verified</ToggleButton>
          <ToggleButton value="rejected">Rejected</ToggleButton>
          <ToggleButton value="pending">Pending</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Handle Loading & Errors */}
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: "linear-gradient(120deg, #4a90e2 0%, #8e44ad 100%)" }}>
                <TableCell sx={{ color: "white" }}>Case Subject</TableCell>
                <TableCell sx={{ color: "white" }}>Client</TableCell>
                <TableCell sx={{ color: "white" }}>Status</TableCell>
                <TableCell sx={{ color: "white" }}>Judge</TableCell>
                <TableCell sx={{ color: "white" }}>Filed Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.case_subject}</TableCell>
                    <TableCell>{c.client}</TableCell>
                    <TableCell>
                      <Chip label={c.status} color={getStatusColor(c.status)} size="small" />
                    </TableCell>
                    <TableCell>{c.associated_judge}</TableCell>
                    <TableCell>{c.filed_date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No cases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CaseStatusTracking;

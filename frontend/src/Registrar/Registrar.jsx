import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Registrar = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/registrar/${user_id}`);
        const data = await response.json();
        console.log(data)
        if (response.ok) {
          setMessage(data.message);
        } else {
          setError(data.error || "Failed to load data");
        }
      } catch (err) {
        setError("Network error, please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user_id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Registrar Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p>{message}</p>
      )}
      <button onClick={handleLogout} style={{ marginTop: "20px", padding: "10px 20px" }}>
        Logout
      </button>
    </div>
  );
};

export default Registrar;

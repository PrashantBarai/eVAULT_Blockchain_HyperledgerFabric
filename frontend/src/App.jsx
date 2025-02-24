import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Registrar from "./Registrar/Registrar.jsx"; // Import the Registrar component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/registrar/:user_id" element={<Registrar />} /> {/* Add this route */}
      </Routes>
    </Router>
  );
};

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Auth/Signup";
import Login from "./Auth/Login"; 
import LandingPage from "./LandingPage/LandingPage";
import LawyerDash from "./Dashboard/LawyerDash";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lawyer/:userId" element={<LawyerDash />} />
        
      </Routes>
    </Router>
  );
};

export default App;

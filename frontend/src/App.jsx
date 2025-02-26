import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Lawyer from "./Lawyer/Lawyer.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/lawyer/:user_id" element={<Lawyer />} /> 
      </Routes>
    </Router>
  );
};

export default App;

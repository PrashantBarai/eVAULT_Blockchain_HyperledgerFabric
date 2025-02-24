import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate(); // React Router navigation hook

  return (
    <div className="w-full h-screen bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col items-center justify-center px-4">
      <motion.h1 
        className="text-6xl font-extrabold text-white drop-shadow-lg"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Welcome to <span className="text-yellow-300">E-vault</span>
      </motion.h1>

      <motion.p 
        className="text-lg text-white max-w-xl mt-4 opacity-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        Store & manage your legal documents effortlessly with blockchain powered system and a clean interface.
      </motion.p>

      {/* Buttons */}
      <motion.div 
        className="mt-8 flex space-x-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <button
          className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl shadow-lg hover:bg-yellow-500 transition transform hover:scale-105"
          onClick={() => navigate("/auth/signup")}
        >
          Get Started
        </button>
        <button
          className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:bg-gray-300 transition transform hover:scale-105"
          onClick={() => navigate("/auth/login")}
        >
          Login
        </button>
      </motion.div>
    </div>
  );
};

export default LandingPage;

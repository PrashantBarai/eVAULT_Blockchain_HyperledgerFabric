import React, { useState } from "react";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    aadhar: "",
    credit_card: "",
    role: "",
  });
  const [message, setMessage] = useState(""); // Store response message

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message); // Show success message
      } else {
        setMessage(result.error || "Signup failed"); // Show error message
      }
    } catch (error) {
      setMessage("Error connecting to server");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-900 to-blue-700 text-white">
      <div className="bg-white bg-opacity-10 p-8 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Signup</h2>
        {message && (
          <p className={`text-sm font-semibold ${message.includes("success") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" name="username" placeholder="Username" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />
          <input type="email" name="email" placeholder="Email" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />
          <input type="text" name="phone" placeholder="Phone Number" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />
          <input type="text" name="aadhar" placeholder="Aadhaar Card Number" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />
          <input type="text" name="credit_card" placeholder="Credit Card Number" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange} />

          <select name="role" required className="w-full p-2 rounded bg-gray-100 text-black" onChange={handleChange}>
            <option value="" disabled selected>Select User Role</option>
            <option value="lawyer">Lawyer</option>
            <option value="registrar">Registrar</option>
            <option value="stamp_reporter">Stamp Reporter</option>
            <option value="bench_clerk">Bench Clerk</option>
            <option value="judge">Judge</option>
          </select>

          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg transition-transform hover:bg-orange-600 hover:scale-105">
            Signup
          </button>
        </form>
        <p className="mt-3">
          {/* Already have an account? <a href="/login" className="text-orange-300 hover:underline">Login</a> */}
        </p>
      </div>
    </div>
  );
};

export default Signup;

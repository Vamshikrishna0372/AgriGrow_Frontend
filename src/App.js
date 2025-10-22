// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages / Components
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import Details from "./components/Cart";
import ProfilePage from "./components/ProfilePage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* Protected / User Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/details" element={<Details />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Catch-all route (optional) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

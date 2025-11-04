// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages / Components
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import Details from "./components/Cart";
import Profile from "./components/Profile";
import OrdersPage from "./components/OrdersPage"; // 📦 User Orders Page
import Wishlist from "./components/Wishlist"; // 💖 Wishlist Page
import CheckoutPage from './components/CheckoutPage';

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
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<Wishlist />} /> {/* 💖 Added Wishlist Route */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Catch-all route (optional) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

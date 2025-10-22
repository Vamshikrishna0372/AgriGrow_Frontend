// Home.jsx with highlighted registration section on scroll

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const [accepted, setAccepted] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const registerRef = useRef(null);
  const navigate = useNavigate();

  const handleShopClick = () => {
    if (registerRef.current) {
      registerRef.current.scrollIntoView({ behavior: "smooth" });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000); // Remove highlight after 2s
    }
  };

  const handleRegister = () => {
    if (accepted) {
      navigate("/auth");
    } else {
      alert("⚠️ Please accept our Terms & Policy before registering.");
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <img
          src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80"
          alt="Fertile farmland with greenery"
          className="hero-image"
        />
        <div className="hero-text">
          <h1>Welcome to AgriGrow</h1>
          <p>
            AgriGrow is your trusted platform for purchasing quality agricultural
            fertilizers online. Specially designed for Indian farmers, our
            application provides crop-based fertilizer recommendations, fair
            pricing, and doorstep delivery.
          </p>
          <button className="cta-button" onClick={handleShopClick}>
            Shop Fertilizers
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2907/2907253.png"
            alt="Crop Suggestions"
            className="feature-icon"
          />
          <h3>Crop-Based Suggestions</h3>
          <p>
            Get fertilizer recommendations based on the crops you grow and your
            soil type.
          </p>
        </div>

        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png"
            alt="Affordable Pricing"
            className="feature-icon"
          />
          <h3>Affordable Pricing</h3>
          <p>
            Transparent and fair pricing to ensure farmers get the best value
            for their money.
          </p>
        </div>

        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="Doorstep Delivery"
            className="feature-icon"
          />
          <h3>Doorstep Delivery</h3>
          <p>
            Hassle-free delivery of fertilizers directly to your farm or home.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2>About AgriGrow</h2>
        <p>
          Agriculture is the backbone of India, and fertilizers play a crucial
          role in crop productivity. AgriGrow empowers farmers by making
          high-quality fertilizers accessible online. With expert
          recommendations, secure payments, and reliable logistics, we ensure
          that farming becomes more efficient and sustainable.
        </p>
      </section>

      {/* Registration Section */}
      <section
        className={`register-section ${highlight ? "highlight" : ""}`}
        ref={registerRef}
      >
        <h2>Get Started with AgriGrow</h2>
        <p>Join our community of farmers and make agriculture smarter!</p>
        <div className="register-box">
          <label className="terms">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            I accept the <a href="#">Terms & Policy</a>
          </label>
          <button className="register-button" onClick={handleRegister}>
            Get Started
          </button>
        </div>
      </section>

      <style>{`
        .highlight {
          box-shadow: 0 0 15px 5px white;
          transition: box-shadow 0.5s ease;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
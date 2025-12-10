import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast, Zoom } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Admin login check
    if (formData.email === "admin@gmail.com" && formData.password === "@dmin") {
      toast.success("👑 Welcome, Admin!", {
        theme: "colored",
        autoClose: 2000,
        onClose: () => navigate("/admin"), // Redirect to admin panel
      });
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      return;
    }

    if (!formData.email || !formData.password || (isSignup && !formData.name)) {
      toast.warning("⚠️ Please fill in all required fields.", { theme: "colored" });
      return;
    }

    if (isSignup && formData.password !== formData.confirmPassword) {
      toast.error("❌ Passwords do not match!", { theme: "colored" });
      return;
    }

    if (isSignup && formData.password.length < 8) {
      toast.info("ℹ️ Password must be at least 8 characters.", { theme: "colored" });
      return;
    }

    try {
      setLoading(true);

      if (isSignup) {
        await axios.post("https://agrigrow-backend-j1r5.onrender.com/api/auth/signup", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        toast.success("🎉 Account created successfully! Please login.", {
          theme: "colored",
          autoClose: 3000,
        });

        setIsSignup(false);
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      } else {
        const res = await axios.post("https://agrigrow-backend-j1r5.onrender.com/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        toast.success(`🌾 Welcome back, ${res.data?.name || "Farmer"}! 🚜`, {
          theme: "colored",
          autoClose: 2500,
          onClose: () => navigate("/dashboard"),
        });

        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      }
    } catch (err) {
      if (err.response && err.response.data?.message) {
        toast.error(`🚨 ${err.response.data.message}`, { theme: "colored" });
      } else {
        toast.error("❌ Something went wrong. Please try again.", { theme: "colored" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #f1f8e9, #c5e1a5, #aed581);
        }
        .main-wrapper {
          display: flex;
          gap: 2rem;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .info-section {
          max-width: 320px;
          text-align: left;
          color: #33691e;
          animation: fadeInLeft 1s ease;
        }
        .info-section h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .info-section p {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .features {
          margin-top: 1rem;
          padding: 1rem;
          background: #f9fbe7;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .features p {
          margin: 0.4rem 0;
          font-size: 0.95rem;
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .login-container {
          width: 380px;
          padding: 2rem;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
          animation: fadeInRight 1s ease;
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        h1 {
          color: #2e7d32;
          margin-bottom: 0.5rem;
        }
        p {
          margin-bottom: 1.5rem;
          color: #555;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        input {
          padding: 0.9rem;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 1rem;
          transition: 0.3s;
        }
        input:focus {
          border-color: #558b2f;
          box-shadow: 0 0 6px rgba(85,139,47,0.4);
          outline: none;
        }
        button {
          padding: 0.9rem;
          background: linear-gradient(135deg, #558b2f, #8bc34a);
          color: #fff;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        button:hover {
          background: linear-gradient(135deg, #33691e, #689f38);
        }
        .toggle-button {
          background: none;
          border: none;
          color: #33691e;
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>

      <div className="main-wrapper">
        {/* Info Section with Agriculture Theme */}
        <div className="info-section">
          <h2>🌱 Grow with AgriGrow</h2>
          <p>
            Bringing farmers and customers together with trusted agricultural
            products.
          </p>
          <div className="features">
            <p>🌿 Organic & Fresh Produce</p>
            <p>🚜 Quality Farm</p>
            <p>📦 Quick & Secure Delivery</p>
          </div>
        </div>

        {/* Login/Signup Section */}
        <div className="login-container">
          <h1>{isSignup ? "Sign Up" : "Login"}</h1>
          <p>
            {isSignup ? "Create your account" : "Login to continue"} to{" "}
            <strong>AgriGrow</strong>.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {isSignup && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            )}
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : isSignup ? "Sign Up" : "Login"}
            </button>
          </form>

          <p>
            {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
            <button
              className="toggle-button"
              onClick={() => {
                setIsSignup(!isSignup);
                toast.info(
                  isSignup
                    ? "ℹ️ Switched to Login mode"
                    : "ℹ️ Switched to Signup mode",
                  { theme: "colored" }
                );
              }}
            >
              {isSignup ? "Login here" : "Sign up here"}
            </button>
          </p>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2500}
        transition={Zoom}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

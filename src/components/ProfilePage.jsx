// ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // Get the stored user identifier (e.g., email or ID)
  // This is a placeholder for actual state/context management
  const email = localStorage.getItem("userEmail"); 

  useEffect(() => {
    // Check if the user is authenticated (e.g., if an email/ID exists)
    if (!email) {
      // If not logged in, navigate to the authentication page
      navigate("/auth"); 
      return;
    }

    // Fetch the user profile data
    fetch(`https://agrigrow-backend-hus4.onrender.com/api/auth/profile/${email}`)
      .then(res => {
        if (!res.ok) {
          // If the API call fails (e.g., 404 not found)
          throw new Error('Failed to fetch user profile');
        }
        return res.json();
      })
      .then(data => {
        // Assuming 'data' contains the user object
        setUser(data);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        // Optional: Redirect on error, or just display an error message
        // navigate("/auth"); 
      });
  }, [email, navigate]); // Added navigate as dependency since it's used inside useEffect

  if (!user) return <p>Loading user profile...</p>;

  return (
    <div className="profile-page">
      <header className="profile-header-bar">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Profile Settings</h1>
      </header>

      <main className="profile-content">
        <div className="profile-card">
          <FaUserCircle className="profile-avatar" />
          <h2>{user.name}</h2>
          <p>Member Since: {new Date(user.createdAt).toLocaleDateString()}</p>

          <div className="profile-details">
            <div className="detail-item"><FaEnvelope /> {user.email}</div>
            <div className="detail-item"><FaPhone /> {user.phone || "Not Provided"}</div>
            <div className="detail-item"><FaMapMarkerAlt /> {user.location || "Not Provided"}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
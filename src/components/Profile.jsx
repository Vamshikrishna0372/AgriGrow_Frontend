import React, { useState, useEffect, useCallback } from 'react';
import { FaUserCircle, FaEnvelope, FaTag, FaSpinner, FaChevronLeft, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; 

// Ensure your backend is running on this URL
const API_BASE_URL = "https://agrigrow-backend-rgpk.onrender.com/api/auth"; 

/**
 * Utility to read the authenticated user's email from localStorage. 
 * It expects the key 'user' to contain an object with the 'email' field.
 * @returns {{userEmail: string | null, isAuthenticated: boolean}}
 */
const getAuthenticatedUserIdentifier = () => {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        // We assume authentication is valid if the 'user' key exists and has an email.
        if (userData && userData.email) {
            return { userEmail: userData.email, isAuthenticated: true };
        }
    } catch (e) {
        console.error("Error reading user data from localStorage:", e);
    }
    return { userEmail: null, isAuthenticated: false }; 
};


export default function Profile() {
    const navigate = useNavigate();
    
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get the authenticated user's identifier (email)
    const { userEmail, isAuthenticated } = getAuthenticatedUserIdentifier(); 

    /**
     * Fetches the user profile data from the database using the stored email.
     */
    const fetchUserProfile = useCallback(async (email) => {
        if (!email) {
            setError("Authentication failed: User email not available.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            // HITS THE CORRECT BACKEND ROUTE: /api/auth/profile/:email
            const response = await fetch(`${API_BASE_URL}/profile/${email}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch user profile (Status: ${response.status})`);
            }

            // SUCCESS: Sets the real database data
            setUserDetails(data);
        } catch (err) {
            console.error("Fetch Profile Error:", err);
            setError(err.message);
            setUserDetails(null); 
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLogout = () => {
        // Clear the stored user data and navigate to login
        localStorage.removeItem('user');
        navigate('/login');
    };

    useEffect(() => {
        if (isAuthenticated && userEmail) {
            fetchUserProfile(userEmail);
        } else {
            // User is not authenticated
            setError("Access denied. Please log in.");
            setLoading(false);
        }
    }, [isAuthenticated, userEmail, fetchUserProfile]);


    // --- Conditional Rendering for States ---

    if (!isAuthenticated) {
        return <div className="profile-page error">Access Denied. You must be logged in.</div>;
    }

    if (loading) {
        return (
            <div className="profile-page loading">
                <FaSpinner className="loading-icon" /> 
                <p>Loading profile details...</p>
            </div>
        );
    }

    if (error) {
        return <div className="profile-page error">Error fetching profile: {error}</div>;
    }

    if (!userDetails) {
        return <div className="profile-page error">User profile data could not be retrieved.</div>;
    }

    // --- Main Profile Display (Shows real DB data) ---

    return (
        <div className="profile-page">
            <div className="pl-header-actions">
                <button onClick={() => navigate(-1)} className="back-btn-profile">
                    <FaChevronLeft /> Back
                </button>
                <button className="pl-logout-button" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>
            
            <div className="profile-card">
                <div className="profile-header">
                    <FaUserCircle className="profile-icon-large" />
                    <h1>Welcome, {userDetails.name}</h1>
                </div>

                <div className="profile-detail-group">
                    <div className="profile-detail-item">
                        <FaTag />
                        <strong>Name:</strong>
                        <span>{userDetails.name}</span>
                    </div>
                    <div className="profile-detail-item">
                        <FaEnvelope />
                        <strong>Email:</strong>
                        <span>{userDetails.email}</span>
                    </div>
                    <div className="profile-detail-item">
                        <FaTag />
                        <strong>Account ID:</strong>
                        <span className="user-id-text">{userDetails._id}</span>
                    </div>
                    {/* Displays creation date from the MongoDB document */}
                    {userDetails.createdAt && (
                        <div className="profile-detail-item">
                            <FaTag />
                            <strong>Joined:</strong>
                            <span>{new Date(userDetails.createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                <button className="edit-profile-btn">Update Profile</button>
            </div>
        </div>
    );
}
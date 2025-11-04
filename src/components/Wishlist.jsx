// src/components/Wishlist.jsx

import React, { useState, useEffect } from 'react';
import { FaHeart, FaShoppingCart, FaTrash, FaChevronLeft, FaStar, FaStarHalfAlt, FaLeaf, FaArrowRight } from 'react-icons/fa';
import './Wishlist.css';

// 🔑 BACKEND CONFIGURATION
const API_BASE_URL = 'https://agrigrow-backend-rgpk.onrender.com/api'; 
const MOCK_USER_ID = '60c72b2f9c8f2b0015b4e8c1'; 

/**
 * Wishlist component displays the user's saved items.
 * @param {function} addToCart - Function to add item to cart (from Dashboard).
 * @param {function} toggleWishlist - Function to toggle wishlist status (from Dashboard). This is used to update the global count/IDs.
 * @param {function} onProductClick - Function to switch Dashboard view to ProductDetails.
 * @param {function} navigate - Function passed from Dashboard to switch view back to Dashboard.
 * * NOTE: The showNotification prop is not explicitly passed down from Dashboard in the provided code, 
 * but we can use the existing toggleWishlist and addToCart, which trigger notifications in the parent.
 */
export default function Wishlist({ addToCart, toggleWishlist, isWishlisted, onProductClick, navigate: navigateToDashboard }) { 
    // Removed showNotification from props since the parent component already handles the toasts via the prop functions.

    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- API Handlers ---

    const fetchWishlist = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/wishlist/${MOCK_USER_ID}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch wishlist: ${response.status}`);
            }

            const data = await response.json();
            setWishlistProducts(data.products || []);

        } catch (err) {
            console.error("Fetch Wishlist Error:", err);
            setError("Could not load your wishlist. Please try again.");
            setWishlistProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles product removal from the backend wishlist (POST /api/wishlist/toggle).
     * This uses the existing `toggleWishlist` prop from the parent which handles the API call and notifications.
     * The fix is to ensure the local state is updated immediately (optimistically) and then refreshed.
     */
    const handleToggleRemove = async (product) => {
        if (typeof toggleWishlist !== 'function') {
            console.error("toggleWishlist prop is missing or not a function.");
            alert("Cannot remove product. Application configuration error."); // Fallback
            return;
        }

        const productId = product._id;
        
        try {
            // OPTIMISTIC UPDATE: Remove from local state immediately for a fast UI response
            setWishlistProducts(prevProducts => 
                prevProducts.filter(p => p._id !== productId)
            );
            
            // Call the parent's toggle function, which handles the API, global state update, and toast notification
            await toggleWishlist(product); 

            // Re-fetch in the background to ensure data sync and handle potential optimistic update rollback if the API failed (though the parent should handle the error toast).
            // A small timeout helps ensure the parent's state updates (counts) are complete before we re-fetch the list.
            setTimeout(fetchWishlist, 50); 
            
        } catch (err) {
            // On error, the local state will be incorrect. A re-fetch will synchronize it.
            // The parent's toggleWishlist should have already displayed an error toast.
            console.error("Error during wishlist removal process, re-fetching:", err);
            fetchWishlist();
        }
    };
    
    // --- Effects and Initial Load ---
    useEffect(() => {
        fetchWishlist();
    }, []);

    // --- Navigation and Rendering Helpers ---

    const handleProductClick = (product) => {
        if (onProductClick && typeof onProductClick === 'function') {
            onProductClick(product);
        } else {
            console.error("onProductClick prop is missing or not a function.");
        }
    };

    const handleAddToCart = async (product) => {
        if (typeof addToCart !== 'function') {
             console.error("addToCart prop is missing or not a function. Cannot execute move to cart.");
             return;
        }

        // Add to cart API call (via prop). The parent handles toast for cart.
        await addToCart({ ...product, quantity: 1 });
        
        // No removal from wishlist, so no further state update needed here.
    };

    const renderStars = (rating) => (
        <div className="star-rating-display">
            {[...Array(5)].map((_, i) => {
                const full = i + 1 <= Math.floor(rating);
                const half = !full && rating - i >= 0.5;
                return full ? (
                    <FaStar key={i} className="star full" />
                ) : half ? (
                    <FaStarHalfAlt key={i} className="star half" />
                ) : (
                    <FaStar key={i} className="star empty" />
                );
            })}
        </div>
    );

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="wishlist-page loading-state">
                <FaLeaf className="loading-icon" size={40} />
                <p>Loading your saved products...</p>
            </div>
        );
    }

    if (error) {
        return <div className="wishlist-page error-state">{error}</div>;
    }

    return (
        <div className="wishlist-page">
            <button onClick={navigateToDashboard} className="back-btn-wishlist"> 
                <FaChevronLeft /> Continue Shopping
            </button>
            
            <h1 className="wishlist-title"><FaHeart className="title-icon" /> My Favourites ({wishlistProducts.length})</h1>

            {wishlistProducts.length === 0 ? (
                <div className="empty-wishlist">
                    <p>Your wishlist is currently empty. Start adding products you love! 🛒</p>
                    <button onClick={navigateToDashboard} className="start-shopping-btn"> 
                        Start Exploring Products <FaArrowRight />
                    </button>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistProducts.map((product) => (
                        <div key={product._id} className="wishlist-card">
                            
                            {/* Product Info Clickable Area (Redirects on click) */}
                            <div className="product-info-area" onClick={() => handleProductClick(product)}>
                                <img 
                                    src={product.photo || "https://via.placeholder.com/200?text=No+Image"} 
                                    alt={product.name} 
                                    className="wishlist-img"
                                />
                                <div className="card-details">
                                    <h3 className="product-name">{product.name}</h3>
                                    <p className="product-brand">By: **{product.brand || 'Generic'}**</p>
                                    <div className="rating-bar">
                                        {renderStars(product.rating || 0)}
                                    </div>
                                    <p className="product-price">₹{product.price ? product.price.toFixed(2) : 'N/A'}</p>
                                    <p className={`stock-status-wishlist ${product.quantity > 0 ? 'in-stock-w' : 'out-stock-w'}`}>
                                        {/* Assuming product.quantity is a proxy for inStock */}
                                        {product.quantity > 0 ? `In Stock (${product.quantity})` : 'Out of Stock'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="card-actions">
                                <button 
                                    className="add-to-cart-btn-w" 
                                    onClick={() => handleAddToCart(product)}
                                    // Button is disabled ONLY if the product is out of stock (quantity <= 0)
                                    disabled={product.quantity <= 0} 
                                >
                                    <FaShoppingCart /> {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                                <button 
                                    className="remove-btn-w" 
                                    // FIX: Pass the whole product to the handler, which then calls the global toggleWishlist
                                    onClick={() => handleToggleRemove(product)}
                                >
                                    <FaTrash /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
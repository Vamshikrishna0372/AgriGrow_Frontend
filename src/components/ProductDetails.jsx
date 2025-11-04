// src/components/ProductDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    FaStar, 
    FaChevronLeft, 
    FaShoppingCart, 
    FaHeart, 
    FaRegHeart, // <-- FIXED: Added FaRegHeart for the empty heart icon
    FaTruck, 
    FaUndo, 
    FaStarHalfAlt, 
    FaTags, 
    FaSeedling, 
    FaCalendarAlt, 
    FaBolt, 
    FaLeaf 
} from 'react-icons/fa';
import './ProductDetails.css';

// 🔑 BACKEND CONFIGURATION (Replace with your actual user context and API helpers)
const API_BASE_URL = 'https://agrigrow-backend-rgpk.onrender.com/api'; // Base URL for all APIs
const MOCK_USER_ID = '60c72b2f9c8f2b0015b4e8c1'; // Example User ID for testing API interaction

// 🔑 MOCK DATA & FETCH FUNCTION (Simulates fetching from DB)
const mockFetchProductById = (id) => {
    // This simulates fetching the product from your Mongoose schema/DB
    return {
        _id: id,
        name: id === 'p101' ? "Advanced Organic Growth Booster" : "Heavy Duty Garden Shovel",
        brand: "AgriPro",
        price: id === 'p101' ? 450.00 : 89.99,
        rating: id === 'p101' ? 4.7 : 4.1,
        inStock: true, // Derived from quantity > 0
        quantity: id === 'p101' ? 15 : 0, // Available quantity from DB
        photo: id === 'p101'
            ? "https://via.placeholder.com/600x600?text=Growth+Booster"
            : "https://via.placeholder.com/600x600?text=Garden+Shovel",
        description: id === 'p101'
            ? "A highly concentrated liquid fertilizer ensuring maximum nutrient uptake and resistance to common diseases. Fast-acting and residue-free. This is the official product description from the database."
            : "A durable, high-carbon steel shovel designed for heavy-duty gardening tasks, featuring an ergonomic handle and rust-resistant coating. Essential for farm use.",
    };
};

// Utility function to decode the product photo URL
const getPhotoUrl = (photo) => {
    return photo ? decodeURIComponent(photo) : "https://via.placeholder.com/600x600?text=AgriGrow+Product";
};

// Mock specifications data (Remains a utility for mock display)
const getMockDetails = (productName) => {
    return {
        features: [
            "100% Organic and Non-GMO Verified",
            "Boosts root growth and nutrient absorption",
            "Suitable for indoor and outdoor plants",
            "Eco-friendly packaging and sustainable sourcing",
        ],
        specs: [
            { label: "Category", value: productName.includes('Booster') ? 'Nutrients' : 'Tool', icon: <FaTags /> },
            { label: "Weight/Size", value: '5 kg / Large', icon: <FaSeedling /> },
            { label: "Warranty", value: '6 Months Replacement' },
            { label: "Application Time", value: 'Bi-Weekly' },
        ],
    };
};

export default function ProductDetails({ product: initialProduct, navigate, addToCart, toggleWishlist, isWishlisted }) {
    
    const { id } = useParams();
    const [product, setProduct] = useState(initialProduct);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWishlistUpdating, setIsWishlistUpdating] = useState(false);

    // 🔑 STATE PERSISTENCE & INITIAL FETCH LOGIC (Ensures product loads on refresh)
    useEffect(() => {
        if (!product && id) {
            setIsRefreshing(true);
            
            // Simulating API call delay for realism
            setTimeout(() => {
                const fetchedProduct = mockFetchProductById(id);
                setProduct(fetchedProduct);
                setIsRefreshing(false);
            }, 300);
        }
        // Reset quantity to 1 when a new product loads or on initial mount
        setItemQuantity(1);
    }, [id, initialProduct]);

    if (!product || isRefreshing) {
        return (
            <div className="product-details-page loading-state">
                <button onClick={() => navigate('/dashboard')} className="back-btn-pdp"><FaChevronLeft /> Back to Shop</button>
                <div className="pdp-layout loading-box">
                    <FaLeaf className="loading-icon" size={30} />
                    <p>Fetching product details...</p>
                </div>
            </div>
        );
    }
    
    // --- Guaranteed Product Logic ---
    const handleBack = () => navigate('/dashboard');
    const isAvailable = product.quantity > 0;
    // Determines if the product is currently wishlisted based on the parent state
    const isWishlistedNow = isWishlisted(product._id); 
    const mockData = getMockDetails(product.name);
    const totalPrice = product.price * itemQuantity;

    // Check if requested quantity exceeds available stock (product.quantity)
    const isQuantityTooHigh = itemQuantity > product.quantity;
    const isDisabled = !isAvailable || itemQuantity < 1 || isQuantityTooHigh || isProcessing;


    // ---------------------------------------------------
    // 🔑 WISHLIST API HANDLER
    // ---------------------------------------------------
    const handleWishlistToggle = async () => {
        setIsWishlistUpdating(true);

        try {
            const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${userToken}`, // Include auth token here
                },
                body: JSON.stringify({
                    userId: MOCK_USER_ID,
                    productId: product._id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update wishlist: ${response.status}`);
            }

            const result = await response.json();
            
            // This prop call updates the state in the parent Dashboard component, 
            // which causes this component to re-render with the correct 'isWishlistedNow' value.
            toggleWishlist(product); 
            
            const message = result.message.includes('Removed') 
                ? `${product.name} removed from wishlist.` 
                : `${product.name} added to wishlist!`;
            
            alert(message);

        } catch (error) {
            console.error("Wishlist toggle failed:", error);
            alert(`Error updating wishlist: ${error.message}`);
        } finally {
            setIsWishlistUpdating(false);
        }
    };

    // ---------------------------------------------------
    // 🔑 CART API HANDLER
    // ---------------------------------------------------
    const handleCartUpdate = async (shouldNavigateToCart = false) => {
        if (isDisabled) return;
        
        setIsProcessing(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/cart/quantity`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${userToken}`, 
                },
                body: JSON.stringify({
                    userId: MOCK_USER_ID, 
                    productId: product._id,
                    quantity: itemQuantity,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update cart: ${response.status}`);
            }

            addToCart({ ...product, quantity: itemQuantity });
            
            if (shouldNavigateToCart) {
                navigate("/cart"); 
            } else {
                alert(`Added ${itemQuantity} x ${product.name} to cart!`);
            }
            
        } catch (error) {
            console.error("Cart update failed:", error);
            alert(`Error adding to cart: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleBuyNow = () => {
        handleCartUpdate(true); 
    };
    
    const handleAddToCart = () => {
        handleCartUpdate(false);
    };

    const renderStars = (rating) => {
        return (
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
    };

    return (
        <div className="product-details-page">
            <button onClick={handleBack} className="back-btn-pdp"><FaChevronLeft /> Back to Shop</button>
            
            <div className="pdp-layout">
                
                {/* --- Left Column: Image --- */}
                <div className="pdp-image-gallery">
                    <div className="image-wrapper">
                         <img 
                             src={getPhotoUrl(product.photo)} 
                             alt={product.name} 
                             className="main-product-image" 
                           />
                    </div>
                </div>

                {/* --- Right Column: Details --- */}
                <div className="pdp-info-section">
                    <h1 className="product-title">{product.name}</h1>
                    <p className="product-brand">Sold By: **{product.brand}**</p>
                    
                    <div className="product-rating-bar">
                        {renderStars(product.rating)}
                        <span className="rating-count">{product.rating.toFixed(1)} / 5 (125 Ratings)</span>
                        <span className="stock-status">
                            {isAvailable ? (
                                <span className="in-stock-pdp">In Stock (Qty: {product.quantity}) ✅</span>
                            ) : (
                                <span className="out-stock-pdp">Out of Stock ❌</span>
                            )}
                        </span>
                    </div>

                    <div className="price-container">
                        <span className="current-price">₹{totalPrice.toFixed(2)}</span>
                        <span className="price-per-unit"> (₹{product.price.toFixed(2)} / Kg)</span>
                        <span className="tax-info"> (Inclusive of all taxes)</span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="quantity-selector-container">
                        <label htmlFor="quantity" className="quantity-label">Quantity:</label>
                        <div className="quantity-input-group">
                            <button 
                                className="qty-btn" 
                                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                disabled={itemQuantity <= 1 || !isAvailable || isProcessing}
                            >
                                -
                            </button>
                            <input 
                                id="quantity"
                                type="number" 
                                min="1" 
                                max={product.quantity} // Set max based on available quantity
                                value={itemQuantity} 
                                onChange={(e) => setItemQuantity(Math.max(1, Math.min(product.quantity || 999, parseInt(e.target.value) || 1)))}
                                className="qty-input"
                                disabled={!isAvailable || isProcessing}
                            />
                            <button 
                                className="qty-btn" 
                                onClick={() => setItemQuantity(itemQuantity + 1)}
                                disabled={!isAvailable || isQuantityTooHigh || itemQuantity >= product.quantity || isProcessing}
                            >
                                +
                            </button>
                        </div>
                        {isQuantityTooHigh && (
                            <p className="stock-warning">Max available: {product.quantity}</p>
                        )}
                    </div>
                    
                    {/* Highlights/Features Section */}
                    <div className="product-highlights">
                        <h4>Product Highlights</h4>
                        <ul>
                            {mockData.features.map((feature, index) => (
                                <li key={index}><span>&bull;</span> {feature}</li>
                            ))}
                        </ul>
                    </div>

                    {/* ACTION BLOCK */}
                    <div className="product-actions-pdp">
                        <button 
                            className="buy-now-btn-pdp primary-action"
                            onClick={handleBuyNow}
                            disabled={isDisabled}
                        >
                            <FaBolt /> {isProcessing ? 'Processing...' : 'Buy Now'}
                        </button>

                        <button 
                            className="add-to-cart-btn-pdp secondary-action"
                            onClick={handleAddToCart}
                            disabled={isDisabled}
                        >
                            <FaShoppingCart /> {isProcessing ? 'Adding...' : 'Add to Cart'}
                        </button>
                        
                        <button 
                            // The 'active' class (set in CSS to apply red color) is correctly used here
                            className={`wishlist-btn-pdp ${isWishlistedNow ? 'active' : ''}`} 
                            onClick={handleWishlistToggle}
                            disabled={isProcessing || isWishlistUpdating}
                        >
                            {/* 🏆 FIXED: Conditional icon rendering for full/empty heart */}
                            {isWishlistedNow ? <FaHeart /> : <FaRegHeart />} 
                            <span className="wishlist-text">
                                {isWishlistUpdating 
                                    ? (isWishlistedNow ? 'Removing...' : 'Adding...')
                                    : isWishlistedNow ? 'REMOVE' : 'WISHLIST'}
                            </span>
                        </button>
                    </div>

                    <div className="delivery-info">
                        <p><FaTruck className="icon-truck" /> **Standard Delivery** (3-5 days). FREE on orders over ₹500.</p>
                        <p><FaUndo className="icon-undo" /> **7-Day Hassle-Free Returns**.</p>
                        <p><FaCalendarAlt className="icon-calendar" /> Expected Dispatch: Next business day.</p>
                    </div>

                    {/* Full Description & Specifications */}
                    <div className="full-details-section">
                        <h3 className="spec-title">Detailed Description</h3>
                        <p className="detailed-description-text">{product.description}</p>
                        
                        <h3 className="spec-title">Technical Specifications</h3>
                        <ul className="product-specs">
                            {mockData.specs.map((detail, index) => (
                                <li key={index}>
                                    <span className="spec-label">
                                        {detail.icon} {detail.label}:
                                    </span>
                                    <span className="spec-value">{detail.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
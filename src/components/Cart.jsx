import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaChevronLeft, FaArrowRight, FaPlus, FaMinus, FaLeaf, FaInfoCircle } from 'react-icons/fa';
import './Cart.css';

// 🛑 Import the separate DeliveryAddress component (Stage 1)
import DeliveryAddress from './DeliveryAddress'; 
// 🛑 Import the CheckoutFlow component (Stage 2 - Placeholder used here)
import CheckoutFlow from './CheckoutFlow'; 

// 🔑 BACKEND CONFIGURATION
const API_BASE_URL = 'https://agrigrow-backend-j1r5.onrender.com/api'; 
// CRITICAL: MOCK_USER_ID used for cart logic. Use the one consistent with your server if integrating the address logic.
const MOCK_USER_ID = '60c72b2f9c8f2b0015b4e8c1'; 

// ✅ FIX 3: Simplified base URL for static assets. This MUST be the root of your Express server.
const STATIC_BASE_URL = 'https://agrigrow-backend-j1r5.onrender.com'; 

// Initial state for the delivery details (shared with DeliveryAddress.jas)
const initialDeliveryState = {
    _id: null, name: "", phone: "", email: "", address: "", city: "", pincode: "", label: ""
};

export default function Cart({ updateCartCount }) {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Checkout Flow States ---
    const [checkout, setCheckout] = useState(false); // Controls transition from Cart to Address form
    const [submitted, setSubmitted] = useState(false); // Controls transition from Address form to Summary
    const [delivery, setDelivery] = useState(initialDeliveryState); // Holds selected/entered address details


    // --- API Handlers (Kept as provided) ---

    const fetchCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${MOCK_USER_ID}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`Failed to fetch cart: ${response.status} - ${errorData.message}`);
            }

            const data = await response.json();
            setCartItems(data.items || []);
            
            if (updateCartCount) {
                updateCartCount(data.items ? data.items.length : 0);
            }

        } catch (err) {
            console.error("Fetch Cart Error:", err);
            setError("Could not load your shopping cart. Please try again. Check server status.");
            setCartItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [updateCartCount]);

    const handleRemoveItem = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cart/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: MOCK_USER_ID, productId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to remove item from cart.');
            }
            
            // Update state based on the response
            setCartItems(data.cart ? data.cart.items || [] : []);
            if (updateCartCount) {
                updateCartCount(data.cart && data.cart.items ? data.cart.items.length : 0);
            }

        } catch (err) {
            console.error("Remove Cart Item Error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleUpdateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(productId);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cart/quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: MOCK_USER_ID, productId, quantity: newQuantity }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to update quantity.');
                fetchCart(); 
                return;
            }
            setCartItems(data.cart.items || []);
        } catch (err) {
            console.error("Update Quantity Error:", err);
            alert(`Error updating quantity: ${err.message}`);
        }
    };

    // --- Effects and Initial Load ---
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // --- Calculations ---

    const calculateSubtotal = () => {
        return cartItems.reduce((acc, item) => {
            const price = item.productId?.price || 0; 
            return acc + (price);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const shipping = subtotal > 5000 ? 0 : 500;
    const total = subtotal + shipping;

    // --- Flow Navigation Handler ---
    const handleBack = () => {
        if (submitted) {
            setSubmitted(false); // Back to Delivery Address form
        } else if (checkout) {
            setCheckout(false); // Back to Cart view
        } else {
            navigate(-1); // Back to previous page
        }
    };


    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="cart-page loading-state">
                <FaLeaf className="loading-icon" size={40} />
                <p>Loading your shopping cart...</p>
            </div>
        );
    }

    if (error) {
        return <div className="cart-page error-state">{error}</div>;
    }

    return (
        <div className="cart-page">
            {/* Back button logic updated to handle flow state */}
            <button onClick={handleBack} className="back-btn-cart">
                <FaChevronLeft /> {checkout ? (submitted ? 'Back to Address' : 'Back to Cart') : 'Back'}
            </button>
            
            <div className="cart-title-container">
                <FaLeaf className="title-icon" /> 
                <h1 className="cart-title-text">Your Green Basket</h1>
            </div>

            {cartItems.length === 0 ? (
                // --- Empty Cart View ---
                <div className="empty-cart">
                    <p>Your cart is empty. Time to find some great products!</p>
                    <button onClick={() => navigate('/dashboard')} className="start-shopping-btn">
                        Start Exploring Products <FaArrowRight />
                    </button>
                </div>
            ) : (
                <div className="cart-flow-container">
                    
                    {/* Stage 0: Cart View */}
                    {!checkout && (
                        <div className="cart-container">
                            <div className="cart-items-list">
                                {cartItems.map((item) => {
                                    const product = item.productId; 
                                    if (!product || !product._id) return null; 

                                    // ✅ FIX 4: Robust path joining logic (STATIC_BASE_URL is 'http://localhost:5000')
                                    let imageUrl = "https://via.placeholder.com/100?text=No+Image"; 
                                    if (product.photo) {
                                        // Ensure only one slash separates the base URL and the path
                                        const cleanPath = product.photo.startsWith('/') ? product.photo.substring(1) : product.photo;
                                        imageUrl = `${STATIC_BASE_URL}/${cleanPath}`;
                                    }
                                    
                                    return (
                                        <div key={product._id} className="cart-item-card">
                                            <img 
                                                src={imageUrl} 
                                                alt={product.name} 
                                                className="cart-item-img"
                                                // Added onError handler for debugging path issues
                                                onError={(e) => { 
                                                    e.target.onerror = null; 
                                                    e.target.src = "https://via.placeholder.com/100?text=Image+Error";
                                                    console.error(`🔴 Image Load Failed. Check the path: ${imageUrl}`);
                                                }}
                                                onClick={() => navigate(`/product/${product._id}`)}
                                            />
                                            <div className="item-details">
                                                <h3 className="product-name" onClick={() => navigate(`/product/${product._id}`)}>{product.name}</h3>
                                                {/* These lines will now show data, as 'brand' and 'category' are fetched */}
                                                <p className="product-category">Brand: {product.brand || 'N/A'}</p>
                                                <p className="product-category">Type: {product.category || 'Soil'}</p>
                                                
                                                <p className="product-price">₹{product.price.toFixed(2)}</p>
                                                
                                                <div className={`stock-info ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                    {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                                </div>
                                                
                                                <div className="action-buttons-row">
                                                    <button className="more-info-btn" onClick={() => navigate(`/product/${product._id}`)}>
                                                        <FaInfoCircle /> More Info
                                                    </button>
                                                    <button className="remove-btn-c" onClick={() => handleRemoveItem(product._id)}>
                                                        <FaTrash /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cart-summary">
                                <h2>Price Details</h2>
                                <div className="summary-line">
                                    <span>Price ({cartItems.length} items):</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Delivery Charges:</span>
                                    <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="summary-separator"></div>
                                <div className="summary-line total-line">
                                    <span>Total Amount:</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                
                                {/* This button now sets the checkout state to true */}
                                <button className="checkout-btn" onClick={() => setCheckout(true)}>
                                    Checkout
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stage 1: Delivery Address Form (Uses external component) */}
                    {checkout && !submitted && (
                        <DeliveryAddress
                            setSubmitted={setSubmitted}
                            setCheckout={setCheckout}
                            delivery={delivery}
                            setDelivery={setDelivery}
                            cartLength={cartItems.length}
                        />
                    )}

                    {/* Stage 2: Checkout Summary (Assumes CheckoutFlow component exists) */}
                    {submitted && (
                        // This assumes you define/import the CheckoutFlow component for the final summary step
                          <CheckoutFlow
                            cart={cartItems}
                            delivery={delivery}
                            subtotal={subtotal} 
                            shipping={shipping}
                            totalAmount={total}
                            setSubmitted={setSubmitted} 
                            navigate={navigate}
                          />
                    )}
                </div>
            )}
        </div>
    );
}
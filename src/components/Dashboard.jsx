import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaLeaf,
    FaShoppingCart,
    FaHeart,
    FaMoon,
    FaSun,
    FaUserCircle,
    FaSignOutAlt,
    FaStar,
    FaStarHalfAlt,
    FaCog,
    FaBox,
} from "react-icons/fa";
import ProductDetails from "./ProductDetails"; 
import Wishlist from "./Wishlist"; 
import "./Dashboard.css";

// MOCK USER ID must be consistent across all components interacting with the mock server
const MOCK_USER_ID = '60c72b2f9c8f2b0015b4e8c1'; 

// 💡 Helper Component for Notifications (The Toast Message)
const Notification = ({ message, type }) => {
    if (!message) return null;

    return (
        <div className={`app-notification ${type}`}>
            {message}
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [dark, setDark] = useState(false);
    
    // State to track counts and wishlist product IDs
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [wishlistProductIds, setWishlistProductIds] = useState([]); 

    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [products, setProducts] = useState([]);
    
    // 🔑 FIX 1: New state for view management and product data
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'productDetails', 'wishlist'
    const [productDetailData, setProductDetailData] = useState(null); 

    const [visibleRows, setVisibleRows] = useState(1);
    const [loading, setLoading] = useState(false); 
    
    // Notification States for Toast Messages
    const [showCartNotification, setShowCartNotification] = useState(null);
    const [showWishNotification, setShowWishNotification] = useState(null);

    const productsSectionRef = useRef(null);
    const profileMenuRef = useRef(null);

    const PRODUCTS_PER_ROW = 4;
    const API_BASE_URL = "https://agrigrow-backend-rgpk.onrender.com/api";

    // --- Banner Images (Kept as before) ---
    const bannerImgs = [
        {
            src: "https://static.vecteezy.com/system/resources/thumbnails/003/706/986/small_2x/paronama-modern-agriculture-concept-technology-smart-farming-icon-on-rice-background-free-photo.jpg",
            title: "Sustainable Farming for a Greener Tomorrow",
            description: "Explore our eco-friendly solutions and organic products.",
        },
        {
            src: "https://t4.ftcdn.net/jpg/11/67/94/53/360_F_1167945323_XvmnJ88tSwZ6D5zwVKpmXHRsRoC8Mzel.jpg",
            title: "Efficient Irrigation for Optimal Growth",
            description: "Save water and improve productivity with our smart systems.",
        },
    ];

    // Function to fetch the current state of Cart and Wishlist
    const fetchCounts = useCallback(async () => {
        try {
            const cartRes = await fetch(`${API_BASE_URL}/cart/${MOCK_USER_ID}`);
            const cartData = await cartRes.json();
            
            // 🛑 FIX: Calculate count as the number of unique items (array length)
            // The previous logic summed item quantities, which is usually for the total quantity badge.
            // For a Cart *symbol* badge, the number of items is usually preferred.
            const cartItems = cartData.items || [];
            const count = cartItems.length; // Use array length for item count
            
            setCartCount(count);
            
            const wishRes = await fetch(`${API_BASE_URL}/wishlist/${MOCK_USER_ID}`);
            const wishData = await wishRes.json();
            const wishProducts = wishData.products || [];
            
            setWishlistCount(wishProducts.length);
            setWishlistProductIds(wishProducts.map(p => p._id));

        } catch (err) {
            console.error("Error fetching counts:", err);
        }
    }, []);


    // --- Effects (No changes needed) ---
    useEffect(() => {
        const bannerInterval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % bannerImgs.length);
        }, 5000);
        return () => clearInterval(bannerInterval);
    }, [bannerImgs.length]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/products`)
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((err) => console.error("Error fetching products:", err));
        
        fetchCounts();
    }, [fetchCounts]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) 
            ) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    useEffect(() => {
        if (showCartNotification || showWishNotification) {
            const timer = setTimeout(() => {
                setShowCartNotification(null);
                setShowWishNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showCartNotification, showWishNotification]);


    // --- Handlers ---

    const handleGoToCartDetails = () => {
        navigate("/details"); 
    };
    
    // 🔑 FIX 2: Switches view to Wishlist component
    const handleGoToWishlistDetails = () => {
        setActiveView('wishlist'); 
    };

    /**
     * 🔑 FIX 3: Renders the ProductDetails view and stores product data.
     * This is the function passed to the Wishlist component via onProductClick.
     */
    const handleViewProductDetails = (product) => {
        setProductDetailData(product);
        setActiveView('productDetails');
    };

    /**
     * Resets the view state back to the main dashboard.
     * This is the function passed as 'navigate' to the Wishlist and ProductDetails components.
     */
    const handleBackToDashboard = () => {
        setActiveView('dashboard');
        setProductDetailData(null);
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        navigate("/");
    };

    const handleProfileClick = () => {
        setShowProfileMenu(false);
        navigate("/profile");
    };

    const handleOrdersClick = () => {
        setShowProfileMenu(false);
        navigate("/orders");
    };

    const handleSearch = () => {
        setSubmittedSearch(search);
        setVisibleRows(1);

        if (productsSectionRef.current) {
            productsSectionRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    // 🚀 Add to Cart (Used by Dashboard, PDP, and Wishlist)
    const addCart = async (product) => {
        const quantity = product.quantity || 1; 

        if (!product.inStock && quantity === 1 || loading) return; 

        setLoading(true);
        // Clearing both to prevent duplicate notifications from previous state
        setShowCartNotification(null); 
        setShowWishNotification(null);

        try {
            const endpoint = quantity > 1 ? `/cart/quantity` : `/cart/add`;
            const method = quantity > 1 ? 'PUT' : 'POST';
            const body = quantity > 1 
                ? { userId: MOCK_USER_ID, productId: product._id, quantity: product.quantity }
                : { userId: MOCK_USER_ID, productId: product._id, quantity: 1 };
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add/update item in cart.');
            }

            await fetchCounts();
            setShowCartNotification(`${product.name} added to cart!`);

        } catch (error) {
            console.error("Error adding to cart:", error);
            setShowCartNotification(`Error: ${error.message || "Failed to add item to cart."}`);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 Toggle Wishlist 
    const toggleWish = async (product) => {
        setLoading(true);
        const isCurrentlyWishlisted = isProductWishlisted(product._id);
        
        setShowCartNotification(null); 
        setShowWishNotification(null);

        try {
            const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: MOCK_USER_ID, productId: product._id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update wishlist.');
            }

            await fetchCounts();
            const message = isCurrentlyWishlisted 
                ? `${product.name} removed from wishlist.` 
                : `${product.name} added to wishlist!`;
            setShowWishNotification(message);

        } catch (error) {
            console.error("Error toggling wishlist:", error);
            setShowWishNotification(`Error: ${error.message || "Error updating wishlist."}`);
        } finally {
            setLoading(false);
        }
    };

    const isProductWishlisted = (productId) => {
        return wishlistProductIds.includes(productId);
    };

    // --- Core Logic (Unchanged) ---
    const filteredProducts = products.filter((p) => {
        const matchesCategory = category === "All" || p.type === category;
        const matchesSearch = p.name.toLowerCase().includes(submittedSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const displayedProducts = filteredProducts.slice(
        0,
        visibleRows * PRODUCTS_PER_ROW
    );

    const handleShowMore = () => {
        setVisibleRows((prev) => prev + 1);
    };

    // --- CONDITIONAL RENDERING (The Router Logic) ---

    // 1. Show Product Details Page
    if (activeView === 'productDetails') {
        return (
            <ProductDetails
                product={productDetailData}
                // Pass the function to switch back to the dashboard
                navigate={handleBackToDashboard} 
                addToCart={addCart}
                toggleWishlist={toggleWish}
                isWishlisted={isProductWishlisted} 
                fetchCounts={fetchCounts}
            />
        );
    }
    
    // 2. Show Wishlist Page
    if (activeView === 'wishlist') {
        return (
            <Wishlist
                // 🔑 FIX 4: Pass the handler that switches the view to PDP
                onProductClick={handleViewProductDetails} 
                // 🔑 FIX 5: Pass the handler that switches the view back to Dashboard
                navigate={handleBackToDashboard} 
                
                // Pass necessary handlers
                addToCart={addCart}
                toggleWishlist={toggleWish}
                isWishlisted={isProductWishlisted}
            />
        );
    }

    // 3. Show Main Dashboard
    return (
        <div className={`dashboard ${dark ? "dark" : ""}`}>
            {/* 🔝 Notifications/Toast Message Area */}
            <Notification 
                message={showCartNotification || showWishNotification} 
                type={showCartNotification ? 'success' : showWishNotification ? 'info' : 'hidden'} 
            />
            {loading && <div className="loading-overlay">Processing...</div>}

            {/* 🔝 Navbar */}
            <header className="nav">
                <div className="brand highlight" onClick={handleBackToDashboard}>
                    <FaLeaf /> <span className="brand-text">AgriGrow</span>
                </div>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
                <div className="nav-actions">
                    <button className="icon-btn" onClick={() => setDark((d) => !d)}>
                        {dark ? <FaSun /> : <FaMoon />}
                    </button>
                    
                    {/* Wishlist Button - Calls handleGoToWishlistDetails which sets activeView='wishlist' */}
                    <button className="icon-btn" onClick={handleGoToWishlistDetails}>
                        <FaHeart />
                        <span className="count">{wishlistCount}</span> 
                    </button>
                    
                    {/* Cart Button */}
                    <button className="icon-btn" onClick={handleGoToCartDetails}>
                        <FaShoppingCart />
                        <span className="count">
                            {/* This count is now the number of unique products */}
                            {cartCount}
                        </span> 
                    </button>

                    {/* 💡 PROFILE MENU CONTAINER */}
                    <div className="profile-menu-container" ref={profileMenuRef}>
                        <button
                            className="icon-btn profile-icon-btn"
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                        >
                            <FaUserCircle className="profile-icon" />
                        </button>
                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <div className="profile-header">Hello, Farmer!</div>
                                
                                <button className="profile-link" onClick={handleProfileClick}>
                                    <FaCog /> Settings/Profile
                                </button>
                                <button className="profile-link" onClick={handleOrdersClick}>
                                    <FaBox /> My Orders
                                </button>
                                <button
                                    className="profile-link logout-btn-dropdown"
                                    onClick={handleLogout}
                                >
                                    <FaSignOutAlt /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 🎡 Banner Carousel */}
            <section className="banner-carousel">
                <div
                    className="banner-track"
                    style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
                >
                    {bannerImgs.map((banner, idx) => (
                        <div className="banner-slide" key={idx}>
                            <img src={banner.src} alt={`Banner ${idx + 1}`} />
                            <div className="slide-overlay">
                                <h1>{banner.title}</h1>
                                <p>{banner.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 🛍️ Products */}
            <main className="container" ref={productsSectionRef}>
                <h2>
                    {submittedSearch
                        ? `Search Results for "${submittedSearch}"`
                        : "Featured Products"}
                </h2>
                <div className="filter-bar">
                    {["All", "Soil", "Nutrients", "Tools", "Irrigation"].map((c) => (
                        <button
                            key={c}
                            className={category === c ? "active" : ""}
                            onClick={() => {
                                setCategory(c);
                                setSubmittedSearch("");
                                setVisibleRows(1);
                            }}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="products">
                    {displayedProducts.map((p) => (
                        <div
                            className={`product ${!p.inStock ? "out-of-stock" : ""}`}
                            key={p._id}
                        >
                            {!p.inStock && <div className="overlay">Out of Stock</div>}
                            {/* Product Info Area */}
                            <img
                                src={
                                    p.photo
                                        ? decodeURIComponent(p.photo)
                                        : "https://via.placeholder.com/150"
                                }
                                alt={p.name}
                                className="product-img"
                                onClick={() => handleViewProductDetails(p)}
                            />
                            <h3 onClick={() => handleViewProductDetails(p)}>{p.name}</h3>
                            <p className="price">₹{p.price}</p>
                            <div className="rating">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                    const full = idx + 1 <= Math.floor(p.rating);
                                    const half = !full && p.rating - idx >= 0.5;
                                    return full ? (
                                        <FaStar key={idx} />
                                    ) : half ? (
                                        <FaStarHalfAlt key={idx} />
                                    ) : (
                                        <FaStar key={idx} className="empty" />
                                    );
                                })}
                            </div>
                            <div className="actions">
                                <button
                                    onClick={() => addCart(p)}
                                    disabled={!p.inStock || loading}
                                    className={!p.inStock ? "disabled-btn" : ""}
                                >
                                    Add to Cart
                                </button>
                                <button onClick={() => toggleWish(p)} disabled={loading}>
                                    <FaHeart
                                        className={isProductWishlisted(p._id) ? "wish-active" : "wish"}
                                    />
                                </button>
                                <button
                                    className="info-btn"
                                    onClick={() => handleViewProductDetails(p)}
                                >
                                    More Info
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <p className="no-results">
                            No products found matching your search or filter criteria.
                        </p>
                    )}
                </div>

                {visibleRows * PRODUCTS_PER_ROW < filteredProducts.length && (
                    <div className="show-more-btn">
                        <button onClick={handleShowMore}>Show More</button>
                    </div>
                )}
            </main>

            {/* ⚡ Footer */}
            <footer>
                &copy; {new Date().getFullYear()} AgriGrow. All rights reserved.
            </footer>
        </div>
    );
}
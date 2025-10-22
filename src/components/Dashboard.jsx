// Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaLeaf,
  FaShoppingCart,
  FaHeart,
  FaMoon,
  FaSun,
  FaUserCircle, // 💡 NEW ICON for profile
  FaSignOutAlt, // 💡 NOW used inside the dropdown
  FaStar,
  FaStarHalfAlt,
  FaTimes,
  FaCog, // 💡 Added for the Profile link
} from "react-icons/fa";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [search, setSearch] = useState("");
  // 💡 NEW STATE: Holds the search value only after the button is clicked.
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [showWish, setShowWish] = useState(false);
  // 💡 NEW STATE: To control the visibility of the profile menu dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false); 
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [visibleRows, setVisibleRows] = useState(1); // 🔹 Number of rows currently visible

  const productsSectionRef = useRef(null);
  const profileMenuRef = useRef(null); // 💡 REF for the profile menu container

  const PRODUCTS_PER_ROW = 4; // Number of products per row

  // Banner Images
  const bannerImgs = [
    {
      src: "https://static.vecteezy.com/system/resources/thumbnails/003/706/986/small_2x/paronama-modern-agriculture-concept-technology-smart-farming-icon-on-rice-background-free-photo.jpg",
      title: "Sustainable Farming for a Greener Tomorrow",
      description: "Explore our eco-friendly solutions and organic products.",
    },
    {
      src: "https://st5.depositphotos.com/10054616/64643/i/450/depositphotos_646438208-stock-photo-young-green-plant-growing-sunlight.jpg",
      title: "Nourish Your Soil, Nurture Your Yield",
      description: "Premium fertilizers for robust crop growth and health.",
    },
    {
      src: "https://www.alliedmarketresearch.com/InsightsImages/banner-1-C-2024-05-10-1715337864.webp",
      title: "Innovative Tools for Modern Agriculture",
      description: "Enhance efficiency with our cutting-edge farm equipment.",
    },
    {
      src: "https://t4.ftcdn.net/jpg/11/67/94/53/360_F_1167945323_XvmnJ88tSwZ6D5zwVKpmXHRsRoC8Mzel.jpg",
      title: "Efficient Irrigation for Optimal Growth",
      description: "Save water and improve productivity with our smart systems.",
    },
  ];

  // 🔄 Banner auto-slide
  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImgs.length);
    }, 5000);
    return () => clearInterval(bannerInterval);
  }, [bannerImgs.length]);

  // 📦 Fetch products from backend
  useEffect(() => {
    fetch("https://agrigrow-backend-hus4.onrender.com/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // 💡 NEW LOGIC: Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);
  
  const handleLogout = () => {
    // 1. Close the menu
    setShowProfileMenu(false); 
    // 2. Perform actual logout logic (clear tokens, context, etc.)
    // 3. Navigate
    navigate("/");
  };

  // 💡 NEW FUNCTION: Handle navigation to Profile Page
  const handleProfileClick = () => {
    setShowProfileMenu(false); // Close menu
    navigate("/profile"); // Navigate to the profile route
  };

  // 💡 NEW FUNCTION: Handles search button click (Filter and Scroll)
  const handleSearch = () => {
    setSubmittedSearch(search); // Apply current input to the filter state
    setVisibleRows(1); // Reset visible rows to the start of the new results

    // Scroll down to the products section smoothly
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 🔍 Filter products - Uses 'submittedSearch' for search filtering
  const filteredProducts = products.filter((p) => {
    const matchesCategory = category === "All" || p.type === category;
    // 💡 Use submittedSearch for filtering products
    const matchesSearch = p.name.toLowerCase().includes(submittedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 🛒 Add to cart
  const addCart = (p) => {
    if (!p.inStock) return;
    setCart((prev) => [...prev, p]);
    setCartTotal((prevTotal) => prevTotal + p.price);
    setShowCart(true);
  };

  // ❌ Remove from cart
  const removeFromCart = (index) => {
    setCart((prevCart) => {
      const removedItem = prevCart[index];
      const updatedCart = prevCart.filter((_, i) => i !== index);
      setCartTotal((prevTotal) => prevTotal - removedItem.price);
      return updatedCart;
    });
  };

  // ❤️ Wishlist toggle
  const toggleWish = (p) => {
    setWishlist((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
    setShowWish(true);
  };

  // 🔹 Determine products to display based on visible rows
  const displayedProducts = filteredProducts.slice(
    0,
    visibleRows * PRODUCTS_PER_ROW
  );

  // 🔹 Handle "Show More" click
  const handleShowMore = () => {
    setVisibleRows((prev) => prev + 1);
  };

  return (
    <div className={`dashboard ${dark ? "dark" : ""}`}>
      {/* 🔝 Navbar */}
      <header className="nav">
        <div className="brand highlight">
          <FaLeaf /> <span className="brand-text">AgriGrow</span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={() => setDark((d) => !d)}>
            {dark ? <FaSun /> : <FaMoon />}
          </button>
          <button className="icon-btn" onClick={() => setShowWish(true)}>
            <FaHeart />
            <span className="count">{wishlist.length}</span>
          </button>
          <button className="icon-btn" onClick={() => setShowCart(true)}>
            <FaShoppingCart />
            <span className="count">{cart.length}</span>
          </button>

          {/* 💡 NEW PROFILE MENU CONTAINER */}
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button 
              className="icon-btn profile-icon-btn" 
              onClick={() => setShowProfileMenu(prev => !prev)}
            >
              <FaUserCircle className="profile-icon" /> 
            </button>
            {/* 💡 PROFILE MENU DROPDOWN */}
            {showProfileMenu && (
              <div className="profile-dropdown">
                {/* Replace with actual username if available */}
                <div className="profile-header">Hello, Farmer!</div> 
                <button className="profile-link" onClick={handleProfileClick}>
                  <FaCog /> Profile Settings
                </button>
                <button className="profile-link logout-btn-dropdown" onClick={handleLogout}>
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

      {/* 🛍️ Products - ATTACH REF HERE for scrolling */}
      <main className="container" ref={productsSectionRef}>
        <h2>
          {/* Display title based on filter/search state */}
          {submittedSearch ? `Search Results for "${submittedSearch}"` : "Featured Products"}
        </h2>
        <div className="filter-bar">
          {["All", "Soil", "Nutrients", "Tools", "Irrigation"].map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => {
                setCategory(c);
                setSubmittedSearch(""); // Clear search filter when changing category
                setVisibleRows(1); // Reset rows when changing category
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
              <img
                src={
                  p.photo
                    ? decodeURIComponent(p.photo)
                    : "https://via.placeholder.com/150"
                }
                alt={p.name}
                className="product-img"
              />
              <h3>{p.name}</h3>
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
                  disabled={!p.inStock}
                  className={!p.inStock ? "disabled-btn" : ""}
                >
                  Add to Cart
                </button>
                <button onClick={() => toggleWish(p)}>
                  <FaHeart
                    className={wishlist.includes(p) ? "wish-active" : "wish"}
                  />
                </button>
                <button
                  className="info-btn"
                  onClick={() => setSelectedProduct(p)}
                >
                  More Info
                </button>
              </div>
            </div>
          ))}

          {/* Display message if no products match the filter/search */}
          {filteredProducts.length === 0 && (
            <p className="no-results">
              No products found matching your search or filter criteria.
            </p>
          )}
        </div>

        {/* 🔹 Show More Button */}
        {visibleRows * PRODUCTS_PER_ROW < filteredProducts.length && (
          <div className="show-more-btn">
            <button onClick={handleShowMore}>Show More</button>
          </div>
        )}
      </main>

      {/* 📖 More Info Modal */}
      {selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedProduct(null)}
            >
              <FaTimes />
            </button>
            <div className="modal-image">
              <img
                src={decodeURIComponent(selectedProduct.photo)}
                alt={selectedProduct.name}
              />
            </div>
            <div className="modal-details">
              <h2>{selectedProduct.name}</h2>
              <p className="modal-price">₹{selectedProduct.price}</p>
              <div className="modal-rating">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const full = idx + 1 <= Math.floor(selectedProduct.rating);
                  const half = !full && selectedProduct.rating - idx >= 0.5;
                  return full ? (
                    <FaStar key={idx} className="star full" />
                  ) : half ? (
                    <FaStarHalfAlt key={idx} className="star half" />
                  ) : (
                    <FaStar key={idx} className="star empty" />
                  );
                })}
                <span className="rating-text">
                  ({selectedProduct.rating} / 5)
                </span>
              </div>
              <p>
                <strong>Brand:</strong> {selectedProduct.brand}
              </p>
              <p>
                <strong>Type:</strong> {selectedProduct.type}
              </p>
              <p>
                <strong>Description:</strong> {selectedProduct.description}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {selectedProduct.inStock ? (
                  <span className="in-stock">In Stock ✅</span>
                ) : (
                  <span className="out-stock">Out of Stock ❌</span>
                )}
              </p>
              <div className="modal-actions">
                <button
                  className="cart-btn"
                  onClick={() => addCart(selectedProduct)}
                  disabled={!selectedProduct.inStock}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button
                  className="wish-btn"
                  onClick={() => toggleWish(selectedProduct)}
                >
                  <FaHeart
                    className={
                      wishlist.includes(selectedProduct)
                        ? "wish-active"
                        : "wish"
                    }
                  />{" "}
                  {wishlist.includes(selectedProduct)
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                </button>
                <button
                  className="buy-btn"
                  onClick={() =>
                    navigate("/details", {
                      state: {
                        cart: [selectedProduct],
                        total: selectedProduct.price,
                      },
                    })
                  }
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 Cart Panel */}
      <aside className={`side-panel ${showCart ? "open" : ""}`}>
        <h3>
          Cart
          <button className="close-btn" onClick={() => setShowCart(false)}>
            <FaTimes />
          </button>
        </h3>
        <ul>
          {cart.length === 0 && <li>No items in cart</li>}
          {cart.map((item, i) => (
            <li key={i} className="cart-item">
              <button
                className="remove-btn"
                onClick={() => removeFromCart(i)}
              >
                −
              </button>
              <img
                src={
                  item.photo
                    ? decodeURIComponent(item.photo)
                    : "https://via.placeholder.com/50"
                }
                alt={item.name}
                className="cart-item-img"
              />
              <div className="cart-item-details">
                <h4>{item.name}</h4>
                <p>Brand: {item.brand}</p>
                <p>₹{item.price}</p>
                <div className="cart-item-rating">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const full = idx + 1 <= Math.floor(item.rating);
                    const half = !full && item.rating - idx >= 0.5;
                    return full ? (
                      <FaStar key={idx} />
                    ) : half ? (
                      <FaStarHalfAlt key={idx} />
                    ) : (
                      <FaStar key={idx} className="empty" />
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {cart.length > 0 && (
          <div className="cart-total">
            <hr />
            <h4>Total: ₹{cartTotal}</h4>
            <button
              className="buy-btn"
              onClick={() =>
                navigate("/details", { state: { cart, total: cartTotal } })
              }
            >
              Buy Now
            </button>
          </div>
        )}
      </aside>

      {/* ❤️ Wishlist Panel */}
      <aside className={`side-panel ${showWish ? "open" : ""}`}>
        <h3>
          Wishlist
          <button className="close-btn" onClick={() => setShowWish(false)}>
            <FaTimes />
          </button>
        </h3>
        <ul>
          {wishlist.length === 0 && <li>No favourites yet</li>}
          {wishlist.map((item, i) => (
            <li key={i} className="wishlist-item">
              <img
                src={
                  item.photo
                    ? decodeURIComponent(item.photo)
                    : "https://via.placeholder.com/50"
                }
                alt={item.name}
                className="wishlist-item-img"
              />
              <div className="wishlist-item-details">
                <h4>{item.name}</h4>
                <p>Brand: {item.brand}</p>
                <p className="wishlist-price">₹{item.price}</p>
                <div className="wishlist-rating">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const full = idx + 1 <= Math.floor(item.rating);
                    const half = !full && item.rating - idx >= 0.5;
                    return full ? (
                      <FaStar key={idx} className="bright-star" />
                    ) : half ? (
                      <FaStarHalfAlt key={idx} className="bright-star" />
                    ) : (
                      <FaStar key={idx} className="empty-star" />
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* ⚡ Footer */}
      <footer>
        &copy; {new Date().getFullYear()} AgriGrow. All rights reserved.
      </footer>
    </div>
  );
}
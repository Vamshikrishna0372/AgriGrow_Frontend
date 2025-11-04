import React, { useState, useEffect } from "react";
import { 
    FaSignOutAlt, FaBoxOpen, FaPlusCircle, FaUsers, FaTruck, FaEdit, FaTrash, 
    FaListAlt, FaCheck, FaDollarSign, FaMapMarkerAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminPanel.css";

// ⚠️ WARNING: Update this URL to match your server's domain/port
const API_BASE = "http://localhost:5000/api"; 

export default function AdminPanel() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [products, setProducts] = useState([]);
    
    // 🔑 STATE for Orders
    const [orders, setOrders] = useState([]); 
    
    // 🔑 NEW STATE: To manage the active order queue view
    const [orderView, setOrderView] = useState("actionable"); 
    
    // ⬇️ MODIFIED STATE: Added 'quantity' field
    const [newProduct, setNewProduct] = useState({
        name: "", photo: "", price: "", description: "", rating: "", inStock: true, brand: "", type: "Soil", sku: "",
        quantity: "", // ⬅️ NEW FIELD
    });
    const [editingId, setEditingId] = useState(null);

    // ------------------------------------------------
    // EFFECT: Fetch Data Based on Active Section
    // ------------------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            let url = "";
            let setter = null;

            if (activeSection === "products") {
                url = `${API_BASE}/products`;
                setter = setProducts;
            } else if (activeSection === "orders") {
                // Fetch ALL orders
                url = `${API_BASE}/orders/history`; 
                setter = setOrders;
            }

            if (url) {
                try {
                    // NOTE: Ideally, include the Admin's JWT token in the headers here
                    const res = await fetch(url);
                    const data = await res.json();
                    if (res.ok) {
                        // 🔑 STEP 3: Implement Client-Side Sorting (Oldest first for action queue)
                        const sortedData = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        setter(sortedData);
                    } else {
                        toast.error(`Error fetching data for ${activeSection}`);
                    }
                } catch (err) {
                    toast.error(`Server error fetching ${activeSection}`);
                    console.error(err);
                }
            }
        };

        fetchData();
    }, [activeSection]);

    // ------------------------------------------------
    // HANDLER: Update Order Status (General)
    // ------------------------------------------------
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        if (!window.confirm(`Are you sure you want to change order ${orderId.substring(0, 8)}... status to '${newStatus}'?`)) return;
        
        try {
            // Backend route: PUT /api/orders/update-status/:id
            const res = await fetch(`${API_BASE}/orders/update-status/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                // NOTE: Replace with Admin JWT token
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Order ${orderId.substring(0, 8)}... updated to ${newStatus}`);
                
                // Update the local state
                setOrders(prev => prev.map(o => 
                    o._id === orderId ? { ...o, payment: { ...o.payment, status: newStatus } } : o
                ));
            } else {
                toast.error(data.message || "Failed to update status.");
            }
        } catch (err) {
            toast.error("Network error during status update.");
            console.error(err);
        }
    };

    // ------------------------------------------------
    // 🌟 HANDLER: Cancel Order
    // ------------------------------------------------
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm(`⚠️ Are you sure you want to CANCEL order ${orderId.substring(0, 8)}...? This action cannot be undone.`)) return;
        
        try {
            // Reusing the update-status route, setting the status to 'Cancelled'
            const res = await fetch(`${API_BASE}/orders/update-status/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                // NOTE: Replace with Admin JWT token
                body: JSON.stringify({ status: 'Cancelled' }), 
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Order ${orderId.substring(0, 8)}... has been **CANCELLED**`);
                
                // Update the local state to 'Cancelled'
                setOrders(prev => prev.map(o => 
                    o._id === orderId ? { ...o, payment: { ...o.payment, status: 'Cancelled' } } : o
                ));
            } else {
                toast.error(data.message || "Failed to cancel order.");
            }
        } catch (err) {
            toast.error("Network error during order cancellation.");
            console.error(err);
        }
    };

    // --- Product Management Handlers (Simplified) ---
    const handleLogout = () => navigate("/auth");
    
    // ⬇️ MODIFIED HANDLER: Handles all input changes, including the new 'quantity' field
    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target;
        setNewProduct({ ...newProduct, [name]: type === "checkbox" ? checked : value });
    };
    
    // ⬇️ MODIFIED HANDLER: Ensures price, rating, and now QUANTITY are numbers
    const handleAddProduct = async (e) => { 
        e.preventDefault();
        const productToSend = {
            ...newProduct,
            price: Number(newProduct.price),
            rating: Number(newProduct.rating) || 0,
            quantity: Number(newProduct.quantity) || 0, // ⬅️ NEW: Parse quantity to a number
        };

        try {
            let res, data;

            if (editingId) {
                // Update existing product
                res = await fetch(`${API_BASE}/products/update/${editingId}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(productToSend),
                });
                data = await res.json();
                if (res.ok) {
                    toast.success(data.message);
                    setProducts(prev => prev.map(p => p._id === editingId ? data.product : p));
                    setEditingId(null);
                } else toast.error(data.message);
            } else {
                // Add new product
                res = await fetch(`${API_BASE}/products/add`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(productToSend),
                });
                data = await res.json();
                if (res.ok) {
                    toast.success(data.message || "Product added successfully!");
                    setProducts(prev => [...prev, data.product]);
                } else toast.error(data.message);
            }

            // Reset form
            setNewProduct({
                name: "", photo: "", price: "", description: "", rating: "", inStock: true, brand: "", type: "Soil", sku: "",
                quantity: "", // ⬅️ Reset new quantity field
            });
        } catch (err) {
            toast.error("Server error, try again later");
            console.error(err);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await fetch(`${API_BASE}/products/delete/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setProducts(prev => prev.filter(p => p._id !== id));
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Server error, try again later");
            console.error(err);
        }
    };
    const handleEdit = (product) => {
        setActiveSection("addProduct");
        // ⬇️ MODIFIED: Ensure new product fields are populated for editing
        setNewProduct({
            ...product,
            price: product.price, 
            rating: product.rating, 
            inStock: product.inStock,
            quantity: product.quantity || "", // ⬅️ Populate quantity for editing
        });
        setEditingId(product._id);
    };
    
    // ------------------------------------------------
    // 🔑 STEP 4: RENDERER: Orders Section (Status-Based Queues)
    // ------------------------------------------------
    const renderOrdersSection = () => {
        let currentOrders = [];
        let title = "";

        // Helper functions for counts
        const countOrders = (status) => orders.filter(o => o.payment.status === status).length;
        const countActionable = orders.filter(o => !['Delivered', 'Failed', 'Cancelled'].includes(o.payment.status)).length;
    
        // 1. Filtering and Sorting Logic based on orderView state
        if (orderView === "actionable") {
            // Shows Paid, Pending Verification, Shipped (sorted oldest first by default fetch)
            currentOrders = orders
                .filter(order => !['Delivered', 'Failed', 'Cancelled'].includes(order.payment.status));
            title = "Immediate Action Required";
        } else if (orderView === "cancelled") {
            // Shows Cancelled orders, sorted by newest first
            currentOrders = orders
                .filter(order => order.payment.status === 'Cancelled')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            title = "Cancelled Orders for Review";
        } else if (orderView === "completed") {
            // Shows Delivered orders, sorted by newest first
            currentOrders = orders
                .filter(order => order.payment.status === 'Delivered')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            title = "Completed Orders History";
        } else {
            currentOrders = orders; 
            title = "All Orders";
        }


        return (
            <div className="section">
                <h2><FaListAlt /> {title} ({currentOrders.length})</h2>
                
                {/* 🔑 Queue Filter Buttons */}
                <div className="order-queue-filters">
                    <button 
                        className={`queue-btn ${orderView === 'actionable' ? 'active-queue' : ''}`}
                        onClick={() => setOrderView('actionable')}
                    >
                        🚨 Actionable ({countActionable})
                    </button>
                    <button 
                        className={`queue-btn ${orderView === 'cancelled' ? 'active-queue' : ''}`}
                        onClick={() => setOrderView('cancelled')}
                    >
                        ❌ Cancelled ({countOrders('Cancelled')})
                    </button>
                    <button 
                        className={`queue-btn ${orderView === 'completed' ? 'active-queue' : ''}`}
                        onClick={() => setOrderView('completed')}
                    >
                        ✅ Delivered ({countOrders('Delivered')})
                    </button>
                </div>

                {currentOrders.length === 0 ? (
                    <p>No orders found in the **{title}** queue.</p>
                ) : (
                    <div className="order-list">
                        {currentOrders.map((order) => (
                            <div key={order._id} className={`order-card status-${order.payment.status.replace(/\s/g, '').toLowerCase()}`}>
                                
                                <div className="order-summary">
                                    <h4>Order ID: {order._id.substring(0, 8)}...</h4>
                                    <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    <p className="order-total"><FaDollarSign /> Total: **₹{order.totalAmount}**</p>
                                </div>
                                
                                <div className="order-details">
                                    <h5><FaMapMarkerAlt /> Shipping Details:</h5>
                                    <p>Name: {order.deliveryDetails.name} ({order.deliveryDetails.phone})</p>
                                    <p>Address: {order.deliveryDetails.address}, {order.deliveryDetails.pincode}</p>
                                    <hr/>
                                    <h5>Payment Status: **{order.payment.status}**</h5>
                                    <p>TXN ID: {order.payment.txnId}</p>
                                    <p>UTR ID: {order.payment.utrId}</p>
                                </div>

                                <div className="order-actions">
                                    
                                    {/* 1. Primary Status Buttons */}
                                    {order.payment.status === 'Pending Verification' && (
                                        <button className="action-btn success-action" onClick={() => handleUpdateOrderStatus(order._id, 'Paid')}><FaCheck /> Confirm Payment</button>
                                    )}
                                    {order.payment.status === 'Paid' && (
                                        <button className="action-btn primary-action" onClick={() => handleUpdateOrderStatus(order._id, 'Shipped')}><FaTruck /> Mark Shipped</button>
                                    )}
                                    {order.payment.status === 'Shipped' && (
                                        <button className="action-btn delivered-action" onClick={() => handleUpdateOrderStatus(order._id, 'Delivered')}><FaCheck /> Delivered</button>
                                    )}
                                    
                                    {/* 2. CANCEL Button (Visible if not in a final state) */}
                                    {order.payment.status !== 'Delivered' && order.payment.status !== 'Cancelled' && order.payment.status !== 'Failed' && (
                                        <button 
                                            className="action-btn cancel-action" 
                                            onClick={() => handleCancelOrder(order._id)}
                                        >
                                            <FaTrash /> Cancel Order
                                        </button>
                                    )}

                                    {/* 3. Final Status Tags */}
                                    {order.payment.status === 'Delivered' && (<span className="delivered-tag">Completed</span>)}
                                    {order.payment.status === 'Cancelled' && (<span className="cancelled-tag">Cancelled</span>)}
                                    {order.payment.status === 'Failed' && (<span className="failed-tag">Failed</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    
    // ------------------------------------------------
    // RENDER SECTION SWITCH
    // ------------------------------------------------
    const renderSection = () => {
        switch (activeSection) {
            case "products":
                return (
                    <div className="section">
                        <h2>📦 Current Products</h2>
                        {products.length === 0 ? (<p>No products added yet.</p>) : (
                            <div className="product-list">
                                {products.map((p, i) => (
                                    <div key={i} className="product-card">
                                        <img src={p.photo || "https://via.placeholder.com/100"} alt={p.name} />
                                        <div>
                                            <h4>{p.name}</h4>
                                            <p>₹{p.price} – {p.type}</p>
                                            <p>{p.inStock ? "In Stock" : "Out of Stock"}</p>
                                            {/* ✅ FIX 1: Change display label to explicitly use 'kgs' or similar */}
                                            {p.quantity !== undefined && <p>Weight (kgs): **{p.quantity}**</p>}
                                        </div>
                                        <div className="product-actions">
                                            <button onClick={() => handleEdit(p)} className="edit-btn"><FaEdit /></button>
                                            <button onClick={() => handleDelete(p._id)} className="delete-btn"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case "addProduct":
                return (
                    <div className="section">
                        <h2>{editingId ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
                        <form className="product-form" onSubmit={handleAddProduct}>
                            <input type="text" name="name" placeholder="Product Name" value={newProduct.name} onChange={handleChange} required />
                            <input type="text" name="photo" placeholder="Photo URL" value={newProduct.photo} onChange={handleChange} />
                            <input type="number" name="price" placeholder="Price (₹)" value={newProduct.price} onChange={handleChange} required />
                            
                            {/* ⬇️ NEW INPUT FIELD: Quantity */}
                            {/* ✅ FIX 2: Change placeholder to explicitly use 'kgs' or similar */}
                            <input 
                                type="number" 
                                name="quantity" 
                                placeholder="Quantity/Weight (in kgs)" 
                                value={newProduct.quantity} 
                                onChange={handleChange} 
                                required 
                                min="0" 
                            />
                            
                            <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleChange} />
                            <input type="number" name="rating" placeholder="Rating (0-5)" step="0.1" min="0" max="5" value={newProduct.rating} onChange={handleChange} />
                            <input type="text" name="brand" placeholder="Brand" value={newProduct.brand} onChange={handleChange} />
                            <input type="text" name="sku" placeholder="SKU / Product Code" value={newProduct.sku} onChange={handleChange} />
                            <select name="type" value={newProduct.type} onChange={handleChange}>
                                <option value="Soil">Soil</option><option value="Nutrients">Nutrients</option>
                                <option value="Tools">Tools</option><option value="Irrigation">Irrigation</option>
                            </select>
                            <label className="checkbox-label">
                                <input type="checkbox" name="inStock" checked={newProduct.inStock} onChange={handleChange} /> In Stock
                            </label>
                            <button type="submit" className="submit-btn">{editingId ? "Update Product" : "Add Product"}</button>
                        </form>
                    </div>
                );
            case "orders": 
                return renderOrdersSection();
            case "customers":
                return <div className="section"><h2>👥 Customer Information Section</h2></div>;
            case "delivery":
                return <div className="section"><h2>🚚 Delivery Information Section</h2></div>;
            default:
                return <div className="section"><h2>🏠 Welcome to Admin Dashboard</h2></div>;
        }
    };

    return (
        <div className="admin-panel">
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
            {/* Sidebar */}
            <div className="sidebar">
                <h1>Admin</h1>
                <button className={`sidebar-btn ${activeSection==="dashboard" ? "active":""}`} onClick={()=>setActiveSection("dashboard")}>🏠 Dashboard</button>
                
                {/* 🔑 STEP 5: Update Orders button to set default queue view */}
                <button className={`sidebar-btn ${activeSection==="orders" ? "active":""}`} 
                    onClick={() => { setActiveSection("orders"); setOrderView("actionable"); }}
                >
                    <FaListAlt /> Orders
                </button>
                
                <button className={`sidebar-btn ${activeSection==="products" ? "active":""}`} onClick={()=>setActiveSection("products")}><FaBoxOpen /> Products</button>
                <button className={`sidebar-btn ${activeSection==="addProduct" ? "active":""}`} onClick={()=>setActiveSection("addProduct")}><FaPlusCircle /> Add Product</button>
                <button className={`sidebar-btn ${activeSection==="customers" ? "active":""}`} onClick={()=>setActiveSection("customers")}><FaUsers /> Customers</button>
                <button className={`sidebar-btn ${activeSection==="delivery" ? "active":""}`} onClick={()=>setActiveSection("delivery")}><FaTruck /> Delivery Info</button>
                <button className="sidebar-btn logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
            </div>

            {/* Main Content */}
            <div className="main-content">{renderSection()}</div>
        </div>
    );
}
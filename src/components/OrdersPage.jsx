import React, { useState, useEffect } from "react";
import { 
    FaArrowLeft, FaBoxOpen, FaCheckCircle, FaTruck, FaHourglassHalf, 
    FaDollarSign, FaTimesCircle, FaMapMarkerAlt, FaCalendarAlt, FaReceipt, FaShoppingBasket
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './OrdersPage.css'; // Ensure you have this CSS file

// ⚠️ WARNING: Update this URL to match your server's domain/port
const API_BASE = "http://localhost:5000/api";

// --- MOCK DATA/FUNCTION (Must match the TEMP_USER_ID in your backend routes/order.js) ---
const getCurrentUserId = () => "65b121e780d603417855f70a"; 

// --- STATUS MAPPING (For display clarity and colors) ---
const statusMap = {
    'Pending Verification': { icon: FaHourglassHalf, color: '#ffc107', bg: '#fffbe5', description: 'Payment processing is currently underway.' },
    'Paid': { icon: FaCheckCircle, color: '#007bff', bg: '#e5f3ff', description: 'Payment confirmed. We are preparing your items for dispatch.' },
    'Shipped': { icon: FaTruck, color: '#28a745', bg: '#e5fce5', description: 'Your package has left the warehouse and is in transit.' },
    'Delivered': { icon: FaCheckCircle, color: '#6610f2', bg: '#f0e5ff', description: 'Order successfully delivered to your address.' },
    'Cancelled': { icon: FaTimesCircle, color: '#dc3545', bg: '#ffe5e5', description: 'This order has been cancelled.' },
    'Failed': { icon: FaTimesCircle, color: '#6c757d', bg: '#f0f0f0', description: 'Payment/Order failed. Please contact support if needed.' },
};

// --- Helper Component for Status Tag ---
const StatusTag = ({ status, minimal = false }) => {
    const { icon: Icon, color } = statusMap[status] || { icon: FaBoxOpen, color: '#ccc' };
    const style = { 
        backgroundColor: statusMap[status]?.bg || '#f0f0f0', 
        color: color, 
        border: `1px solid ${color}`,
    };

    return (
        <span className={`status-tag status-${status.replace(/\s/g, '').toLowerCase()}`} style={style}>
            {minimal ? <Icon size={12} style={{marginRight: '5px'}}/> : null}
            {minimal ? status : status}
        </span>
    );
};

// --- Order Timeline Component ---
const OrderTimeline = ({ order }) => {
    const { payment, createdAt, shippedAt, cancelledAt } = order;
    const currentStatus = payment.status;

    // 🔑 ADDED 'Pending Verification' as first step and replaced 'Paid' with 'Order Confirmed'.
    // NOTE: This array defines the sequence and what step is considered complete.
    const steps = [
        { status: 'Pending Verification', label: 'Payment Received', time: createdAt },
        { status: 'Paid', label: 'Order Confirmed', time: createdAt },
        { status: 'Shipped', label: 'Order Shipped', time: shippedAt },
        { status: 'Delivered', label: 'Delivered', time: null },
    ];
    
    // Determine the highest completed step index
    let activeIndex = -1;
    if (currentStatus === 'Cancelled' || currentStatus === 'Failed') {
        activeIndex = -2; // Special status for cancellation/failure
    } else {
        // Find the index of the highest status achieved in the steps array
        activeIndex = steps.findIndex(step => step.status === currentStatus);
        
        // If the current status is 'Paid', we consider both 'Pending Verification' (0) and 'Paid' (1) completed.
        if (currentStatus === 'Paid') {
             activeIndex = 1; 
        } else if (currentStatus === 'Shipped') {
             activeIndex = 2;
        } else if (currentStatus === 'Delivered') {
             activeIndex = 3;
        } else if (currentStatus === 'Pending Verification') {
             activeIndex = 0;
        }
    }
    
    // Status color constants
    const completedColor = '#28a745'; // Green
    const activeColor = '#007bff'; // Blue
    const pendingColor = '#ccc'; // Gray
    const errorColor = '#dc3545'; // Red

    // Handle cancellation/failure status display separately
    if (activeIndex === -2) {
        return (
            <div className="timeline-container">
                <div className="timeline-item active error">
                    <span className="timeline-dot" style={{backgroundColor: errorColor}}></span>
                    <div className="timeline-content">
                        <h4 style={{color: errorColor}}><FaTimesCircle size={14} style={{marginRight: '5px'}}/> {currentStatus}</h4>
                        <p>{statusMap[currentStatus]?.description}</p>
                        <p className="timeline-time">on {new Date(cancelledAt || createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            {steps.map((step, index) => {
                const isCompleted = index <= activeIndex;
                const isActive = index === activeIndex;
                
                let dotColor = pendingColor;
                if (isActive) {
                    dotColor = activeColor;
                } else if (isCompleted) {
                    dotColor = completedColor;
                }
                
                // Determine the status icon based on state
                let statusIcon = null;
                if (isCompleted) {
                    statusIcon = <FaCheckCircle size={14} style={{marginRight: '5px'}}/>;
                } else if (isActive) {
                    statusIcon = statusMap[currentStatus]?.icon ? React.createElement(statusMap[currentStatus].icon, { size: 14, style: {marginRight: '5px'} }) : null;
                }

                return (
                    <div 
                        key={step.status} 
                        className={`timeline-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                        <span className="timeline-dot" style={{backgroundColor: dotColor}}></span>
                        {/* Only draw the line if it's not the last step */}
                        {index < steps.length - 1 && (
                            <span className="timeline-line" style={{backgroundColor: isCompleted ? completedColor : pendingColor}}></span>
                        )}
                        <div className="timeline-content">
                            <h4 style={{color: isCompleted ? completedColor : (isActive ? activeColor : '#333')}}>
                                {statusIcon}
                                {step.label}
                            </h4>
                            {isActive && <p className="status-description">{statusMap[currentStatus]?.description}</p>}
                            {step.time && <p className="timeline-time">on {new Date(step.time).toLocaleDateString()}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// --- Order Summary Card Component (Mimics Image Style) ---
const OrderSummaryCard = ({ order, onSelect, navigate }) => {
    // Note: Items are named 'items' per the Mongoose schema
    const mainProduct = order.items[0]; 
    const otherItemsCount = order.items.length > 1 ? order.items.length - 1 : 0;
    const isFinalStatus = ['Delivered', 'Cancelled', 'Failed'].includes(order.payment.status);

    // Handler to navigate to the product page when clicking on the product area
    const handleProductClick = (e, productId) => {
        e.stopPropagation(); 
        if (productId) {
            navigate(`/product/${productId}`);
        }
    };

    return (
        // Primary click opens the details view
        <div className="order-summary-card" onClick={() => onSelect(order)}> 
            <div className="card-header">
                <p>
                    <span className="order-id">ORDER ID: #{order._id.substring(0, 10)}</span>
                    <span className="order-date">Ordered on: {new Date(order.createdAt).toLocaleDateString()}</span>
                </p>
                {isFinalStatus && (
                    <StatusTag status={order.payment.status} minimal={true} />
                )}
            </div>

            {/* Product Area - Clickable to Product Details */}
            <div className="card-body" onClick={(e) => e.stopPropagation()}> 
                
                {/* Image Link */}
                <a 
                    href={`/product/${mainProduct.productId}`} 
                    onClick={(e) => handleProductClick(e, mainProduct.productId)} // Use handler for navigation
                >
                    <img 
                        src={mainProduct?.photo || "https://via.placeholder.com/100"} 
                        alt={mainProduct?.name || "Product"} 
                        className="product-image clickable-product" 
                    />
                </a>
                
                <div className="product-details">
                    {/* Name Link */}
                    <a 
                        href={`/product/${mainProduct.productId}`}
                        className="product-link"
                        onClick={(e) => handleProductClick(e, mainProduct.productId)} // Use handler for navigation
                    >
                        <p className="product-name clickable-product">
                            **{mainProduct?.name || 'Item Name Not Found'}**
                        </p>
                    </a>
                    <p className="product-qty-price">
                        {/* ✅ FIX 1: Update quantity label in summary card */}
                        Weight (kgs): {mainProduct?.quantity || 1} 
                        {otherItemsCount > 0 ? `, +${otherItemsCount} more item${otherItemsCount > 1 ? 's' : ''}` : ''}
                    </p>
                    <p className="product-price">
                        ₹{mainProduct ? mainProduct.price.toFixed(2) : '0.00'}
                    </p>
                    {otherItemsCount > 0 && (
                        <FaShoppingBasket className="extra-item-icon" size={24} color="#ccc" />
                    )}
                </div>
            </div>

            <div className="card-footer">
                <div className="order-timeline-status">
                    <div className={`status-line status-${order.payment.status.replace(/\s/g, '').toLowerCase()}`}>
                        {order.payment.status === 'Shipped' && (
                            <span className="status-text"><FaTruck /> Shipped</span>
                        )}
                        {order.payment.status === 'Delivered' && (
                            <span className="status-text delivered"><FaCheckCircle /> Delivered</span>
                        )}
                        {['Paid', 'Pending Verification'].includes(order.payment.status) && (
                            <span className="status-text"><FaHourglassHalf /> Processing</span>
                        )}
                        {['Cancelled', 'Failed'].includes(order.payment.status) && (
                            <span className="status-text cancelled"><FaTimesCircle /> {order.payment.status}</span>
                        )}
                    </div>
                </div>

                <div className="order-actions">
                    <span className="order-total-footer">
                        **Order Total: ₹{order.totalAmount.toFixed(2)}**
                    </span>
                    {/* View Details Button - Use e.stopPropagation() to prevent conflict with card click */}
                    <button className="view-details-btn" onClick={(e) => { e.stopPropagation(); onSelect(order); }}>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main OrdersPage Component ---
export default function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // 1. Fetch Orders Logic 
    useEffect(() => {
        const fetchOrders = async () => {
            const userId = getCurrentUserId(); 
            const url = `${API_BASE}/orders/history`; 
            
            try {
                setIsLoading(true);
                const res = await fetch(url); 
                const data = await res.json();

                if (res.ok) {
                    const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setOrders(sortedOrders);
                } else {
                    toast.error(data.message || "Failed to fetch orders.");
                }
            } catch (err) {
                toast.error("Network error fetching orders.");
                console.error("Fetch orders error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // 2. Render Order List (Home View)
    const renderOrderList = () => {
        if (isLoading) {
            return <p style={{textAlign: 'center', marginTop: '50px'}}>Loading your order history...</p>;
        }

        if (orders.length === 0) {
            return (
                <div className="orders-list-placeholder">
                    <FaBoxOpen size={100} style={{ color: '#ccc', marginBottom: '20px' }} />
                    <p>You haven't placed any orders yet.</p>
                    <button className="primary-action-btn" onClick={() => navigate('/dashboard')}>
                        Start Shopping
                    </button>
                </div>
            );
        }

        return (
            <div className="orders-list-container">
                {orders.map((order) => (
                    <OrderSummaryCard 
                        key={order._id} 
                        order={order} 
                        onSelect={setSelectedOrder} 
                        navigate={navigate} 
                    />
                ))}
            </div>
        );
    };

    // 3. Render Selected Order Details (Updated with Timeline)
    const renderOrderDetails = () => {
        if (!selectedOrder) return null;

        const { deliveryDetails, totalAmount, payment, items: orderProducts } = selectedOrder;
        const currentStatus = payment.status;

        return (
            <div className="order-details-view">
                <button onClick={() => setSelectedOrder(null)} className="back-to-list-btn">
                    <FaArrowLeft /> Back to Orders List
                </button>
                
                <h2><FaReceipt /> Order Tracking (#{selectedOrder._id.substring(0, 10)}...)</h2>
                
                {/* 🔑 Timeline Component */}
                <div className="detail-section timeline-box">
                    <h3 style={{marginBottom: '20px'}}>
                        Status: <StatusTag status={currentStatus} minimal={true} />
                    </h3>
                    <OrderTimeline order={selectedOrder} />
                </div>

                {/* Shipping Details */}
                <div className="detail-section shipping-details">
                    <h3><FaMapMarkerAlt /> Shipping Address</h3>
                    <p><strong>Recipient:</strong> {deliveryDetails.name}</p>
                    <p><strong>Phone:</strong> {deliveryDetails.phone}</p>
                    <p><strong>Address:</strong> {deliveryDetails.address}, {deliveryDetails.city}, {deliveryDetails.pincode}</p>
                </div>

                {/* Products List */}
                <div className="detail-section order-products">
                    <h3><FaShoppingBasket /> Items Purchased ({orderProducts.length})</h3>
                    <ul className="product-items-list">
                        {orderProducts.map((item, index) => (
                            <li key={index} className="order-item">
                                {/* Link container */}
                                <a 
                                    href={`/product/${item.productId}`} 
                                    onClick={(e) => { e.preventDefault(); navigate(`/product/${item.productId}`); }}
                                    className="product-detail-link"
                                >
                                    <img src={item.photo || "https://via.placeholder.com/50"} alt={item.name} className="item-photo" />
                                    <div className="item-details">
                                        <p className="item-name">**{item.name}**</p>
                                        <p className="item-qty-price">
                                            {/* ✅ FIX 2: Update quantity label in detailed view */}
                                            Weight (kgs): {item.quantity} x ₹{item.price.toFixed(2)} = **₹{(item.quantity * item.price).toFixed(2)}**
                                        </p>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="total-summary-footer">
                        <p><strong>Order Total:</strong> **₹{totalAmount.toFixed(2)}**</p>
                        <p><strong>Payment Status:</strong> <StatusTag status={payment.status} minimal={true} /></p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="orders-page">
            <ToastContainer position="top-center" autoClose={2000} />
            <header className="orders-header-bar">
                <button onClick={() => selectedOrder ? setSelectedOrder(null) : navigate("/dashboard")} className="back-btn">
                    <FaArrowLeft /> {selectedOrder ? 'Back to List' : 'Back to Dashboard'}
                </button>
                <h1>{selectedOrder ? 'Order Tracking' : 'My Orders'}</h1>
            </header>

            <main className="orders-content">
                {selectedOrder ? renderOrderDetails() : renderOrderList()}
            </main>
        </div>
    );
}
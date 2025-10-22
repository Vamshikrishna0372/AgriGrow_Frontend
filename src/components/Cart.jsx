import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaInfoCircle, FaStar, FaStarHalfAlt, FaTrash } from "react-icons/fa";
import { jsPDF } from "jspdf";
import Scanner from "./Scanner.jpg"; // Local QR scanner image
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [cart, setCart] = useState(state?.cart || []);
  const total = cart.reduce((acc, p) => acc + p.price, 0);

  const [selected, setSelected] = useState(null);

  // Delivery form state
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [checkout, setCheckout] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Payment state
  const [payStage, setPayStage] = useState(false);
  const [transaction, setTransaction] = useState({ txnId: "", utrId: "" });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDelivery((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setSubmitted(true);
  };

  const handleBackToForm = () => setSubmitted(false);

  const handlePayNow = () => setPayStage(true);

  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    if (!transaction.txnId || !transaction.utrId) {
      alert("Please enter both Transaction ID and UTR ID");
      return;
    }
    setPaymentSuccess(true);
  };

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("🌿 Green Basket Invoice", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text(`Name: ${delivery.name}`, 10, y); y += 7;
    doc.text(`Phone: ${delivery.phone}`, 10, y); y += 7;
    if (delivery.email) { doc.text(`Email: ${delivery.email}`, 10, y); y += 7; }
    doc.text(`Address: ${delivery.address}, ${delivery.city} - ${delivery.pincode}`, 10, y); y += 10;

    doc.text("Products:", 10, y); y += 7;
    const deliveryFee = 50;
    cart.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} - ₹${p.price} + Delivery ₹${deliveryFee}`, 10, y);
      y += 7;
    });

    const totalAmount = total + cart.length * deliveryFee;
    y += 5;
    doc.text(`Total Amount Paid: ₹${totalAmount}`, 10, y);

    doc.save(`Invoice_${delivery.name}.pdf`);
  };

  // ✅ Remove product from cart
  const handleRemove = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  return (
    <div className="cart-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <h1 className="cart-title">🌿 Your Green Basket</h1>

      {cart.length === 0 ? (
        <p className="empty-cart">No items in your basket yet.</p>
      ) : (
        <>
          {/* Cart Items */}
          {!checkout && (
            <div className="cart-layout">
              <div className="cart-left">
                {cart.map((p, i) => (
                  <div key={i} className="cart-card">
                    <img src={p.photo || "https://via.placeholder.com/130"} alt={p.name} className="cart-img" />
                    <div className="cart-details">
                      <h3>{p.name}</h3>
                      <p className="brand">Brand: {p.brand || "Generic"}</p>
                      <p className="type">Type: {p.type || "N/A"}</p>
                      <p className="price">₹{p.price}</p>
                      <div className="rating">
                        {Array.from({ length: 5 }).map((_, j) => {
                          const full = j + 1 <= Math.floor(p.rating);
                          const half = !full && p.rating - j >= 0.5;
                          return full ? <FaStar key={j} /> : half ? <FaStarHalfAlt key={j} /> : <FaStar key={j} style={{ color: "#ccc" }} />;
                        })}
                      </div>
                      <p className={p.inStock ? "in-stock" : "out-stock"}>
                        {p.inStock ? "In Stock ✅" : "Out of Stock ❌"}
                      </p>
                      <div className="cart-buttons">
                        <button className="info-btn" onClick={() => setSelected(p)}>
                          <FaInfoCircle /> More Info
                        </button>
                        <button className="remove-btn" onClick={() => handleRemove(i)}>
                          <FaTrash /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ Price Summary Section */}
              <div className="cart-right">
                <div className="price-summary">
                  <h3>Price Details</h3>
                  <p>Price ({cart.length} items): ₹{total}</p>
                  <p>Delivery Charges: ₹{cart.length * 50}</p>
                  <hr />
                  <h4>Total Amount: ₹{total + cart.length * 50}</h4>
                </div>
                <button className="checkout-btn" onClick={() => setCheckout(true)}>🛒 Checkout</button>
              </div>
            </div>
          )}

          {/* Step 1: Delivery Form */}
          {checkout && !submitted && (
            <form className="delivery-form" onSubmit={handleDeliverySubmit}>
              <h3>🚚 Delivery Details</h3>
              <input type="text" name="name" placeholder="Full Name" required value={delivery.name} onChange={handleChange} />
              <input type="tel" name="phone" placeholder="Phone Number" required value={delivery.phone} onChange={handleChange} />
              <input type="email" name="email" placeholder="Email (Optional)" value={delivery.email} onChange={handleChange} />
              <textarea name="address" placeholder="Address" required value={delivery.address} onChange={handleChange}></textarea>
              <input type="text" name="city" placeholder="City" required value={delivery.city} onChange={handleChange} />
              <input type="text" name="pincode" placeholder="Pincode" required value={delivery.pincode} onChange={handleChange} />
              <button type="submit">Confirm Delivery Details</button>
            </form>
          )}

          {/* Step 2: Delivery Summary */}
          {submitted && !payStage && !paymentSuccess && (
            <div className="delivery-summary">
              <h3>✅ Delivery Details</h3>
              <p><b>Name:</b> {delivery.name}</p>
              <p><b>Phone:</b> {delivery.phone}</p>
              {delivery.email && <p><b>Email:</b> {delivery.email}</p>}
              <p><b>Address:</b> {delivery.address}, {delivery.city} - {delivery.pincode}</p>

              <h3>🛒 Products</h3>
              {cart.map((p, i) => (
                <p key={i}><b>{p.name}</b> - ₹{p.price} + ₹50 delivery</p>
              ))}
              <p className="total-amount"><b>Total Amount:</b> ₹{total + cart.length * 50}</p>

              <div className="summary-buttons">
                <button className="back-btn" onClick={handleBackToForm}>🔙 Back</button>
                <button className="pay-now-btn" onClick={handlePayNow}>💳 Pay Now</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {payStage && !paymentSuccess && (
            <div className="payment-section">
              <h3>💰 Scan QR Code to Pay</h3>
              <p className="total-amount"><b>Amount:</b> ₹{total + cart.length * 50}</p>
              <div className="qr-container">
                <img src={Scanner} alt="QR Code Scanner" className="qr-code" />
              </div>
              <form onSubmit={handleTransactionSubmit} className="transaction-form">
                <input type="text" name="txnId" placeholder="Transaction ID" required value={transaction.txnId} onChange={handleTransactionChange} />
                <input type="text" name="utrId" placeholder="UTR ID" required value={transaction.utrId} onChange={handleTransactionChange} />
                <button type="submit">Submit Payment</button>
              </form>
            </div>
          )}

          {/* Step 4: Payment Success */}
          {paymentSuccess && (
            <div className="success-message">
              <h2>✅ Payment Successful!</h2>
              <p>Your order has been placed successfully.</p>
              <div className="delivery-summary">
                <h3>🚚 Delivery Details</h3>
                <p><b>Name:</b> {delivery.name}</p>
                <p><b>Phone:</b> {delivery.phone}</p>
                {delivery.email && <p><b>Email:</b> {delivery.email}</p>}
                <p><b>Address:</b> {delivery.address}, {delivery.city} - {delivery.pincode}</p>
                <p><b>Expected Delivery:</b> {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString()}</p>

                <h3>🛒 Ordered Products</h3>
                {cart.map((p, i) => (
                  <p key={i}><b>{p.name}</b> x1 - ₹{p.price} + ₹50 delivery</p>
                ))}
                <p className="total-amount"><b>Total Paid:</b> ₹{total + cart.length * 50}</p>

                <div className="post-payment-buttons">
                  <button className="home-btn" onClick={() => navigate("/dashboard")}>
                    🏠 Back to Home
                  </button>
                  <button onClick={handleDownloadInvoice}>📄 Download Invoice</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <img src={selected.photo || "https://via.placeholder.com/300"} alt={selected.name} />
            <div className="modal-details">
              <h2>{selected.name}</h2>
              <p><b>Brand:</b> {selected.brand || "Generic"}</p>
              <p><b>Type:</b> {selected.type || "N/A"}</p>
              <p><b>Price:</b> ₹{selected.price}</p>
              <p><b>Rating:</b> {selected.rating || "N/A"} ⭐</p>
              <p><b>Description:</b> {selected.description}</p>
              <p className={selected.inStock ? "in-stock" : "out-stock"}>
                {selected.inStock ? "In Stock ✅" : "Out of Stock ❌"}
              </p>
              <button className="close-btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

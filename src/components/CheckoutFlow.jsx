import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'; 
import { FaDownload, FaHome, FaCheckCircle, FaChevronLeft, FaCreditCard, FaSeedling, FaTruck, FaMapMarkedAlt } from 'react-icons/fa';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './CheckoutFlow.css';
import ScannerImage from "./Scanner.jpg"; 

// --- MOCK API BASE URL ---
const API_BASE_URL = 'http://localhost:5000/api/orders';

// Helper function to format currency strings with commas (for HTML display)
const formatCurrency = (amount) => {
    // Ensure input is treated as a number before formatting
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


// ----------------------------------------------------------------------------------
// Helper Component: Renders the fixed-format invoice bill based on the image.
// ----------------------------------------------------------------------------------
const InvoiceBill = ({ delivery, subtotal, totalAmount, cart }) => { 
    // Generate the current date
    const today = new Date();
    const invoiceDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }); 

    // FIX 1: Map the actual cart items and CALCULATE/FORMAT all prices dynamically
    const invoiceItems = cart.map(item => {
        const product = item.productId || {};
        const price = Number(product.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const total = price * quantity;

        return {
            name: product.name || 'Unknown Product',
            qty: quantity,
            // CORRECT UNIT PRICE: Price per item, formatted.
            unitPrice: formatCurrency(price),
            // CORRECT TOTAL PRICE: Quantity * Price, formatted.
            total: formatCurrency(total),
        };
    });

    // Use dynamic customer details from the 'delivery' prop
    const customerName = delivery.name || "Kisan Rao (Default)"; 
    const customerAddress = `${delivery.address}, ${delivery.city}, ${delivery.pincode}` || "Plot No. 15, Krishi Nagar, Bhopal, MP 462022"; 
    const customerPhone = delivery.phone || "+91 98765 43210"; 

    // Dynamic totals for the HTML view (using calculated values)
    const calculatedSubtotal = subtotal;
    const calculatedGrandTotal = totalAmount;
    const fixedDeliveryFee = 250.00;
    const fixedGST = 443.00; // Still using a fixed mock GST value


    return (
        <div className="invoice-container">
            <header className="invoice-header">
                <div className="logo-section">
                    <FaSeedling size={30} color="#2e7d32" />
                    <div className="company-info">
                        <span className="company-name">AGRIGROW</span>
                        <span className="company-tagline">GROW SMART. GROW MORE</span>
                    </div>
                </div>
                <div className="invoice-title-section">
                    <h1 className="invoice-title">INVOICE</h1>
                    <p>Invoice # INV-2024-007</p>
                    <p>Date: {invoiceDate}</p> 
                </div>
            </header>
            
            <div className="billing-shipping-details">
                <div className="billing-details">
                    <h3>BILLING DETAILS</h3>
                    <p>Customer: <strong>{customerName}</strong></p>
                    <p>Address: {customerAddress}</p>
                    <p>Phone: {customerPhone}</p>
                </div>
                <div className="shipping-details">
                    <h3>SHIPPING DETAILS</h3>
                </div>
            </div>

            <table className="item-table">
                <thead>
                    <tr>
                        <th className="item-name">DESCRIPTION</th>
                        <th className="item-qty">QTY</th>
                        <th className="item-price">UNIT PRICE</th>
                        <th className="item-total">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {/* FIX 2: Render the dynamically created invoiceItems with correct prices */}
                    {invoiceItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td className="item-qty">{item.qty}</td>
                            <td className="item-price">₹{item.unitPrice}</td>
                            <td className="item-total">₹{item.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="summary-section-invoice">
                <div className="spacer"></div>
                <div className="totals-box-invoice">
                    <div className="summary-line">
                        <span>SUBTOTAL:</span>
                        <span className="currency-val">₹{calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-line">
                        <span>DELIVERY FEE:</span>
                        <span className="currency-val">₹{fixedDeliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="summary-line">
                        <span>GST (5%):</span>
                        <span className="currency-val">GST {fixedGST.toFixed(2)}</span>
                    </div>
                    <div className="summary-line grand-total-line">
                        <span>GRAND TOTAL:</span>
                        <span className="currency-val grand-total-val">₹{calculatedGrandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="terms-conditions">
                <h3>TERMS & CONDITIONS</h3>
                <p>Payment due within 15 days. Thank you for your business!</p>
                <p>Bank Transfer: A/C No. 123456789, IFSC: AGRIGROW07.</p>
                <p>UPI ID: AGRIGROW@UPI</p>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// Main Component: CheckoutFlow
// ----------------------------------------------------------------------------------
export default function CheckoutFlow({
    cart = [],
    delivery = {},
    subtotal = 0,
    totalAmount = 0,
    navigate, // This is the navigation function from the router
    saveAddress = false,
}) {
    // CRITICAL STATE MANAGEMENT
    const [payStage, setPayStage] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transaction, setTransaction] = useState({ txnId: '', utrId: '' }); 

    const safeSetPayStage = setPayStage;
    const safeSetPaymentSuccess = setPaymentSuccess;

    const shippingFee = totalAmount - subtotal;
    
    // Mock data if props are empty
    if (cart.length === 0) {
        // Mock data to ensure the component renders even without real props
        cart = [
            { productId: { _id: "60c72b2f9f1b2c0015b4e78a", name: "Mock Seeds Pack", price: 100.00 }, quantity: 3, photo: "mock-photo-url" },
            { productId: { _id: "60c72b2f9f1b2c0015b4e78b", name: "Plant Food (1L)", price: 250.50 }, quantity: 2, photo: "mock-photo-url" }
        ];
        // subtotal = 3 * 100 + 2 * 250.50 = 300 + 501 = 801
        subtotal = 801.00; 
        totalAmount = 881.00; // Example total
        if (!delivery.name) {
            delivery = { name: "Test User", phone: "1234567890", address: "45, Main Road", city: "Bhopal", pincode: "462022" };
        }
    }
    
    const displayTxnId = transaction.txnId || 'N/A';
    const displayUtrId = transaction.utrId || 'N/A';

    // Toast container
    const toastContainer = <ToastContainer position="top-center" autoClose={5000} />;

    // Handlers
    
    const handleEditAddress = () => {
        toast.info("Returning to Address Selection...");
        if (navigate) {
            navigate(-1); 
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/address-selection'; 
        }
    };


    const handlePayNow = () => safeSetPayStage(true); 
    const handleBackToSummary = () => safeSetPayStage(false);

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        setTransaction((prev) => ({ ...prev, [name]: value }));
    };

    // --------------------------------------------------------------------------
    // --- API SUBMISSION LOGIC ---
    // --------------------------------------------------------------------------
    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (!transaction.txnId || !transaction.utrId) {
            toast.error("Please enter both **Transaction ID** and **UTR ID**.");
            return;
        }

        setIsSubmitting(true);
        
        const orderData = {
            items: cart.map(item => ({
                productId: item.productId._id, 
                quantity: item.quantity,
                price: item.productId.price,   
                name: item.productId.name,     
                photo: item.productId.photo || item.photo, 
            })),
            deliveryDetails: delivery,
            totalAmount: totalAmount,
            payment: { 
                method: 'UPI', 
                txnId: transaction.txnId, 
                utrId: transaction.utrId,
                status: 'Pending Verification', 
            },
            saveAddress: saveAddress, 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/place`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || data.message || `Server Error: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            safeSetPaymentSuccess(true);
            safeSetPayStage(false);
            toast.success("Order placed and saved! Verification pending.");

        } catch (error) {
            console.error("Order submission error:", error);
            toast.error(`Order Failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --------------------------------------------------------------------------
    // --- PDF GENERATION LOGIC (Updated to use actual cart item prices) ---
    // --------------------------------------------------------------------------
    const handleDownloadInvoice = () => {
        
        const doc = new jsPDF({ unit: 'mm', format: 'a4' }); 
        let y = 20;
        
        const pdfInvoiceDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        if (typeof doc.autoTable !== 'function') {
            toast.warn("Using text fallback due to jspdf-autotable failure.");
        }
        
        // Retrieve dynamic data
        const pdfCustomerName = delivery.name || "Kisan Rao";
        const pdfCustomerAddress = `${delivery.address}, ${delivery.city}, ${delivery.pincode}`;
        const pdfCustomerPhone = delivery.phone || "+91 98765 43210";
        
        // These variables hold the CLEAN, formatted strings
        const pdfSubtotal = subtotal.toFixed(2);
        const pdfTotalAmount = totalAmount.toFixed(2);
        
        const pdfDeliveryFee = 250.00.toFixed(2); 
        const pdfGST = 443.00.toFixed(2); 

        // FIX 3: Use actual cart data for PDF generation, formatted correctly
        const pdfItemsData = cart.map(item => {
            const product = item.productId || {};
            const price = Number(product.price) || 0;
            const quantity = Number(item.quantity) || 1;
            const total = price * quantity;
            
            return {
                desc: product.name || 'Unknown Product',
                qty: quantity,
                unit: formatCurrency(price), // Use helper for clean formatting
                total: formatCurrency(total), // Use helper for clean formatting
            };
        });

        // --- Invoice Layout (Manual Rendering) ---
        
        // Header & Logo 
        doc.setFont('Helvetica', 'Bold');
        doc.setFontSize(24);
        doc.setTextColor(46, 125, 50); // AGRIGROW Green
        doc.text("AGRIGROW", 10, y);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text("GROW SMART. GROW MORE", 10, y + 5);

        // Invoice Title & Details
        doc.setFontSize(30);
        doc.setFont('Helvetica', 'Bold');
        doc.setTextColor(0, 0, 0);
        doc.text("INVOICE", 180, y, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text("Invoice # INV-2024-007", 180, y + 7, { align: 'right' });
        doc.text(`Date: ${pdfInvoiceDate}`, 180, y + 12, { align: 'right' });
        
        y += 20;
        doc.line(10, y, 190, y); // Separator Line

        // Billing Details (Dynamic)
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'Bold');
        doc.text("BILLING DETAILS", 10, y + 7);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text(`Customer: ${pdfCustomerName}`, 10, y + 14);
        doc.text(`Address: ${pdfCustomerAddress}`, 10, y + 19);
        doc.text(`Phone: ${pdfCustomerPhone}`, 10, y + 24);

        // Shipping Details
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'Bold');
        doc.text("SHIPPING DETAILS", 100, y + 7);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text("Same as Billing", 100, y + 14);

        y += 35;
        doc.line(10, y, 190, y); // Separator Line

        // --- Table Headers (Manual) ---
        doc.setFont('Helvetica', 'Bold');
        doc.setFontSize(10);
        const colX = [10, 100, 135, 170]; 
        doc.text("DESCRIPTION", colX[0], y + 5);
        doc.text("QTY", colX[1], y + 5);
        doc.text("UNIT PRICE", 150, y + 5, {align: 'center'}); // Center Unit Price
        doc.text("TOTAL", 190, y + 5, {align: 'right'}); // Align Total to the far right
        y += 7;
        doc.line(10, y, 190, y); 

        // --- Table Rows (Manual) ---
        doc.setFont('Helvetica', 'Normal');
        pdfItemsData.forEach(item => { 
            y += 7;
            doc.text(item.desc, colX[0], y);
            doc.text(String(item.qty), colX[1], y, { align: 'center' });
            // FIX 4: Ensure item.unit and item.total from the map are used
            doc.text(`₹${item.unit}`, 170, y, { align: 'right' });
            doc.text(`₹${item.total}`, 190, y, { align: 'right' });
        });
        
        y += 5;
        doc.line(10, y, 190, y); 

        // --- Totals Summary (Manual) ---
        const totalsX = 140; 
        const totalsRightX = 190; 
        const lineGap = 6;
        const totalsY = y; 
        
        y += 5; 

        // Subtotal
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text("SUBTOTAL:", totalsX, totalsY + lineGap, { align: 'left' });
        doc.text(`₹${pdfSubtotal}`, totalsRightX, totalsY + lineGap, { align: 'right' });
        
        // Delivery Fee
        doc.text("DELIVERY FEE:", totalsX, totalsY + 2 * lineGap, { align: 'left' });
        doc.text(`₹${pdfDeliveryFee}`, totalsRightX, totalsY + 2 * lineGap, { align: 'right' });

        // GST
        doc.text("GST (5%):", totalsX, totalsY + 3 * lineGap, { align: 'left' });
        doc.text(`GST ₹${pdfGST}`, totalsRightX, totalsY + 3 * lineGap, { align: 'right' });

        // Separator line before GRAND TOTAL
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(totalsX, totalsY + 4 * lineGap - 2, totalsRightX, totalsY + 4 * lineGap - 2); 
        
        // GRAND TOTAL
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'Bold');
        doc.text("GRAND TOTAL:", totalsX, totalsY + 5 * lineGap, { align: 'left' });
        doc.setTextColor(192, 57, 43); // Reddish color for total
        doc.text(`₹${pdfTotalAmount}`, totalsRightX, totalsY + 5 * lineGap, { align: 'right' });
        
        y = totalsY + 5 * lineGap + 15;

        // Terms & Conditions
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'Bold');
        doc.text("TERMS & CONDITIONS", 10, y);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text("Payment due within 15 days. Thank you for your business!", 10, y + 5);
        doc.text("Bank Transfer: A/C No. 123456789, IFSC: AGRIGROW07.", 10, y + 10);
        doc.text("UPI ID: AGRIGROW@UPI", 10, y + 15);
        
        doc.save(`Invoice_Agro_${new Date().getTime()}.pdf`);
        toast.info("Invoice downloaded successfully!");
    };

    // 3. Payment Success Page 
    if (paymentSuccess) {
        return (
            <div className="success-message detail-section">
                {toastContainer}
                <FaCheckCircle size={80} className="success-icon"/>
                <h2>Order Placed Successfully!</h2>
                <p className="verification-text">
                    Your order has been recorded. 
                    <br />
                    <strong>Payment status is Pending Verification</strong> of Transaction and UTR IDs.
                </p>

                <div className="shipping-info-summary">
                    <h3 className="shipping-info-title"><FaTruck /> Shipping Information</h3>
                    <p><strong>To:</strong> {delivery.name}</p>
                    <p><strong>Delivery Address:</strong> {delivery.address}, {delivery.city} - {delivery.pincode}</p>
                    <p className="transaction-info">
                        <strong>Transaction ID:</strong> {displayTxnId} 
                        <span className="separator">|</span> 
                        <strong>UTR ID:</strong> {displayUtrId}
                    </p>
                </div>

                <h3>📃 Official Invoice</h3>
                <div className="invoice-preview">
                    <InvoiceBill delivery={delivery} totalAmount={totalAmount} subtotal={subtotal} cart={cart} />
                </div>

                <div className="post-payment-buttons mobile-stacked-col">
                    <button onClick={handleDownloadInvoice} className="download-btn">
                        <FaDownload /> Download Invoice PDF
                    </button>
                    <button className="home-btn" onClick={() => (navigate ? navigate("/dashboard") : window.location.href='/')}>
                        <FaHome /> Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    // 2. Payment (QR Code) Page 
    if (payStage && !paymentSuccess) {
        return (
            <div className="payment-section detail-section">
                {toastContainer}
                <h3>💰 UPI Payment</h3>
                <p className="total-amount-payable"><strong>Amount Payable:</strong> <strong>₹{(totalAmount || 0).toFixed(2)}</strong></p>

                <div className="qr-container">
                    <img src={ScannerImage} alt="QR Code Scanner" className="qr-code" /> 
                </div>
                <p className="qr-instruction">Scan the QR code above or use the UPI ID: AGRIGROW@UPI to complete the payment.</p>

                <form onSubmit={handleTransactionSubmit} className="transaction-form">
                    <h4>Confirm Transaction Details</h4>
                    <input type="text" name="txnId" placeholder="Transaction ID (e.g., UPL...)" required value={transaction.txnId || ''} onChange={handleTransactionChange} disabled={isSubmitting} />
                    <input type="text" name="utrId" placeholder="UTR ID (12-16 digits)" required value={transaction.utrId || ''} onChange={handleTransactionChange} disabled={isSubmitting} />
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : <><FaCreditCard /> Submit Payment Verification</>}
                    </button>
                </form>

                <button className="back-to-summary-btn" onClick={handleBackToSummary} disabled={isSubmitting}>
                    <FaChevronLeft/> Back to Summary
                </button>
            </div>
        );
    }

    // 1. Order Summary Page
    if (!payStage && !paymentSuccess) {
        return (
            <div className="delivery-summary detail-section">
                {toastContainer}

                <div className="summary-section delivery-details-box">
                    <h3><FaMapMarkedAlt /> Delivery Details</h3>
                    <p><b>Name:</b> {delivery.name}</p>
                    <p><b>Phone:</b> {delivery.phone}</p>
                    <p><b>Address:</b> {delivery.address}, {delivery.city} - {delivery.pincode}</p>
                    <button className="edit-details-btn small-inline" onClick={handleEditAddress}>
                        <FaChevronLeft/> Edit Address
                    </button>
                </div>

                <div className="summary-section product-summary-box">
                    <h3>🛒 Product Details ({cart.length} items)</h3>
                    {cart.map((item, i) => {
                        const product = item.productId || {};
                        const price = Number(product.price) || 0;
                        const quantity = Number(item.quantity) || 1;
                        const lineTotal = (price * quantity).toFixed(2);

                        return (
                            <p key={i} className="product-item-summary">
                                <span style={{ fontWeight: 'bold' }}>{product.name || 'Unknown Product'}</span> x{quantity} - ₹{lineTotal}
                            </p>
                        );
                    })}
                </div>

                <div className="summary-section totals-box">
                    <p>Subtotal: ₹{(subtotal || 0).toFixed(2)}</p>
                    <p>Delivery Fee: ₹{shippingFee.toFixed(2)}</p>
                    <p className="total-amount"><strong>Total Amount:</strong> <strong>₹{(totalAmount || 0).toFixed(2)}</strong></p>
                </div>

                <div className="summary-buttons mobile-stacked-row">
                    <button className="pay-now-btn primary-btn" onClick={handlePayNow}>
                        💳 Proceed to Payment
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
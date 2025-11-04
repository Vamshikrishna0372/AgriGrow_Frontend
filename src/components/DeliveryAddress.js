import React, { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaSave, FaCheckCircle, FaPlus, FaEdit, FaChevronLeft } from "react-icons/fa";
import './DeliveryAddress.css'; // Assuming you named the CSS file this way

// ⚠️ IMPORTANT: These constants and API helpers must match the logic in Cart.js
const API_BASE_URL = 'https://agrigrow-backend-rgpk.onrender.com/';
const MOCK_USER_ID = "65b121e780d603417855f70a";

const initialDeliveryState = {
    _id: null,
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    label: ""
};

// --- API FUNCTIONS (These are defined here for the component's internal use) ---

const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    if (!response.ok) {
        throw new Error(data.message || data || `API call failed with status ${response.status}`);
    }
    return data;
};

const fetchSavedAddresses = async () => apiFetch(`/orders/addresses`);
const addAddressOnServer = async (addressData) => apiFetch(`/orders/addresses`, { method: 'POST', body: JSON.stringify(addressData) });
const updateAddressOnServer = async (addressData) => {
    if (!addressData._id) throw new Error("Cannot update address without an ID.");
    return apiFetch(`/orders/addresses/${addressData._id}`, { method: 'PUT', body: JSON.stringify(addressData) });
};


// --------------------------------------------------------
// --- DELIVERY ADDRESS COMPONENT ---
// --------------------------------------------------------

export default function DeliveryAddress({ setSubmitted, setCheckout, delivery, setDelivery, cartLength }) {
    
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [saveAddress, setSaveAddress] = useState(true);
    const [addressFormMode, setAddressFormMode] = useState('SELECT'); // 'SELECT', 'ADD', 'EDIT'
    const [actionLoading, setActionLoading] = useState(false);
    
    // Function to re-fetch and set state
    const loadAddresses = useCallback(async () => {
        setActionLoading(true);
        try {
            const data = await fetchSavedAddresses();
            setSavedAddresses(data);
            if (data.length > 0) {
                const defaultAddress = data.find(addr => addr.isDefault) || data[0];
                setDelivery(defaultAddress);
                setAddressFormMode('SELECT');
            } else {
                setAddressFormMode('ADD');
                setDelivery(initialDeliveryState);
            }
        } catch (err) {
            console.error("Failed to load saved addresses:", err);
            setAddressFormMode('ADD'); 
            setDelivery(initialDeliveryState);
        } finally {
            setActionLoading(false);
        }
    }, [setDelivery]);

    // EFFECT: Fetch saved addresses on component mount
    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);


    // --- Handlers ---
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDelivery((prev) => ({ ...prev, [name]: value }));
        // If the user starts typing in the fields while an address is selected, 
        // it means they are editing the selected address *temporarily* or *before saving*
        if (addressFormMode === 'SELECT' && savedAddresses.length > 0) {
            setAddressFormMode('EDIT');
        }
    };

    const handleAddressSelect = (address) => {
        setDelivery(address);
        setAddressFormMode('SELECT');
        setSaveAddress(true); // Default to saving/using existing
    };

    const handleEditAddress = (address) => {
        setDelivery(address);
        setAddressFormMode('EDIT');
    };

    const handleAddNewAddress = () => {
        setDelivery(initialDeliveryState);
        setAddressFormMode('ADD');
        setSaveAddress(true);
    };

    const handleBackToSelectMode = () => {
        if (savedAddresses.length > 0) {
            // Revert delivery state to the currently selected address from the saved list
            const currentSelected = savedAddresses.find(addr => addr._id === delivery._id);
            if (currentSelected) {
                 setDelivery(currentSelected);
            } else {
                // Fallback to the default/first address if the one being edited wasn't in the list
                setDelivery(savedAddresses.find(addr => addr.isDefault) || savedAddresses[0]);
            }
            setAddressFormMode('SELECT');
        } else {
            // No saved addresses, stay in ADD mode but clear the form
            setDelivery(initialDeliveryState); 
            setAddressFormMode('ADD');
        }
    };

    const handleDeliverySubmit = async (e) => {
        e.preventDefault();
        
        if (cartLength === 0) {
            alert("Your cart is empty!");
            return;
        }
        
        // Basic validation
        if (!delivery.name || !delivery.phone || !delivery.address || !delivery.city || !delivery.pincode) {
             alert("Please fill in all required delivery fields.");
             return;
        }

        let addressNeedsSave = (addressFormMode === 'EDIT' || addressFormMode === 'ADD') && saveAddress;

        // --- Address Save/Update Logic (Talks to the backend) ---
        if (addressNeedsSave) {
            try {
                setActionLoading(true);
                let result;
                // Prepare payload: include label for display, ensure isDefault is present
                const addressPayload = { 
                    ...delivery, 
                    isDefault: delivery.isDefault || false,
                    label: delivery.label || `${delivery.city}, ${delivery.pincode}` 
                };
                
                if (addressFormMode === 'EDIT') {
                    result = await updateAddressOnServer(addressPayload);
                } else if (addressFormMode === 'ADD') {
                    result = await addAddressOnServer(addressPayload);
                }
                
                const newAddress = result.address;

                // Update local state with the new/updated address
                setSavedAddresses(prev => {
                    if (addressFormMode === 'ADD') {
                        // Ensure only the new address is default, if applicable (backend should handle this too)
                        return [...prev.map(addr => ({ ...addr, isDefault: false })), newAddress];
                    } else {
                        // Update existing address, and ensure default flag is exclusive
                        return prev.map(addr => addr._id === newAddress._id ? newAddress : (newAddress.isDefault ? { ...addr, isDefault: false } : addr));
                    }
                });

                setDelivery(newAddress);
                setAddressFormMode('SELECT');

            } catch (error) {
                console.error("Failed to save or update address:", error);
                alert(`Error: ${error.message || "Failed to save address."}`);
                return; // Stop the flow on error
            } finally {
                setActionLoading(false);
            }
        }
        
        // If address was saved/updated OR if the mode was 'SELECT', proceed to the next stage.
        // This is the "fix" to allow moving forward even without an API call if an address is selected.
        setSubmitted(true); // Move to the CheckoutFlow Summary (Stage 2)
    };

    // Helper: Determine the header and button text
    const formHeader = addressFormMode === 'ADD' ? "📝 Enter New Address" : 
                       addressFormMode === 'EDIT' ? "✏️ Edit Address" : 
                       "🚚 Select Delivery Details";
    const submitButtonText = (addressFormMode === 'EDIT' || addressFormMode === 'ADD') ? 
                             (saveAddress ? "Save & Continue" : "Use Without Saving & Continue") : 
                             "Confirm Delivery & Continue";


    if (actionLoading && savedAddresses.length === 0) {
        return <div className="delivery-form loading-state">Loading saved addresses...</div>;
    }

    return (
        <form className="delivery-form" onSubmit={handleDeliverySubmit}>
            <h3>{formHeader}</h3>
            
            {/* Saved Address Selector/Summary block */}
            {savedAddresses.length > 0 && (
                <div className="saved-addresses-block">
                    {/* Selector visible when not in full ADD mode */}
                    {addressFormMode !== 'ADD' && (
                        <div className="saved-addresses-selector">
                            <h4><FaSave /> Select Address:</h4>
                            <div className="address-list">
                                {savedAddresses.map((addr, index) => {
                                    const isSelected = addr._id === delivery._id;
                                    return (
                                        <div key={addr._id || index} className="address-item">
                                            <button 
                                                type="button" 
                                                className={`address-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => handleAddressSelect(addr)}
                                                // Disable if it's the current selection and we're in SELECT mode (not EDIT)
                                                disabled={actionLoading || (isSelected && addressFormMode === 'SELECT')} 
                                            >
                                                {/* 🎯 FIX APPLIED: Only show the name */}
                                                <strong>{addr.name}</strong>
                                                {isSelected && <FaCheckCircle className="check-icon" />}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="edit-address-btn"
                                                onClick={() => handleEditAddress(addr)}
                                                title="Edit this address"
                                                disabled={actionLoading}
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                    )
                                })}
                                <button type="button" className="add-new-address-btn" onClick={handleAddNewAddress} disabled={actionLoading}><FaPlus /> Add New</button>
                            </div>
                            <hr style={{margin: '1rem 0'}} />
                        </div>
                    )}

                    {/* Selected Address Summary (Only show if in SELECT mode) */}
                    {addressFormMode === 'SELECT' && (
                        <div className="selected-address-summary">
                            <h4>Current Delivery To:</h4>
                            <p><strong>{delivery.name}</strong> ({delivery.phone})</p>
                            <p>{delivery.address}, {delivery.city}, {delivery.pincode}</p>
                            <button type="button" className="edit-details-btn" onClick={() => handleEditAddress(delivery)} disabled={actionLoading}>
                                <FaEdit /> Edit Current Address Details
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Address Input Form: Shown in ADD/EDIT mode, or if no addresses exist */}
            {(addressFormMode !== 'SELECT' || savedAddresses.length === 0) && (
                <>
                    <input type="text" name="name" placeholder="Full Name" required value={delivery.name} onChange={handleChange} disabled={actionLoading} />
                    <input type="tel" name="phone" placeholder="Phone Number" required value={delivery.phone} onChange={handleChange} disabled={actionLoading} />
                    <input type="email" name="email" placeholder="Email (Optional)" value={delivery.email} onChange={handleChange} disabled={actionLoading} />
                    <textarea name="address" placeholder="Address (House No, Street, Landmark)" required value={delivery.address} onChange={handleChange} disabled={actionLoading}></textarea>
                    <input type="text" name="city" placeholder="City" required value={delivery.city} onChange={handleChange} disabled={actionLoading} />
                    <input type="text" name="pincode" placeholder="Pincode" required value={delivery.pincode} onChange={handleChange} disabled={actionLoading} />
                    
                    <div className="save-address-checkbox">
                        <input 
                            type="checkbox" 
                            id="saveAddress" 
                            checked={saveAddress} 
                            onChange={(e) => setSaveAddress(e.target.checked)} 
                            disabled={actionLoading} 
                        />
                        <label htmlFor="saveAddress">Save this address for future orders</label>
                    </div>
                </>
            )}
            
            <button type="submit" className="confirm-delivery-btn" disabled={actionLoading}>
                {actionLoading ? 'Processing...' : submitButtonText}
            </button>
            
            {/* Option to go back to Select Mode if in Add/Edit Mode */}
            {(addressFormMode === 'ADD' || addressFormMode === 'EDIT') && savedAddresses.length > 0 && (
                <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleBackToSelectMode} 
                    disabled={actionLoading}
                >
                    Cancel & Use Selected Address
                </button>
            )}

            {/* Back to Cart button visible only on the address stage */}
            <button type="button" className="back-to-cart-btn" onClick={() => setCheckout(false)} disabled={actionLoading}>
                <FaChevronLeft /> Back to Cart
            </button>
        </form>
    );
}
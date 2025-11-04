// CheckoutPage.jsx
import React, { useState, useMemo } from 'react';
import CheckoutFlow from './CheckoutFlow';
import { useNavigate } from 'react-router-dom';

// Example mock data (replace with real data from your cart context or API)
const MOCK_CART = [
  { productId: { _id: 'p1', name: 'Organic Fertilizer', price: 250 }, quantity: 2 },
  { productId: { _id: 'p2', name: 'Seeds - Wheat', price: 120 }, quantity: 3 },
];

const MOCK_DELIVERY = {
  name: 'Ravi Kumar',
  phone: '9876543210',
  address: '12, Farm Lane',
  city: 'Hyderabad',
  pincode: '500001'
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(MOCK_CART);
  const [delivery, setDelivery] = useState(MOCK_DELIVERY);
  const [payStage, setPayStage] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transaction, setTransaction] = useState({ txnId: '', utrId: '' });
  const [submitted, setSubmitted] = useState(true);
  const [saveAddress, setSaveAddress] = useState(true);

  // compute subtotal & total here (example: flat delivery 50)
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = Number(item.productId?.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const deliveryFee = 50;
  const totalAmount = subtotal + deliveryFee;

  return (
    <div style={{ padding: 20 }}>
      <h2>Checkout</h2>
      <CheckoutFlow
        cart={cart}
        delivery={delivery}
        subtotal={subtotal}
        totalAmount={totalAmount}
        payStage={payStage}
        setPayStage={setPayStage}
        paymentSuccess={paymentSuccess}
        setPaymentSuccess={setPaymentSuccess}
        transaction={transaction}
        setTransaction={setTransaction}
        setSubmitted={setSubmitted}
        navigate={navigate}
        saveAddress={saveAddress}
      />
    </div>
  );
}

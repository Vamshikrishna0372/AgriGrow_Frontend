import React, { useState, useEffect } from "react";
import { 
  FaSignOutAlt, FaBoxOpen, FaPlusCircle, FaUsers, FaTruck, FaEdit, FaTrash 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminPanel.css";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    photo: "",
    price: "",
    description: "",
    rating: "",
    inStock: true,
    brand: "",
    type: "Soil",
    sku: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch products when 'products' section is active
  useEffect(() => {
    if (activeSection === "products") {
      fetch("https://agrigrow-backend-hus4.onrender.com/api/products")
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(err => toast.error("Error fetching products"));
    }
  }, [activeSection]);

  const handleLogout = () => navigate("/auth");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const productToSend = {
      ...newProduct,
      price: Number(newProduct.price),
      rating: Number(newProduct.rating) || 0,
    };

    try {
      let res, data;

      if (editingId) {
        // Update existing product
        res = await fetch(`https://agrigrow-backend-hus4.onrender.com/api/products/update/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productToSend),
        });
        data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          setProducts(prev => prev.map(p => p._id === editingId ? data.product : p));
          setEditingId(null);
        } else toast.error(data.message);
      } else {
        // Add new product
        res = await fetch("https://agrigrow-backend-hus4.onrender.com/api/products/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productToSend),
        });
        data = await res.json();
        if (res.ok) {
          toast.success(data.message || "Product added successfully!");
          setProducts(prev => [...prev, data.product]);
        } else toast.error(data.message);
      }

      // Reset form
      setNewProduct({
        name: "",
        photo: "",
        price: "",
        description: "",
        rating: "",
        inStock: true,
        brand: "",
        type: "Soil",
        sku: "",
      });
    } catch (err) {
      toast.error("Server error, try again later");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`https://agrigrow-backend-hus4.onrender.com/api/products/delete/${id}`, {
        method: "DELETE",
      });
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
    setNewProduct({
      ...product,
      price: product.price,
      rating: product.rating,
      inStock: product.inStock
    });
    setEditingId(product._id);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "products":
        return (
          <div className="section">
            <h2>📦 Current Products</h2>
            {products.length === 0 ? (
              <p>No products added yet.</p>
            ) : (
              <div className="product-list">
                {products.map((p, i) => (
                  <div key={i} className="product-card">
                    <img src={p.photo || "https://via.placeholder.com/100"} alt={p.name} />
                    <div>
                      <h4>{p.name}</h4>
                      <p>₹{p.price} – {p.type}</p>
                      <p>{p.inStock ? "In Stock" : "Out of Stock"}</p>
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
              <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleChange} />
              <input type="number" name="rating" placeholder="Rating (0-5)" step="0.1" min="0" max="5" value={newProduct.rating} onChange={handleChange} />
              <input type="text" name="brand" placeholder="Brand" value={newProduct.brand} onChange={handleChange} />
              <input type="text" name="sku" placeholder="SKU / Product Code" value={newProduct.sku} onChange={handleChange} />
              <select name="type" value={newProduct.type} onChange={handleChange}>
                <option value="Soil">Soil</option>
                <option value="Nutrients">Nutrients</option>
                <option value="Tools">Tools</option>
                <option value="Irrigation">Irrigation</option>
              </select>
              <label className="checkbox-label">
                <input type="checkbox" name="inStock" checked={newProduct.inStock} onChange={handleChange} />
                In Stock
              </label>
              <button type="submit" className="submit-btn">{editingId ? "Update Product" : "Add Product"}</button>
            </form>
          </div>
        );
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
        <button className={`sidebar-btn ${activeSection==="products" ? "active":""}`} onClick={()=>setActiveSection("products")}><FaBoxOpen /> Current Products</button>
        <button className={`sidebar-btn ${activeSection==="addProduct" ? "active":""}`} onClick={()=>setActiveSection("addProduct")}><FaPlusCircle /> Add Product</button>
        <button className={`sidebar-btn ${activeSection==="customers" ? "active":""}`} onClick={()=>setActiveSection("customers")}><FaUsers /> Customer Info</button>
        <button className={`sidebar-btn ${activeSection==="delivery" ? "active":""}`} onClick={()=>setActiveSection("delivery")}><FaTruck /> Delivery Info</button>
        <button className="sidebar-btn logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">{renderSection()}</div>
    </div>
  );
}

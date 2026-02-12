import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Store, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency, generateOrderId } from "../../utils/formatters";

const API_URL = "http://localhost:5000/api";

export default function Checkout() {
  const { currentUser, userProfile, isAuthenticated } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState("pickup");
  const [form, setForm] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    email: userProfile?.email || "",
    address: "",
    pincode: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);

  const total = getCartTotal();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setLoading(true);
    setError("");

    try {
      // Upload files to backend and prepare file data
      const filesData = [];
      for (const item of cartItems) {
        let fileUrl = "";
        if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);
          const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData,
          });
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            fileUrl = uploadData.fileUrl;
          }
        }
        const itemTotal = (item.price + (item.bindingCost || 0)) * (item.settings?.copies || 1);
        filesData.push({
          name: item.name,
          pages: item.pages,
          settings: item.settings,
          price: itemTotal,
          fileUrl,
        });
      }

      const orderId = generateOrderId();
      const orderData = {
        orderId,
        userId: currentUser?.id || "guest",
        userName: form.name,
        userPhone: form.phone,
        userEmail: form.email,
        type: "Normal Print",
        total,
        files: filesData,
        deliveryType,
        deliveryDetails:
          deliveryType === "pickup"
            ? { date: form.pickupDate, time: form.pickupTime }
            : { address: form.address, pincode: form.pincode },
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const result = await response.json();
      setOrderPlaced({ id: result.id, orderId, total });
      clearCart();
    } catch (err) {
      console.error("Order error:", err);
      setError("Failed to place order. Please try again.");
    }
    setLoading(false);
  }

  if (orderPlaced) {
    return (
      <div className="page">
        <div className="empty-state" style={{ padding: "4rem 2rem" }}>
          <div style={{ color: "var(--success)", marginBottom: "1rem" }}><CheckCircle size={64} /></div>
          <h3 style={{ fontSize: "1.5rem" }}>Order Placed Successfully!</h3>
          <p>Order ID: <strong>{orderPlaced.orderId}</strong></p>
          <p>Total: <strong>{formatCurrency(orderPlaced.total)}</strong></p>
          <p style={{ color: "var(--gray)" }}>You will receive a confirmation soon.</p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            {isAuthenticated && (
              <button className="btn btn-outline" onClick={() => navigate("/orders")}>View Orders</button>
            )}
            <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Complete your order details</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          <div>
            {/* Personal Details */}
            <div className="config-section">
              <h3>Personal Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Delivery Options */}
            <div className="config-section">
              <h3>Delivery Method</h3>
              <div className="option-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <button type="button" className={`option-btn ${deliveryType === "pickup" ? "selected" : ""}`} onClick={() => setDeliveryType("pickup")}
                  style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <Store size={18} /> Store Pickup
                </button>
                <button type="button" className={`option-btn ${deliveryType === "delivery" ? "selected" : ""}`} onClick={() => setDeliveryType("delivery")}
                  style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <MapPin size={18} /> Home Delivery
                </button>
              </div>

              {deliveryType === "pickup" && (
                <div className="form-row" style={{ marginTop: "1rem" }}>
                  <div className="form-group">
                    <label>Pickup Date</label>
                    <input type="date" name="pickupDate" className="form-control" value={form.pickupDate} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Pickup Time</label>
                    <input type="time" name="pickupTime" className="form-control" value={form.pickupTime} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {deliveryType === "delivery" && (
                <div style={{ marginTop: "1rem" }}>
                  <div className="form-group">
                    <label>Delivery Address *</label>
                    <textarea name="address" className="form-control" value={form.address} onChange={handleChange} placeholder="Enter full delivery address" required />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input type="text" name="pincode" className="form-control" value={form.pincode} onChange={handleChange} placeholder="Enter pincode" required />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="price-summary order-summary-card">
            <h3>Order Summary</h3>
            {cartItems.map((item) => {
              const itemTotal = (item.price + (item.bindingCost || 0)) * (item.settings?.copies || 1);
              return (
                <div key={item.id} className="price-row" style={{ fontSize: "0.85rem" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{item.name}</span>
                  <span>{formatCurrency(itemTotal)}</span>
                </div>
              );
            })}
            <div className="price-row total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: "1rem" }} disabled={loading}>
              {loading ? "Placing Order..." : `Place Order — ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

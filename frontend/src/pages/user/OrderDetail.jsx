import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDateTime, getStatusColor, getStatusText, getColorTypeText, getSideTypeText } from "../../utils/formatters";
import { useCart } from "../../contexts/CartContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const API_URL = "http://localhost:5000/api";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
          headers: { ...getAuthHeaders() },
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  function handleReorder() {
    if (!order?.files) return;
    order.files.forEach((file) => {
      addToCart({
        name: file.name,
        pages: file.pages,
        settings: file.settings,
        price: file.price,
        bindingCost: 0,
        singlePageCost: 0,
      });
    });
    navigate("/cart");
  }

  if (loading) return <LoadingSpinner text="Loading order..." />;
  if (!order) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Order not found</h3>
          <button className="btn btn-primary" onClick={() => navigate("/orders")}>Back to Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate("/orders")} style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Order {order.orderId}</h3>
            <span className={`status-badge ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
            <div><strong>Date:</strong> {formatDateTime(order.date)}</div>
            <div><strong>Type:</strong> {order.type}</div>
            <div><strong>Name:</strong> {order.userName}</div>
            <div><strong>Phone:</strong> {order.userPhone}</div>
            <div><strong>Email:</strong> {order.userEmail}</div>
            <div><strong>Delivery:</strong> {order.deliveryType === "pickup" ? "Store Pickup" : "Home Delivery"}</div>
          </div>
          {order.deliveryType === "pickup" && order.deliveryDetails && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--gray)" }}>
              Pickup: {order.deliveryDetails.date} at {order.deliveryDetails.time}
            </div>
          )}
          {order.deliveryType === "delivery" && order.deliveryDetails && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--gray)" }}>
              Address: {order.deliveryDetails.address}, {order.deliveryDetails.pincode}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Order Total</h3>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", marginBottom: "1rem" }}>
            {formatCurrency(order.total)}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-outline btn-sm" onClick={handleReorder}>
              <RefreshCw size={14} /> Reorder
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <h3>Files ({order.files?.length || 0})</h3>
        </div>
        {order.files?.map((file, i) => (
          <div key={i} style={{ padding: "1rem", borderBottom: i < order.files.length - 1 ? "1px solid var(--gray-light)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <FileText size={18} style={{ color: "var(--primary)" }} />
                  <strong>{file.name}</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--gray)", lineHeight: 1.8 }}>
                  <div>Pages: {file.pages} · Range: {file.settings?.pageRange || "all"}</div>
                  <div>{getColorTypeText(file.settings?.colorType)} · {getSideTypeText(file.settings?.sideType)}</div>
                  <div>Copies: {file.settings?.copies || 1} · Pages/Set: {file.settings?.pagesPerSet || 1}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(file.price)}</div>
                {file.fileUrl && (
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" style={{ marginTop: "0.25rem" }}>
                    <Download size={14} /> Download
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

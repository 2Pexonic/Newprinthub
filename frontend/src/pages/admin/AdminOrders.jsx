import { useState, useEffect } from "react";
import { Eye, FileText, Download } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusText, getColorTypeText, getSideTypeText } from "../../utils/formatters";
import LoadingSpinner from "../../components/LoadingSpinner";

const API_URL = "http://localhost:5000/api";

export default function AdminOrders() {
  const { getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function fetchOrders() {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: { ...getAuthHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, []);

  async function updateStatus(orderId, newStatus) {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        o.orderId?.toLowerCase().includes(term) ||
        o.userName?.toLowerCase().includes(term) ||
        o.userPhone?.includes(term)
      );
    }
    return true;
  });

  const statusOptions = ["pending", "processing", "ready", "delivered", "cancelled"];

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Order Management</h1>
        <p>{orders.length} total orders</p>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <input type="text" className="form-control" placeholder="Search by order ID, name, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{getStatusText(s)}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Files</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.orderId}</strong></td>
                <td>
                  <div>{order.userName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{order.userPhone}</div>
                </td>
                <td style={{ fontSize: "0.85rem" }}>{formatDate(order.date)}</td>
                <td>{order.files?.length || 0}</td>
                <td><strong>{formatCurrency(order.total)}</strong></td>
                <td>
                  <select className="form-control" style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                    {statusOptions.map((s) => <option key={s} value={s}>{getStatusText(s)}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedOrder(order)}><Eye size={14} /> View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--gray)" }}>No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Order {selectedOrder.orderId}</h3>
              <span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>{getStatusText(selectedOrder.status)}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              <div><strong>Customer:</strong> {selectedOrder.userName}</div>
              <div><strong>Phone:</strong> {selectedOrder.userPhone}</div>
              <div><strong>Email:</strong> {selectedOrder.userEmail}</div>
              <div><strong>Date:</strong> {formatDateTime(selectedOrder.date)}</div>
              <div><strong>Delivery:</strong> {selectedOrder.deliveryType === "pickup" ? "Store Pickup" : "Home Delivery"}</div>
              <div><strong>Total:</strong> <span style={{ color: "var(--primary)", fontWeight: 700 }}>{formatCurrency(selectedOrder.total)}</span></div>
            </div>

            {selectedOrder.deliveryDetails && (
              <div style={{ padding: "0.75rem", background: "var(--gray-lighter)", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.85rem" }}>
                {selectedOrder.deliveryType === "pickup" ? (
                  <span>Pickup: {selectedOrder.deliveryDetails.date} at {selectedOrder.deliveryDetails.time}</span>
                ) : (
                  <span>Address: {selectedOrder.deliveryDetails.address}, {selectedOrder.deliveryDetails.pincode}</span>
                )}
              </div>
            )}

            <h4 style={{ marginBottom: "0.75rem" }}>Files ({selectedOrder.files?.length || 0})</h4>
            {selectedOrder.files?.map((file, i) => (
              <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--gray-light)", borderRadius: "var(--radius)", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileText size={16} style={{ color: "var(--primary)" }} />
                      <strong style={{ fontSize: "0.9rem" }}>{file.name}</strong>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray)", marginTop: "0.25rem" }}>
                      Pages: {file.pages} · {getColorTypeText(file.settings?.colorType)} · {getSideTypeText(file.settings?.sideType)} · Copies: {file.settings?.copies || 1}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "var(--primary)" }}>{formatCurrency(file.price)}</div>
                    {file.fileUrl && (
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" style={{ marginTop: "0.25rem" }}>
                        <Download size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="modal-actions">
              <select className="form-control" style={{ width: "auto" }} value={selectedOrder.status}
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}>
                {statusOptions.map((s) => <option key={s} value={s}>{getStatusText(s)}</option>)}
              </select>
              <button className="btn btn-ghost" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

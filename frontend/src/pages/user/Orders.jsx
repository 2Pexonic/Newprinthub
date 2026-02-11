import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Package, Download, RefreshCw } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate, getStatusColor, getStatusText } from "../../utils/formatters";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Orders() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid),
          orderBy("date", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Fallback without orderBy if index not created
        try {
          const q2 = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
          const snap2 = await getDocs(q2);
          const data = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
          data.sort((a, b) => {
            const da = a.date?.toDate?.() || new Date(a.date);
            const db2 = b.date?.toDate?.() || new Date(b.date);
            return db2 - da;
          });
          setOrders(data);
        } catch (err2) {
          console.error("Fallback also failed:", err2);
        }
      }
      setLoading(false);
    }
    fetchOrders();
  }, [currentUser]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        o.orderId?.toLowerCase().includes(term) ||
        o.files?.some((f) => f.name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <input
            type="text"
            className="form-control"
            placeholder="Search by order ID or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        <select className="form-control" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="form-control" style={{ width: "auto" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Normal Print">Normal Print</option>
          <option value="Advanced Print">Advanced Print</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={64} /></div>
          <h3>No orders found</h3>
          <p>{orders.length === 0 ? "You haven't placed any orders yet" : "No orders match your filters"}</p>
          <button className="btn btn-primary" onClick={() => navigate("/print")}>Start Printing</button>
        </div>
      ) : (
        filtered.map((order) => (
          <div key={order.id} className="order-card" onClick={() => navigate(`/orders/${order.id}`)}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <strong style={{ fontSize: "0.95rem" }}>{order.orderId}</strong>
                <span className={`status-badge ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--gray)" }}>
                {formatDate(order.date)} · {order.files?.length || 0} file{order.files?.length !== 1 ? "s" : ""} · {order.type}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(order.total)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{order.deliveryType === "pickup" ? "Store Pickup" : "Home Delivery"}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

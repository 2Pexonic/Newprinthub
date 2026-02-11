import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Users, ShoppingBag, DollarSign, Clock, Package } from "lucide-react";
import { db } from "../../firebase";
import { formatCurrency, formatDate, getStatusColor, getStatusText } from "../../utils/formatters";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, pending: 0, processing: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "users")),
        ]);

        const allOrders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const revenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pending = allOrders.filter((o) => o.status === "pending").length;
        const processing = allOrders.filter((o) => o.status === "processing").length;

        setStats({
          users: allUsers.length,
          orders: allOrders.length,
          revenue,
          pending,
          processing,
        });

        // Sort orders by date desc
        allOrders.sort((a, b) => {
          const da = a.date?.toDate?.() || new Date(a.date || 0);
          const db2 = b.date?.toDate?.() || new Date(b.date || 0);
          return db2 - da;
        });
        setRecentOrders(allOrders.slice(0, 5));

        // Sort users by createdAt desc
        allUsers.sort((a, b) => {
          const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const db2 = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return db2 - da;
        });
        setNewUsers(allUsers.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>System overview and statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pink"><Users size={24} /></div>
          <div className="stat-info"><h3>{stats.users}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><ShoppingBag size={24} /></div>
          <div className="stat-info"><h3>{stats.orders}</h3><p>Total Orders</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={24} /></div>
          <div className="stat-info"><h3>{formatCurrency(stats.revenue)}</h3><p>Total Revenue</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={24} /></div>
          <div className="stat-info"><h3>{stats.pending + stats.processing}</h3><p>Active Orders</p></div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/admin/orders")}>View All</button>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>No orders yet</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)", cursor: "pointer" }}
                onClick={() => navigate("/admin/orders")}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{order.orderId}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{order.userName} · {formatDate(order.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`status-badge ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.15rem" }}>{formatCurrency(order.total)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>New Users</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/admin/users")}>View All</button>
          </div>
          {newUsers.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>No users yet</p>
          ) : (
            newUsers.map((user) => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{user.email}</div>
                </div>
                <span className="status-badge status-processing">{user.profileType}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

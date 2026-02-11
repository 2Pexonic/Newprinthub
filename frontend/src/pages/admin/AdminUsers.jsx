import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Search } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (profileFilter !== "all" && u.profileType !== profileFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(t) ||
        (u.email || "").toLowerCase().includes(t) ||
        (u.phone || "").includes(t)
      );
    }
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>{users.length} registered users</p>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <input className="form-control" placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: "auto" }} value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
          <option value="all">All Profiles</option>
          <option value="Regular">Regular</option>
          <option value="Student">Student</option>
          <option value="Institute">Institute</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Profile</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td>{u.profileType}</td>
                <td>{u.orders || 0}</td>
                <td>₹{(u.totalSpent || 0).toFixed(2)}</td>
                <td>{u.createdAt?.toDate?.().toLocaleDateString?.() || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--gray)" }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

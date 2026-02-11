import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Tag, Calendar, ShoppingBag, CreditCard, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function Profile() {
  const { userProfile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    profileType: userProfile?.profileType || "Regular",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateProfile(form);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const initials = userProfile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-avatar">{initials}</div>
          <h3 style={{ marginBottom: "0.25rem" }}>{userProfile?.name}</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--gray)", marginBottom: "0.5rem" }}>{userProfile?.email}</p>
          <span className="status-badge status-processing">{userProfile?.profileType}</span>

          <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--gray)" }}>Orders</span>
              <strong>{userProfile?.orders || 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--gray)" }}>Total Spent</span>
              <strong>{formatCurrency(userProfile?.totalSpent || 0)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--gray)" }}>Member Since</span>
              <strong>{formatDate(userProfile?.createdAt)}</strong>
            </div>
          </div>

          <button className="btn btn-danger btn-block" style={{ marginTop: "1.5rem" }} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3>Personal Information</h3>
              {!editing && (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>

            {editing ? (
              <div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Profile Type</label>
                  <div className="profile-type-selector">
                    {["Regular", "Student", "Institute"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`profile-type-btn ${form.profileType === type ? "selected" : ""}`}
                        onClick={() => setForm({ ...form, profileType: type })}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setEditing(false); setForm({ name: userProfile?.name || "", phone: userProfile?.phone || "", profileType: userProfile?.profileType || "Regular" }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <User size={18} style={{ color: "var(--gray)" }} />
                  <div><div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>Name</div><div>{userProfile?.name}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Mail size={18} style={{ color: "var(--gray)" }} />
                  <div><div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>Email</div><div>{userProfile?.email}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Phone size={18} style={{ color: "var(--gray)" }} />
                  <div><div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>Phone</div><div>{userProfile?.phone || "Not set"}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Tag size={18} style={{ color: "var(--gray)" }} />
                  <div><div style={{ fontSize: "0.75rem", color: "var(--gray)" }}>Profile Type</div><div>{userProfile?.profileType}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

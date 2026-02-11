import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Save, User, Mail, Shield } from "lucide-react";

export default function AdminSettings() {
  const { userProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSave() {
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>System configuration and admin profile</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3><User size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />Admin Profile</h3>
          </div>
          <div className="form-group">
            <label>Name</label>
            <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={userProfile?.email || ""} disabled />
            <p className="form-help">Email cannot be changed</p>
          </div>
          <div className="form-group">
            <label>Role</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 600 }}>Administrator</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>System Information</h3>
          </div>
          <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)" }}>
              <span style={{ color: "var(--gray)" }}>App Version</span>
              <strong>1.0.0</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)" }}>
              <span style={{ color: "var(--gray)" }}>Firebase Project</span>
              <strong>printhub-4a69a</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-light)" }}>
              <span style={{ color: "var(--gray)" }}>Database</span>
              <strong>Cloud Firestore</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
              <span style={{ color: "var(--gray)" }}>Storage</span>
              <strong>Firebase Storage</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

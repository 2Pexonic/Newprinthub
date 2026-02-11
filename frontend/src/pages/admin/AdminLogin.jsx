import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Failed to login");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page" style={{ background: "var(--secondary)" }}>
      <div className="auth-card">
        <img src={logo} alt="PrintHub" className="logo-img" />
        <h2>Admin Login</h2>
        <p className="subtitle">Access the admin dashboard</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required />
          </div>
          <button type="submit" className="btn btn-secondary btn-block btn-lg" disabled={loading}>
            {loading ? "Signing in..." : "Admin Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileType: "Regular",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await register(form.email, form.password, {
        name: form.name,
        phone: form.phone,
        profileType: form.profileType,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={logo} alt="PrintHub" className="logo-img" />
        <h2>Create Account</h2>
        <p className="subtitle">Join PrintHub for a better printing experience</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="Enter phone number" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} placeholder="Create a password" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-control" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
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
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

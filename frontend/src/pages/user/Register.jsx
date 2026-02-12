import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    profileType: "Regular",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { register, sendOTP } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSendOTP(e) {
    e.preventDefault();
    setError("");

    if (!form.phone || form.phone.length < 10) {
      return setError("Please enter a valid phone number");
    }

    // Format phone number with country code if not present
    const phoneNumber = form.phone.startsWith('+') ? form.phone : `+91${form.phone}`;

    setLoading(true);
    try {
      await sendOTP(phoneNumber);
      setOtpSent(true);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    }
    setLoading(false);
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    setError("");

    if (!otp || otp.length < 6) {
      return setError("Please enter a valid OTP");
    }

    setLoading(true);
    try {
      const phoneNumber = form.phone.startsWith('+') ? form.phone : `+91${form.phone}`;
      await register(phoneNumber, otp, {
        name: form.name,
        phone: phoneNumber,
        profileType: form.profileType,
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
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

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="Enter your name" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="Enter 10-digit phone number" required />
              <p className="form-help">Enter without country code (e.g., 9876543210)</p>
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
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input type="text" className="form-control" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength="6" required />
              <p className="form-help">OTP sent to +91{form.phone}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}>Change Number</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Verifying..." : "Verify & Register"}
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

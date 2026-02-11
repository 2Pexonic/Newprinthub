import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login, sendOTP, setupRecaptcha } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setupRecaptcha('login-recaptcha');
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.error('Error cleaning up reCAPTCHA:', error);
        }
      }
    };
  }, []);

  async function handleSendOTP(e) {
    e.preventDefault();
    setError("");

    if (!phone || phone.length < 10) {
      return setError("Please enter a valid phone number");
    }

    const phoneNumber = phone.startsWith('+') ? phone : `+91${phone}`;

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
      const phoneNumber = phone.startsWith('+') ? phone : `+91${phone}`;
      await login(phoneNumber, otp);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to login");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={logo} alt="PrintHub" className="logo-img" />
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit phone number"
                required
              />
              <p className="form-help">Enter without country code (e.g., 9876543210)</p>
            </div>
            <div id="login-recaptcha"></div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
              <p className="form-help">OTP sent to +91{phone}</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}>Change Number</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Verifying..." : "Sign In"}
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

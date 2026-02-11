import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, LogOut, Shield, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { isAuthenticated, isAdmin, userProfile, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (isAdminRoute) {
    return (
      <nav className="navbar navbar-admin">
        <div className="navbar-container">
          <Link to="/admin/dashboard" className="navbar-logo">
            <img src={logo} alt="PrintHub" className="logo-img" />
          </Link>
          <div className="navbar-links">
            <Link to="/admin/dashboard" className={location.pathname === "/admin/dashboard" ? "active" : ""}>Dashboard</Link>
            <Link to="/admin/orders" className={location.pathname === "/admin/orders" ? "active" : ""}>Orders</Link>
            <Link to="/admin/users" className={location.pathname === "/admin/users" ? "active" : ""}>Users</Link>
            <Link to="/admin/pricing" className={location.pathname === "/admin/pricing" ? "active" : ""}>Pricing</Link>
            <Link to="/admin/binding" className={location.pathname === "/admin/binding" ? "active" : ""}>Binding</Link>
            <Link to="/admin/settings" className={location.pathname === "/admin/settings" ? "active" : ""}>Settings</Link>
            <button onClick={handleLogout} className="nav-btn logout-btn" title="Logout">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="PrintHub" className="logo-img" />
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" className={location.pathname === "/" ? "active" : ""} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/print" className={location.pathname === "/print" ? "active" : ""} onClick={() => setMenuOpen(false)}>Print</Link>

          {isAuthenticated && (
            <>
              <Link to="/orders" className={location.pathname === "/orders" ? "active" : ""} onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
                <ShoppingCart size={18} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/profile" className="nav-icon-link" onClick={() => setMenuOpen(false)} title={userProfile?.name}>
                <User size={18} />
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="nav-btn logout-btn">
                <LogOut size={18} />
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
                <ShoppingCart size={18} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/login" className="nav-btn login-btn" onClick={() => setMenuOpen(false)}>Login</Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin/dashboard" className="nav-btn admin-btn" onClick={() => setMenuOpen(false)}>
              <Shield size={14} /> Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useNavigate } from "react-router-dom";
import { Printer, FileText, BookOpen, Zap } from "lucide-react";
import logo from "../../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="hero">
        <img src={logo} alt="PrintHub" className="logo-img" />
        <h1>A Better Way to Print</h1>
        <p>Upload your documents, customize print settings, and get high-quality prints delivered to your doorstep or pick them up at our store.</p>
      </div>

      <div className="service-cards">
        <div className="service-card" onClick={() => navigate("/print")}>
          <div className="service-card-icon">
            <Printer size={32} />
          </div>
          <h3>Normal Print</h3>
          <p>Upload documents and configure print settings including color, sides, binding, and more. Quick and easy!</p>
        </div>

        <div className="service-card" onClick={() => navigate("/print")}>
          <div className="service-card-icon">
            <FileText size={32} />
          </div>
          <h3>Advanced Print</h3>
          <p>Multiple file upload with per-file configuration. Custom page ranges, pages per set, and advanced binding options.</p>
        </div>

        <div className="service-card" onClick={() => navigate("/print")}>
          <div className="service-card-icon">
            <BookOpen size={32} />
          </div>
          <h3>Binding Services</h3>
          <p>Professional binding options including spiral and staple binding for your documents and presentations.</p>
        </div>

        <div className="service-card" onClick={() => navigate("/print")}>
          <div className="service-card-icon">
            <Zap size={32} />
          </div>
          <h3>Express Print</h3>
          <p>Need it fast? Our express service ensures your documents are printed and ready within hours.</p>
        </div>
      </div>

      <div style={{ marginTop: "3rem", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem", color: "var(--dark)" }}>How It Works</h2>
        <div className="grid-3" style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>1</div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Upload</h3>
            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>Upload your PDF, DOCX, PPTX, or image files</p>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>2</div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Configure</h3>
            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>Set print options, binding, copies, and more</p>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>3</div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Order</h3>
            <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>Checkout and pick up or get home delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Image, X, ShoppingCart, CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { validateFile, detectPageCount, formatFileSize } from "../../utils/fileUtils";
import { calculatePrice, defaultPricingRules } from "../../utils/priceCalculator";
import { formatCurrency } from "../../utils/formatters";

const API_URL = "http://localhost:5000/api";

export default function Print() {
  const { isAuthenticated, profileType } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [pricingRules, setPricingRules] = useState(defaultPricingRules);
  const [bindingTypes, setBindingTypes] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");

  // Default config per file
  const defaultConfig = {
    pageRange: "all",
    colorType: "bw",
    sideType: "single",
    bindingTypeId: "none",
    copies: 1,
    pagesPerSet: "1",
  };

  // Fetch pricing rules and binding types
  useEffect(() => {
    async function fetchConfig() {
      try {
        const [priceRes, bindRes] = await Promise.all([
          fetch(`${API_URL}/config/pricing`),
          fetch(`${API_URL}/config/bindings`),
        ]);
        if (priceRes.ok) {
          const rules = await priceRes.json();
          if (rules.length > 0) setPricingRules(rules);
        }
        if (bindRes.ok) {
          const bindings = await bindRes.json();
          setBindingTypes(bindings.filter((b) => b.isActive));
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    }
    fetchConfig();
  }, []);

  // Handle file selection
  async function handleFiles(fileList) {
    setUploading(true);
    const newFiles = [];
    for (const file of fileList) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }
      const pages = await detectPageCount(file);
      newFiles.push({
        file,
        name: file.name,
        size: file.size,
        pages,
        config: { ...defaultConfig },
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0 && files.length === 0) {
      setActiveFileIndex(0);
    }
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function handleFileInput(e) {
    handleFiles(Array.from(e.target.files));
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= files.length - 1) {
      setActiveFileIndex(Math.max(0, files.length - 2));
    }
  }

  function updateConfig(index, key, value) {
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, config: { ...f.config, [key]: value } } : f
      )
    );
  }

  // Calculate price for a file
  const getFilePrice = useCallback(
    (fileItem) => {
      if (!fileItem) return { total: 0, printCost: 0, bindingCost: 0, activePages: 0, sidesNeeded: 0, pricePerPage: 0 };
      const binding = bindingTypes.find((b) => b.id === fileItem.config.bindingTypeId);
      return calculatePrice({
        totalPages: fileItem.pages,
        pageRange: fileItem.config.pageRange,
        colorType: fileItem.config.colorType,
        sideType: fileItem.config.sideType,
        pagesPerSet: fileItem.config.pagesPerSet,
        copies: fileItem.config.copies,
        bindingType: binding || null,
        profileType,
        pricingRules,
      });
    },
    [bindingTypes, profileType, pricingRules]
  );

  // Total price
  const totalPrice = files.reduce((sum, f) => sum + getFilePrice(f).total, 0);
  const activeFile = files[activeFileIndex];
  const activePrice = activeFile ? getFilePrice(activeFile) : null;

  function handleAddToCart() {
    files.forEach((fileItem) => {
      const price = getFilePrice(fileItem);
      addToCart({
        file: fileItem.file,
        name: fileItem.name,
        pages: fileItem.pages,
        settings: { ...fileItem.config },
        price: price.printCost,
        bindingCost: price.bindingCost,
        singlePageCost: price.pricePerPage,
      });
    });
    setSuccess("Added to cart!");
    setTimeout(() => {
      setFiles([]);
      setSuccess("");
      navigate("/cart");
    }, 1000);
  }

  function handleCheckout() {
    // For guest users, go directly to checkout
    files.forEach((fileItem) => {
      const price = getFilePrice(fileItem);
      addToCart({
        file: fileItem.file,
        name: fileItem.name,
        pages: fileItem.pages,
        settings: { ...fileItem.config },
        price: price.printCost,
        bindingCost: price.bindingCost,
        singlePageCost: price.pricePerPage,
      });
    });
    navigate("/checkout");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Print Documents</h1>
        <p>Upload files, configure settings, and order prints</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="print-layout">
        <div>
          {/* File Upload Zone */}
          <div className="config-section">
            <h3><Upload size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />Upload Files</h3>
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <div className="upload-zone-icon"><Upload size={36} /></div>
              <h3>Drop files here or click to browse</h3>
              <p>PDF, DOCX, PPTX, JPG, PNG — Max 100MB per file</p>
              <input id="file-input" type="file" multiple accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png" onChange={handleFileInput} style={{ display: "none" }} />
            </div>

            {uploading && <div className="loading-spinner"><div className="spinner"></div><p>Processing files...</p></div>}

            {/* File List */}
            {files.length > 0 && (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className={`file-item ${i === activeFileIndex ? "selected" : ""}`} onClick={() => setActiveFileIndex(i)}
                    style={{ cursor: "pointer", borderLeft: i === activeFileIndex ? "3px solid var(--primary)" : "3px solid transparent" }}>
                    <div className="file-item-info">
                      <div className="file-item-icon">
                        {f.name.match(/\.(jpg|jpeg|png)$/i) ? <Image size={20} /> : <FileText size={20} />}
                      </div>
                      <div>
                        <div className="file-item-name">{f.name}</div>
                        <div className="file-item-meta">{f.pages} pages · {formatFileSize(f.size)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.9rem" }}>{formatCurrency(getFilePrice(f).total)}</span>
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Print Configuration */}
          {activeFile && (
            <div className="config-section">
              <h3>Print Settings — {activeFile.name}</h3>

              <div className="form-group">
                <label>Page Range</label>
                <input
                  type="text"
                  className="form-control"
                  value={activeFile.config.pageRange}
                  onChange={(e) => updateConfig(activeFileIndex, "pageRange", e.target.value)}
                  placeholder="all, 1-5, 2,4,6, or 1-3,7,10-12"
                />
                <p className="form-help">Total pages: {activeFile.pages}. Use "all" for all pages, or specify ranges like "2-10" or "5,8,12"</p>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="option-grid">
                  <button
                    className={`option-btn ${activeFile.config.colorType === "bw" ? "selected" : ""}`}
                    onClick={() => updateConfig(activeFileIndex, "colorType", "bw")}
                  >
                    Black & White
                  </button>
                  <button
                    className={`option-btn ${activeFile.config.colorType === "color" ? "selected" : ""}`}
                    onClick={() => updateConfig(activeFileIndex, "colorType", "color")}
                  >
                    Full Color
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Print Sides</label>
                <div className="option-grid">
                  <button
                    className={`option-btn ${activeFile.config.sideType === "single" ? "selected" : ""}`}
                    onClick={() => updateConfig(activeFileIndex, "sideType", "single")}
                  >
                    Single Side
                  </button>
                  <button
                    className={`option-btn ${activeFile.config.sideType === "double" ? "selected" : ""}`}
                    onClick={() => updateConfig(activeFileIndex, "sideType", "double")}
                  >
                    Double Side
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Binding</label>
                <div className="option-grid">
                  <button
                    className={`option-btn ${activeFile.config.bindingTypeId === "none" ? "selected" : ""}`}
                    onClick={() => updateConfig(activeFileIndex, "bindingTypeId", "none")}
                  >
                    None
                  </button>
                  {bindingTypes.map((bt) => (
                    <button
                      key={bt.id}
                      className={`option-btn ${activeFile.config.bindingTypeId === bt.id ? "selected" : ""}`}
                      onClick={() => updateConfig(activeFileIndex, "bindingTypeId", bt.id)}
                    >
                      {bt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Number of Copies</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="999"
                    value={activeFile.config.copies}
                    onChange={(e) => updateConfig(activeFileIndex, "copies", Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="form-group">
                  <label>Pages Per Set</label>
                  <div className="option-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    {["1", "2", "4", "6", "9", "16"].map((pps) => (
                      <button
                        key={pps}
                        className={`option-btn ${activeFile.config.pagesPerSet === pps ? "selected" : ""}`}
                        onClick={() => updateConfig(activeFileIndex, "pagesPerSet", pps)}
                      >
                        {pps}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price Summary Sidebar */}
        <div>
          <div className="price-summary">
            <h3>Price Summary</h3>
            {files.length === 0 ? (
              <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>Upload files to see pricing</p>
            ) : (
              <>
                {activeFile && activePrice && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--dark)" }}>
                      {activeFile.name}
                    </div>
                    <div className="price-row">
                      <span>Active Pages</span>
                      <span>{activePrice.activePages}</span>
                    </div>
                    <div className="price-row">
                      <span>Sides Needed</span>
                      <span>{activePrice.sidesNeeded}</span>
                    </div>
                    <div className="price-row">
                      <span>Price/Page</span>
                      <span>{formatCurrency(activePrice.pricePerPage)}</span>
                    </div>
                    <div className="price-row">
                      <span>Print Cost</span>
                      <span>{formatCurrency(activePrice.printCost)}</span>
                    </div>
                    {activePrice.bindingCost > 0 && (
                      <div className="price-row">
                        <span>Binding</span>
                        <span>{formatCurrency(activePrice.bindingCost)}</span>
                      </div>
                    )}
                    <div className="price-row">
                      <span>Copies</span>
                      <span>×{activeFile.config.copies}</span>
                    </div>
                    <div className="price-row" style={{ fontWeight: 600 }}>
                      <span>File Total</span>
                      <span>{formatCurrency(activePrice.total)}</span>
                    </div>
                  </div>
                )}

                {files.length > 1 && (
                  <div style={{ borderTop: "1px solid var(--gray-light)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                    {files.map((f, i) => (
                      <div key={i} className="price-row" style={{ fontSize: "0.8rem" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{f.name}</span>
                        <span>{formatCurrency(getFilePrice(f).total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="price-row total">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>

                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {isAuthenticated && (
                    <button className="btn btn-outline btn-block" onClick={handleAddToCart}>
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  )}
                  <button className="btn btn-primary btn-block" onClick={handleCheckout}>
                    <CreditCard size={16} /> Proceed to Checkout
                  </button>
                </div>
              </>
            )}

            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--gray-lighter)", borderRadius: "var(--radius)", fontSize: "0.8rem", color: "var(--gray)" }}>
              <strong>Profile:</strong> {profileType} pricing applied
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

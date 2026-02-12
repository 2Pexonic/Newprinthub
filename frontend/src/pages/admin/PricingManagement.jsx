import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const API_URL = "http://localhost:5000/api";

const emptyRule = {
  colorType: "bw",
  sideType: "single",
  fromPage: 1,
  toPage: 100,
  studentPrice: 0,
  institutePrice: 0,
  regularPrice: 0,
};

export default function PricingManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyRule });

  async function fetchRules() {
    try {
      const snap = await getDocs(collection(db, "pricingRules"));
      setRules(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
    setLoading(false);
  }

  useEffect(() => { fetchRules(); }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["fromPage", "toPage", "studentPrice", "institutePrice", "regularPrice"].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  }

  async function handleSave() {
    try {
      if (editingRule) {
        await updateDoc(doc(db, "pricingRules", editingRule.id), form);
      } else {
        await addDoc(collection(db, "pricingRules"), form);
      }
      setShowForm(false);
      setEditingRule(null);
      setForm({ ...emptyRule });
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this pricing rule?")) return;
    try {
      await deleteDoc(doc(db, "pricingRules", id));
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  }

  function startEdit(rule) {
    setEditingRule(rule);
    setForm({
      colorType: rule.colorType,
      sideType: rule.sideType,
      fromPage: rule.fromPage,
      toPage: rule.toPage,
      studentPrice: rule.studentPrice,
      institutePrice: rule.institutePrice,
      regularPrice: rule.regularPrice,
    });
    setShowForm(true);
  }

  function startAdd() {
    setEditingRule(null);
    setForm({ ...emptyRule });
    setShowForm(true);
  }

  if (loading) return <LoadingSpinner text="Loading pricing rules..." />;

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Pricing Management</h1>
          <p>{rules.length} pricing rules</p>
        </div>
        <button className="btn btn-primary" onClick={startAdd}><Plus size={16} /> Add Rule</button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRule ? "Edit Pricing Rule" : "Add Pricing Rule"}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Color Type</label>
                <select name="colorType" className="form-control" value={form.colorType} onChange={handleChange}>
                  <option value="bw">Black & White</option>
                  <option value="color">Full Color</option>
                </select>
              </div>
              <div className="form-group">
                <label>Print Sides</label>
                <select name="sideType" className="form-control" value={form.sideType} onChange={handleChange}>
                  <option value="single">Single Side</option>
                  <option value="double">Double Side</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>From Page</label>
                <input type="number" name="fromPage" className="form-control" value={form.fromPage} onChange={handleChange} min="1" />
              </div>
              <div className="form-group">
                <label>To Page</label>
                <input type="number" name="toPage" className="form-control" value={form.toPage} onChange={handleChange} min="1" />
              </div>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div className="form-group">
                <label>Student Price (₹)</label>
                <input type="number" name="studentPrice" className="form-control" value={form.studentPrice} onChange={handleChange} step="0.01" min="0" />
              </div>
              <div className="form-group">
                <label>Institute Price (₹)</label>
                <input type="number" name="institutePrice" className="form-control" value={form.institutePrice} onChange={handleChange} step="0.01" min="0" />
              </div>
              <div className="form-group">
                <label>Regular Price (₹)</label>
                <input type="number" name="regularPrice" className="form-control" value={form.regularPrice} onChange={handleChange} step="0.01" min="0" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> {editingRule ? "Update" : "Add"} Rule</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>Sides</th>
              <th>Pages</th>
              <th>Student (₹)</th>
              <th>Institute (₹)</th>
              <th>Regular (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.colorType === "bw" ? "B&W" : "Color"}</td>
                <td>{rule.sideType === "single" ? "Single" : "Double"}</td>
                <td>{rule.fromPage} - {rule.toPage}</td>
                <td>₹{(rule.studentPrice || 0).toFixed(2)}</td>
                <td>₹{(rule.institutePrice || 0).toFixed(2)}</td>
                <td>₹{(rule.regularPrice || 0).toFixed(2)}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => startEdit(rule)}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleDelete(rule.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--gray)" }}>No pricing rules. Add your first rule.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

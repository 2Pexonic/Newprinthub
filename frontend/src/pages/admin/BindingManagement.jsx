import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight } from "lucide-react";
import { db } from "../../firebase";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function BindingManagement() {
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBinding, setEditingBinding] = useState(null);
  const [form, setForm] = useState({ name: "", isActive: true, prices: [{ fromPage: 1, toPage: 100, studentPrice: 0, institutePrice: 0, regularPrice: 0 }] });

  async function fetchBindings() {
    try {
      const snap = await getDocs(collection(db, "bindingTypes"));
      setBindings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching bindings:", error);
    }
    setLoading(false);
  }

  useEffect(() => { fetchBindings(); }, []);

  function addPriceRange() {
    setForm((prev) => ({
      ...prev,
      prices: [...prev.prices, { fromPage: 1, toPage: 100, studentPrice: 0, institutePrice: 0, regularPrice: 0 }],
    }));
  }

  function removePriceRange(index) {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index),
    }));
  }

  function updatePriceRange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.map((p, i) =>
        i === index ? { ...p, [field]: parseFloat(value) || 0 } : p
      ),
    }));
  }

  async function handleSave() {
    try {
      const data = { name: form.name, isActive: form.isActive, prices: form.prices };
      if (editingBinding) {
        await updateDoc(doc(db, "bindingTypes", editingBinding.id), data);
      } else {
        await addDoc(collection(db, "bindingTypes"), data);
      }
      setShowForm(false);
      setEditingBinding(null);
      setForm({ name: "", isActive: true, prices: [{ fromPage: 1, toPage: 100, studentPrice: 0, institutePrice: 0, regularPrice: 0 }] });
      fetchBindings();
    } catch (error) {
      console.error("Error saving binding:", error);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this binding type?")) return;
    try {
      await deleteDoc(doc(db, "bindingTypes", id));
      fetchBindings();
    } catch (error) {
      console.error("Error deleting binding:", error);
    }
  }

  async function toggleActive(binding) {
    try {
      await updateDoc(doc(db, "bindingTypes", binding.id), { isActive: !binding.isActive });
      fetchBindings();
    } catch (error) {
      console.error("Error toggling binding:", error);
    }
  }

  function startEdit(binding) {
    setEditingBinding(binding);
    setForm({
      name: binding.name,
      isActive: binding.isActive,
      prices: binding.prices || [{ fromPage: 1, toPage: 100, studentPrice: 0, institutePrice: 0, regularPrice: 0 }],
    });
    setShowForm(true);
  }

  function startAdd() {
    setEditingBinding(null);
    setForm({ name: "", isActive: true, prices: [{ fromPage: 1, toPage: 100, studentPrice: 0, institutePrice: 0, regularPrice: 0 }] });
    setShowForm(true);
  }

  if (loading) return <LoadingSpinner text="Loading binding types..." />;

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Binding Management</h1>
          <p>{bindings.length} binding types</p>
        </div>
        <button className="btn btn-primary" onClick={startAdd}><Plus size={16} /> Add Binding</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3>{editingBinding ? "Edit Binding Type" : "Add Binding Type"}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Binding Name</label>
                <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Spiral, Staple" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <button type="button" className={`btn ${form.isActive ? "btn-success" : "btn-ghost"} btn-block`}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                  {form.isActive ? <><ToggleRight size={16} /> Active</> : <><ToggleLeft size={16} /> Inactive</>}
                </button>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label style={{ fontWeight: 600 }}>Price Ranges</label>
                <button className="btn btn-sm btn-outline" onClick={addPriceRange}><Plus size={12} /> Add Range</button>
              </div>

              {form.prices.map((price, i) => (
                <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--gray-light)", borderRadius: "var(--radius)", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong style={{ fontSize: "0.85rem" }}>Range {i + 1}</strong>
                    {form.prices.length > 1 && (
                      <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => removePriceRange(i)}><X size={12} /></button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.7rem" }}>From</label>
                      <input type="number" className="form-control" style={{ padding: "0.35rem" }} value={price.fromPage} onChange={(e) => updatePriceRange(i, "fromPage", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem" }}>To</label>
                      <input type="number" className="form-control" style={{ padding: "0.35rem" }} value={price.toPage} onChange={(e) => updatePriceRange(i, "toPage", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem" }}>Student ₹</label>
                      <input type="number" className="form-control" style={{ padding: "0.35rem" }} value={price.studentPrice} onChange={(e) => updatePriceRange(i, "studentPrice", e.target.value)} step="0.01" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem" }}>Institute ₹</label>
                      <input type="number" className="form-control" style={{ padding: "0.35rem" }} value={price.institutePrice} onChange={(e) => updatePriceRange(i, "institutePrice", e.target.value)} step="0.01" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.7rem" }}>Regular ₹</label>
                      <input type="number" className="form-control" style={{ padding: "0.35rem" }} value={price.regularPrice} onChange={(e) => updatePriceRange(i, "regularPrice", e.target.value)} step="0.01" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> {editingBinding ? "Update" : "Add"} Binding</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
        {bindings.map((binding) => (
          <div key={binding.id} className="card">
            <div className="card-header">
              <h3>{binding.name}</h3>
              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <span className={`status-badge ${binding.isActive ? "status-ready" : "status-cancelled"}`}>
                  {binding.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              {binding.prices?.map((p, i) => (
                <div key={i} style={{ padding: "0.5rem 0", borderBottom: i < binding.prices.length - 1 ? "1px solid var(--gray-light)" : "none" }}>
                  <div style={{ color: "var(--gray)", fontSize: "0.75rem" }}>Pages {p.fromPage}-{p.toPage}</div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.15rem" }}>
                    <span>Student: ₹{(p.studentPrice || 0).toFixed(2)}</span>
                    <span>Institute: ₹{(p.institutePrice || 0).toFixed(2)}</span>
                    <span>Regular: ₹{(p.regularPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn btn-sm btn-ghost" onClick={() => startEdit(binding)}><Edit2 size={14} /> Edit</button>
              <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(binding)}>
                {binding.isActive ? <><ToggleLeft size={14} /> Disable</> : <><ToggleRight size={14} /> Enable</>}
              </button>
              <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleDelete(binding.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {bindings.length === 0 && (
          <div className="empty-state">
            <h3>No binding types</h3>
            <p>Add binding options for your customers</p>
          </div>
        )}
      </div>
    </div>
  );
}

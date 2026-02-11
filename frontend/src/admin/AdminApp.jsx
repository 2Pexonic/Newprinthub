import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "./AdminApp.css";

function AdminApp() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "" });

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    try {
      await addDoc(collection(db, "products"), {
        name: newProduct.name,
        description: newProduct.description,
        createdAt: new Date().toISOString(),
      });
      setNewProduct({ name: "", description: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      <form className="admin-form" onSubmit={handleAdd}>
        <h2>Add New Product</h2>
        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
        />
        <textarea
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
        />
        <button type="submit">Add Product</button>
      </form>

      <div className="admin-list">
        <h2>Products ({products.length})</h2>
        {products.map((product) => (
          <div key={product.id} className="admin-card">
            <div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </div>
            <button
              className="delete-btn"
              onClick={() => handleDelete(product.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminApp;

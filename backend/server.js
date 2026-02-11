import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { readFileSync } from "fs";

dotenv.config();

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || "./serviceAccountKey.json";

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.warn("Warning: Firebase Admin not initialized.");
  console.warn(error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firestore reference
const db = admin.apps.length ? admin.firestore() : null;

// Auth middleware - verify Firebase ID token
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Admin middleware
async function adminMiddleware(req, res, next) {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ========== Health Check ==========
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========== Orders ==========
app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === "admin";
    let query = db.collection("orders");
    if (!isAdmin) {
      query = query.where("userId", "==", req.user.uid);
    }
    const snapshot = await query.orderBy("date", "desc").get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/:id", authMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const doc = await db.collection("orders").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const orderData = { ...req.body, date: admin.firestore.FieldValue.serverTimestamp(), status: "pending" };
    const docRef = await db.collection("orders").add(orderData);
    res.status(201).json({ id: docRef.id, ...orderData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    await db.collection("orders").doc(req.params.id).update(req.body);
    res.json({ message: "Order updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Users ==========
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const doc = await db.collection("users").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    if (req.user.uid !== req.params.id) {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      if (!userDoc.exists || userDoc.data().role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }
    }
    await db.collection("users").doc(req.params.id).update(req.body);
    res.json({ message: "User updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Configuration ==========
app.get("/api/config/pricing", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const snapshot = await db.collection("pricingRules").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/config/bindings", async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Firebase not initialized" });
    const snapshot = await db.collection("bindingTypes").get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

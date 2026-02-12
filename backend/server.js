import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "printhub-secret-key-change-in-production";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Ensure data and uploads directories exist
const dataDir = join(__dirname, "data");
const uploadsDir = join(__dirname, "uploads");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ========== JSON File Database ==========
function loadData(filename) {
  const filepath = join(dataDir, filename);
  if (existsSync(filepath)) {
    return JSON.parse(readFileSync(filepath, "utf-8"));
  }
  return [];
}

function saveData(filename, data) {
  const filepath = join(dataDir, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== Auth Middleware ==========
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  const users = loadData("users.json");
  const user = users.find((u) => u.id === req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ========== Health Check ==========
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ========== OTP System ==========
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(phoneNumber, { otp, expiresAt });

    console.log(`\n📱 OTP for ${phoneNumber}: ${otp}`);
    console.log(`Expires at: ${new Date(expiresAt).toLocaleTimeString()}\n`);

    res.json({
      message: "OTP sent successfully",
      development: { otp },
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp, name, profileType } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    const storedData = otpStore.get(phoneNumber);
    if (!storedData) {
      return res.status(400).json({ error: "OTP not found. Please request a new one." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(phoneNumber);

    const users = loadData("users.json");
    let user = users.find((u) => u.phone === phoneNumber);

    if (!user && name) {
      // New user - create account
      user = {
        id: generateId(),
        name,
        phone: phoneNumber,
        email: `${phoneNumber.replace(/\+/g, "")}@printhub.app`,
        profileType: profileType || "Regular",
        role: "user",
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        orders: 0,
        totalSpent: 0,
      };
      users.push(user);
      saveData("users.json", users);

      const token = jwt.sign({ id: user.id, phone: phoneNumber, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        message: "Registration successful",
        user,
        token,
      });
    } else if (user) {
      // Existing user - login
      user.lastActive = new Date().toISOString();
      saveData("users.json", users);

      const token = jwt.sign({ id: user.id, phone: phoneNumber, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        message: "Login successful",
        user,
        token,
      });
    } else {
      res.status(400).json({ error: "User not found. Please register first." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login with email/password
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = loadData("users.json");
    const admin = users.find((u) => u.email === email && u.role === "admin");

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials or not an admin" });
    }

    // Simple password check (in production use bcrypt)
    if (admin.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    admin.lastActive = new Date().toISOString();
    saveData("users.json", users);

    const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      user: { ...admin, password: undefined },
      token,
    });
  } catch (error) {
    console.error("Error admin login:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const users = loadData("users.json");
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ ...user, password: undefined });
});

// Clean up expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
    }
  }
}, 10 * 60 * 1000);

// ========== File Upload ==========
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ fileUrl, filename: req.file.filename });
});

// ========== Orders ==========
app.get("/api/orders", authMiddleware, (req, res) => {
  try {
    const orders = loadData("orders.json");
    const users = loadData("users.json");
    const user = users.find((u) => u.id === req.user.id);
    const isAdmin = user?.role === "admin";

    let filteredOrders = isAdmin ? orders : orders.filter((o) => o.userId === req.user.id);
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(filteredOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/:id", authMiddleware, (req, res) => {
  try {
    const orders = loadData("orders.json");
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", (req, res) => {
  try {
    const orders = loadData("orders.json");
    const orderData = {
      id: generateId(),
      ...req.body,
      date: new Date().toISOString(),
      status: "pending",
    };
    orders.push(orderData);
    saveData("orders.json", orders);

    // Update user stats if userId provided
    if (req.body.userId && req.body.userId !== "guest") {
      const users = loadData("users.json");
      const userIndex = users.findIndex((u) => u.id === req.body.userId);
      if (userIndex !== -1) {
        users[userIndex].orders = (users[userIndex].orders || 0) + 1;
        users[userIndex].totalSpent = (users[userIndex].totalSpent || 0) + (req.body.total || 0);
        users[userIndex].lastActive = new Date().toISOString();
        saveData("users.json", users);
      }
    }

    res.status(201).json(orderData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/orders/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const orders = loadData("orders.json");
    const index = orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Order not found" });

    orders[index] = { ...orders[index], ...req.body };
    saveData("orders.json", orders);
    res.json({ message: "Order updated", order: orders[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Users ==========
app.get("/api/users", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = loadData("users.json");
    res.json(users.map((u) => ({ ...u, password: undefined })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id", authMiddleware, (req, res) => {
  try {
    const users = loadData("users.json");
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", authMiddleware, (req, res) => {
  try {
    const users = loadData("users.json");
    const currentUser = users.find((u) => u.id === req.user.id);

    if (req.user.id !== req.params.id && currentUser?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "User not found" });

    users[index] = { ...users[index], ...req.body, lastActive: new Date().toISOString() };
    saveData("users.json", users);
    res.json({ message: "User updated", user: { ...users[index], password: undefined } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Pricing Rules ==========
app.get("/api/config/pricing", (req, res) => {
  try {
    const pricing = loadData("pricing.json");
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/config/pricing", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const pricing = loadData("pricing.json");
    const newRule = { id: generateId(), ...req.body };
    pricing.push(newRule);
    saveData("pricing.json", pricing);
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/config/pricing/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const pricing = loadData("pricing.json");
    const index = pricing.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Pricing rule not found" });

    pricing[index] = { ...pricing[index], ...req.body };
    saveData("pricing.json", pricing);
    res.json(pricing[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/config/pricing/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    let pricing = loadData("pricing.json");
    pricing = pricing.filter((p) => p.id !== req.params.id);
    saveData("pricing.json", pricing);
    res.json({ message: "Pricing rule deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Binding Types ==========
app.get("/api/config/bindings", (req, res) => {
  try {
    const bindings = loadData("bindings.json");
    res.json(bindings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/config/bindings", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const bindings = loadData("bindings.json");
    const newBinding = { id: generateId(), ...req.body };
    bindings.push(newBinding);
    saveData("bindings.json", bindings);
    res.status(201).json(newBinding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/config/bindings/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const bindings = loadData("bindings.json");
    const index = bindings.findIndex((b) => b.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Binding type not found" });

    bindings[index] = { ...bindings[index], ...req.body };
    saveData("bindings.json", bindings);
    res.json(bindings[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/config/bindings/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    let bindings = loadData("bindings.json");
    bindings = bindings.filter((b) => b.id !== req.params.id);
    saveData("bindings.json", bindings);
    res.json({ message: "Binding type deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Dashboard Stats ==========
app.get("/api/stats", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = loadData("users.json");
    const orders = loadData("orders.json");

    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const processing = orders.filter((o) => o.status === "processing").length;

    res.json({
      users: users.length,
      orders: orders.length,
      revenue,
      pending,
      processing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Initialize Default Admin ==========
function initializeDefaultAdmin() {
  const users = loadData("users.json");
  const adminExists = users.some((u) => u.role === "admin");

  if (!adminExists) {
    const defaultAdmin = {
      id: generateId(),
      name: "Admin",
      email: "admin@printhub.app",
      password: "admin123", // Change this in production!
      role: "admin",
      profileType: "Admin",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      orders: 0,
      totalSpent: 0,
    };
    users.push(defaultAdmin);
    saveData("users.json", users);
    console.log("\n🔐 Default admin created:");
    console.log("   Email: admin@printhub.app");
    console.log("   Password: admin123");
    console.log("   ⚠️  Change this password in production!\n");
  }
}

initializeDefaultAdmin();

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

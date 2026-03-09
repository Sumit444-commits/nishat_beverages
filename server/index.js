import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import appRoute from "./routes/app-routes.js";

// Import the database connection module
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// ========== MIDDLEWARE ========== //
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080",
      "https://nishat-beverages-kfyk.vercel.app",
      "https://nishat-beverages.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== INITIALIZE DATABASE ========== //
// Connect to DB immediately for Serverless functions
connectDB();

// ========== ROUTES ========== //
app.get("/", (req, res) => {
  res.json({
    message: "Nishat Beverages Admin API is running!",
    database: {
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      name: mongoose.connection.db?.databaseName || "Not connected",
    },
  });
});

app.use("/api", appRoute);

// ========== ERROR HANDLING ========== //
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ========== START SERVER ========== //
const PORT = process.env.PORT || 5000;

// Only listen automatically if running locally (Not on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 NISHAT BEVERAGES RO PLANT - ADMIN SERVER");
    console.log("=".repeat(60));
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log("=".repeat(60));
    console.log("\n🔐 AUTHENTICATION ENDPOINTS:");
    console.log(`   POST  http://localhost:${PORT}/api/auth/signup`);
    console.log(`   POST  http://localhost:${PORT}/api/auth/login`);
    console.log(
      `   POST  http://localhost:${PORT}/api/auth/create-admin (optional)`,
    );
    console.log(`   GET   http://localhost:${PORT}/api/auth/users`);
    console.log("\n👥 CUSTOMER ENDPOINTS:");
    console.log(`   GET   http://localhost:${PORT}/api/customers`);
    console.log(`   POST  http://localhost:${PORT}/api/customers`);
    console.log(`   GET   http://localhost:${PORT}/api/customers/areas/list`);
    console.log("\n👤 SALESMAN ENDPOINTS:");
    console.log(`   GET   http://localhost:${PORT}/api/salesmen`);
    console.log(`   POST  http://localhost:${PORT}/api/salesmen`);
    console.log(`   GET   http://localhost:${PORT}/api/salesmen/stats/summary`);
    console.log("\n📍 AREA ASSIGNMENT ENDPOINTS:");
    console.log(`   GET    http://localhost:${PORT}/api/area-assignments`);
    console.log(`   POST   http://localhost:${PORT}/api/area-assignments`);
    console.log(`   GET    http://localhost:${PORT}/api/area-assignments/:id`);
    console.log(`   PUT    http://localhost:${PORT}/api/area-assignments/:id`);
    console.log(`   DELETE http://localhost:${PORT}/api/area-assignments/:id`);
    console.log(
      `   GET    http://localhost:${PORT}/api/area-assignments/stats/summary`,
    );
    console.log("=".repeat(60));
  });
}

// Export for Vercel Serverless Functions
export default app;

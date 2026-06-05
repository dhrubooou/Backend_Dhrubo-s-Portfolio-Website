import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import emailRoutes from "./routes/emailRoutes.js";
import transporter from "./config/smtp.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(helmet());

// Configure CORS using dynamic ALLOWED_ORIGINS with robust local development fallbacks
const defaultOrigins = [
  "https://dhrubooou.github.io",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4200",
  "http://localhost:8080",
  "http://localhost:5500",
  "http://localhost:5501",
  "http://localhost:5000"
];

const customOrigins = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map(origin => origin.trim())
  .filter(Boolean) || [];

const allowedOrigins = [...new Set([...defaultOrigins, ...customOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, or local automated tests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server health check route
app.get("/", (req, res) => {
  res.status(200).send("Portfolio contact server is active, secure, and running.");
});

// Load modular router
app.use(emailRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[GLOBAL SERVER ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected system error occurred on the server."
  });
});

// Verify SMTP Connection on Startup
transporter.verify((error) => {
  if (error) {
    console.error("[SMTP ERROR] Connection verification failed:", error.message);
  } else {
    console.log("[SMTP SUCCESS] SMTP mailer is ready to send notifications.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
export default app; // For testing or modularity

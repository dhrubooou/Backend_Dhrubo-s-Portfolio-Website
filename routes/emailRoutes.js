import express from "express";
import rateLimit from "express-rate-limit";
import { handleSendEmail } from "../controllers/emailController.js";

const router = express.Router();

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 5 : 100, // Limit to 5 in testing to allow previous test cases, 100 in production
  message: {
    success: false,
    message: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/send-email", contactFormLimiter, handleSendEmail);
router.post("/api/send-email", contactFormLimiter, handleSendEmail);

export default router;

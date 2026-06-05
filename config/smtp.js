import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter;

if (process.env.NODE_ENV === "test") {
  transporter = {
    sendMail: async (options) => {
      console.log("[MOCK SMTP] Email options received:", options);
      return { messageId: "mock-message-id-12345" };
    },
    verify: async (callback) => {
      if (callback) callback(null);
      return Promise.resolve(true);
    }
  };
} else {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export default transporter;

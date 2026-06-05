import transporter from "../config/smtp.js";

export const handleSendEmail = async (req, res) => {
  console.log("\n=======================================================");
  console.log("[STEP 1/6] [REQUEST RECEIVED] New POST request to /send-email");
  console.log("-------------------------------------------------------");
  console.log(`Payload Name:    "${req.body?.name}"`);
  console.log(`Payload Email:   "${req.body?.email}"`);
  console.log(`Payload Message: "${req.body?.message}"`);

  const { name, email, message } = req.body;

  console.log("\n[STEP 2/6] [VALIDATION STARTING] Verifying input fields...");

  // Reject missing fields (null, undefined, or wrong types)
  if (
    name === undefined || name === null ||
    email === undefined || email === null ||
    message === undefined || message === null ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    console.warn("[WARN] [VALIDATION FAILED] Invalid inputs (missing or wrong types).");
    console.log("=======================================================\n");
    return res.status(400).json({
      success: false,
      message: "Invalid inputs. Name, email, and message must be non-empty strings."
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  // Reject empty fields
  if (trimmedName === "" || trimmedEmail === "" || trimmedMessage === "") {
    console.warn("[WARN] [VALIDATION FAILED] Empty fields detected after trimming.");
    console.log("=======================================================\n");
    return res.status(400).json({
      success: false,
      message: "All fields are required. Empty submissions are rejected."
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    console.warn(`[WARN] [VALIDATION FAILED] Invalid email format: "${trimmedEmail}"`);
    console.log("=======================================================\n");
    return res.status(400).json({
      success: false,
      message: "Invalid email format. Please provide a valid email address."
    });
  }

  console.log("[STEP 3/6] [VALIDATION PASSED] All inputs are structurally valid and secure.");

  try {
    console.log("\n[STEP 4/6] [SMTP VERIFICATION] Connecting to Gmail SMTP server...");
    await transporter.verify();
    console.log("[STEP 4/6] [SMTP VERIFIED] SMTP server handshake successful and ready!");

    console.log("\n[STEP 5/6] [PREPARING EMAIL] Formatting plain-text message notification...");
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "UTC"
    }) + " (UTC)";

    const mailOptions = {
      from: `"${trimmedName}" <${process.env.EMAIL_USER}>`,
      replyTo: trimmedEmail,
      to: "dhrubojyoti72@gmail.com",
      subject: "New Portfolio Contact Request",
      text: `---
New Contact Form Submission

Name: ${trimmedName}

Email: ${trimmedEmail}

Message:
${trimmedMessage}

Submitted At:
${timestamp}
-----------`
    };

    console.log("[STEP 6/6] [SENDING EMAIL] Triggering Nodemailer SMTP send operation...");
    const info = await transporter.sendMail(mailOptions);
    console.log(`[STEP 6/6] [SUCCESS] Email delivered successfully! Message ID: ${info.messageId}`);
    console.log("=======================================================\n");

    return res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error(`\n[ERROR] [SYSTEM FAILURE] Email sending pipeline failed: ${error.message || error}`);
    console.log("=======================================================\n");
    return res.status(500).json({
      success: false,
      message: "Failed to send email"
    });
  }
};

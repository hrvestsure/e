require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// Store OTPs temporarily (use a proper database in production)
const otpStore = new Map();

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ordertemp.html"));
});

// Generate and send OTP
app.post("/api/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP with expiration
    otpStore.set(phone, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
    });

    // Send SMS using Twilio
    await client.messages.create({
      body: `Your OTP for order verification is: ${otp}. Valid for 5 minutes.`,
      to: `+91${phone}`, // Assuming Indian numbers
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// Verify OTP
app.post("/api/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  const storedData = otpStore.get(phone);

  if (!storedData) {
    return res.json({
      success: false,
      message: "OTP expired or not found",
    });
  }

  // Check expiration (5 minutes)
  if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
    otpStore.delete(phone);
    return res.json({
      success: false,
      message: "OTP expired",
    });
  }

  // Check attempts
  if (storedData.attempts >= 3) {
    otpStore.delete(phone);
    return res.json({
      success: false,
      message: "Too many attempts. Please request new OTP",
    });
  }

  // Verify OTP
  if (storedData.otp === otp) {
    otpStore.delete(phone);
    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } else {
    storedData.attempts += 1;
    return res.json({
      success: false,
      message: "Invalid OTP",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

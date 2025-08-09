import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let failedAttempt = 1;

app.post("/login", async (req, res) => {
  const { password, email, captchaToken } = req.body;
  if (failedAttempt >= 10) {
    return res.status(429).json({
      success: false,
      message: "Too Many Requests - Account temporarily locked",
    });
  }

  // Require CAPTCHA after 4 or 7 failed attempts
  if ((failedAttempt === 4 || failedAttempt === 7) && !captchaToken) {
    return res.status(403).json({
      success: false,
      captchaRequired: true,
      message: "Please complete CAPTCHA to continue login",
    });
  }

  // Verify CAPTCHA if token is provided
  if (captchaToken) {
    try {
      console.log("Verifying CAPTCHA token...");
      console.log(process.env.RECAPTCHA_SECRET);
      const captchaRes = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
      );

      const data = captchaRes.data;
      console.log("CAPTCHA verification response:", data);
      if (!data.success) {
        return res.status(402).json({
          success: false,
          message: "CAPTCHA verification failed",
          errors: data["error-codes"] || [],
        });
      }
      console.log("CAPTCHA is valid for v2");

      console.log("CAPTCHA verified successfully");
    } catch (error) {
      console.error("CAPTCHA verification error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error during CAPTCHA verification",
      });
    }
  }

  // Check password
  if (password !== "123456") {
    failedAttempt += 1;
    console.log(`Invalid password. Failed attempts now: ${failedAttempt}`);
    return res.status(400).json({
      success: false,
      message: "Invalid Credentials",
      failedAttempts: failedAttempt,
    });
  }

  // Successful login - reset failed attempts
  failedAttempt = 0;
  console.log("Login successful - resetting failed attempts");

  return res.status(200).json({
    success: true,
    message: "Login Success",
  });
});

// Endpoint to check current failed attempts (for debugging)
app.get("/status", (req, res) => {
  res.json({
    failedAttempts: failedAttempt,
    captchaRequiredAt: [4, 7],
    lockedAt: 10,
  });
});

// Reset endpoint for testing
app.post("/reset", (req, res) => {
  failedAttempt = 0;
  res.json({ message: "Failed attempts reset", failedAttempts: failedAttempt });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.info(`Server Running On Port ${port}`);
  console.info(`CAPTCHA Secret configured: ${!!process.env.RECAPTCHA_SECRET}`);
});

import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY; // Your v2 site key

const App = () => {
  const [payload, setPayload] = useState({
    email: "",
    password: "",
  });
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const handleChange = (e) => {
    setPayload((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Called when user completes the captcha
  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
    console.log("Captcha completed with token:", token);
  };

  // Called when captcha expires
  const onCaptchaExpired = () => {
    setCaptchaToken("");
    console.log("Captcha expired");
    toast.warning("CAPTCHA expired, please verify again");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!payload.email || !payload.password) {
      toast.error("Email and password are required.");
      return;
    }

    // If captcha is shown but user hasn't completed it
    if (showCaptcha && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    try {
      let requestPayload = { ...payload };

      // Add captcha token if available
      if (captchaToken) {
        requestPayload.captchaToken = captchaToken;
      }

      const response = await axios.post(
        "http://localhost:5000/login",
        requestPayload
      );

      if (response.status === 200) {
        toast.success("Login Success");
        // Reset everything on success
        setShowCaptcha(false);
        setCaptchaToken("");
        // Reset the captcha widget
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
        return;
      }
    } catch (error) {
      console.log("Login error:", error.response);

      if (error.response?.status === 429) {
        toast.info("Too many requests, try again later");
        return;
      }

      if (error.response?.status === 403) {
        // CAPTCHA required - show the captcha
        console.log("CAPTCHA required - showing captcha");
        setShowCaptcha(true);
        toast.warning(
          "Too many failed attempts. Please complete CAPTCHA verification."
        );

        // Render the captcha after showing it
        setTimeout(() => {
          renderCaptcha();
        }, 100);
        return;
      }

      if (error.response?.status === 402) {
        toast.error("CAPTCHA verification failed. Please try again.");
        // Reset captcha on failure
        setCaptchaToken("");
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
        return;
      }

      if (error.response?.status === 400) {
        toast.error("Invalid Credentials");
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  const renderCaptcha = () => {
    if (window.grecaptcha && document.getElementById("recaptcha-container")) {
      // Clear any existing captcha
      document.getElementById("recaptcha-container").innerHTML = "";

      // Render new captcha
      window.grecaptcha.render("recaptcha-container", {
        sitekey: SITE_KEY,
        callback: onCaptchaChange,
        "expired-callback": onCaptchaExpired,
        "error-callback": () => {
          console.error("reCAPTCHA error occurred");
          toast.error(
            "reCAPTCHA error occurred. Please refresh and try again."
          );
        },
      });
    }
  };

  useEffect(() => {
    // Load reCAPTCHA v2 script
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("reCAPTCHA v2 script loaded successfully");
    };

    script.onerror = () => {
      console.error("Failed to load reCAPTCHA script");
      toast.error("Failed to load CAPTCHA. Please refresh the page.");
    };

    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        console.log("Script cleanup error:", e);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Sign In to Your Account
        </h2>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
              name="email"
              value={payload.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
              value={payload.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* CAPTCHA Container */}
          {showCaptcha && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">
                Security Verification
              </label>
              <div className="flex justify-center p-4 bg-gray-50 rounded-md">
                <div id="recaptcha-container"></div>
              </div>
              {!captchaToken && (
                <p className="text-sm text-red-600 text-center">
                  Please complete the CAPTCHA above to continue
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition duration-150"
          >
            Sign in with Email
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <span className="absolute bg-white px-2 text-gray-500 text-sm">
            or
          </span>
          <hr className="w-full border-gray-300" />
        </div>

        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-semibold transition duration-150">
          Continue with Google
        </button>

        <p className="text-sm text-gray-500 text-center mt-2">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </a>
        </p>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-400 text-center p-2 bg-gray-100 rounded">
            <div>Show CAPTCHA: {showCaptcha ? "✅" : "❌"}</div>
            <div>
              CAPTCHA Token: {captchaToken ? "✅ Present" : "❌ Missing"}
            </div>
            <div>Site Key: {SITE_KEY ? "✅ Set" : "❌ Missing"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

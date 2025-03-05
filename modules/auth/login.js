import express from 'express';
import envVariables from "../../config/env.js";
import jwt from "jsonwebtoken";
import passport from 'passport';
import { authenticateMiddleware } from '../../middleware/authenticate.js';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const router = express.Router();
const users = {};

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      callbackURL: `${envVariables.API_BASE_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, { profile, accessToken });
    }
  )
);

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.profile.id,
      email: user.profile.emails[0].value,
      role: user.role,
      accessToken: user.accessToken
    },
    envVariables.JWT_SECRET,
    { expiresIn: envVariables.JWT_EXPIRED_IN } // e.g., '15m'
  );

  const refreshToken = jwt.sign(
    { id: user.profile.id },
    envVariables.JWT_REFRESH_SECRET,
    { expiresIn: "30d" } // e.g., '7d'
  );

  return { accessToken, refreshToken };
};

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    accessType: 'offline',
    prompt: 'consent',
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"]
  })(req, res, next);
});


router.get("/google/callback",
  passport.authenticate("google", {
    session: false, // Disable sessions
    failureRedirect: '/',
    failureMessage: true
  }),
  async (req, res) => {
    const userEmail = req.user.profile.emails[0].value;
    const role = "admin";
    users[userEmail] = { role };

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ ...req.user, role });

    // Store refresh token in memory (replace with a database in production)
    users[userEmail].refreshToken = refreshToken;

    // Set cookies or send tokens in response
    res
      .cookie("accessToken", accessToken, {

        secure: envVariables.NODE_ENV === 'production',
        sameSite: envVariables.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {

        secure: envVariables.NODE_ENV === 'production',
        sameSite: envVariables.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      })
      .send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
        <p>Authentication successful. You can close this tab.</p>
        </body>
        <script>
          // Check if this window was opened by another window
          if (window.opener) {
            // Send the token data back to the main window.
            window.opener.postMessage({ tokenData: "success" },"*");
          }
          // Close the current tab after a short delay to ensure the message is sent.
          setTimeout(() => {
            window.close();
          }, 100);
        </script>
      </html>
    `);
  }
);

router.get("/check-auth", authenticateMiddleware, (req, res) => {
  res.status(200).json({ message: "Authenticated" });
});

// Refresh Token Endpoint
router.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, envVariables.JWT_REFRESH_SECRET);

    // Find the user (replace with database lookup in production)
    const user = Object.values(users).find(u => u.profile.id === decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const { accessToken } = generateTokens(user);

    // Send the new access token
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true, secure: envVariables.NODE_ENV === 'production',
        sameSite: envVariables.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: "/",
      })
      .json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

router.get("/get-token", (req, res) => {
  const { accessToken, refreshToken } = req.cookies; // Read the httpOnly cookie
  res.json({ accessToken, refreshToken });
});

// Logout Route
router.get("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // Find and remove the refresh token (replace with database logic in production)
    const user = Object.values(users).find(u => u.refreshToken === refreshToken);
    if (user) {
      delete user.refreshToken;
    }
  }

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ message: "Logged out successfully" });
});

export const AuthRouter = router;
import jwt from "jsonwebtoken";
import envVariables from "../config/env.js";

export const authenticateMiddleware = (req, res, next) => {
  // Check for JWT token in cookies
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify JWT token
  jwt.verify(accessToken, envVariables.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }

    // Attach user and Google OAuth access token to the request
    req.user = user;

    // Check if the user has a Google OAuth access token
    if (!req.user.accessToken) {
      return res.status(401).json({ message: "Google OAuth access token missing" });
    }

    next();
  });
};

export const roleBasedMiddleware = (requiredRole) => (req, res, next) => {
  if (req.user.role !== requiredRole) {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};
import express from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import envVariables from "./config/env.js"; // Import environment variables
import router from "./routes/router.js"; // Import your routes
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app); // Create HTTP server

const allowdedOrigins = ["http://localhost:5173","https://warrentymfrontend.netlify.app", "https://warrenty-me-front.vercel.app" ]

// Middleware
app.use(
  cors({
    origin: allowdedOrigins, 
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: envVariables.SESSION_SECRET, // Use a long, random string
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envVariables.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api", router);
app.get("/", (req, res) => {
  res.status(200).json(`${envVariables.API_BASE_URL}`);
});


// WebSocket server
const io = new Server(server, {
  cors: {
    origin: envVariables.FRONTEND_URL, // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Allow credentials (cookies)
  },
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle real-time updates
  socket.on("edit", (data) => {
    const { fileId, content } = data;
    socket.broadcast.emit("update", { fileId, content }); // Broadcast updates to other users
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Error handling for the server
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Start the server
const PORT = envVariables.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
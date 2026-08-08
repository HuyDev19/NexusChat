import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import callRoute from "./routes/callRoute.js";
import { registerCallSocketHandlers } from "./libs/callSocket.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/calls", callRoute);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Trích xuất userId từ auth handshake hoặc từ JWT token
  let userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

  if (!userId && socket.handshake.auth?.token) {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decoded && typeof decoded === "object" && decoded.userId) {
        userId = decoded.userId;
      }
    } catch (err) {
      console.warn("[Socket] Không thể giải mã token để lấy userId:", err.message);
    }
  }

  if (userId) {
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined personal room user:${userId}`);
  }

  socket.on("join-conversation", (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    }
  });

  // Đăng ký handlers cho cuộc gọi
  registerCallSocketHandlers(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
    console.log(`Socket.IO đang lắng nghe trên cổng ${PORT}`);
  });
});

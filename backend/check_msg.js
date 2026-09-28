import mongoose from "mongoose";
import Message from "./backend/src/models/Message.js";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const msg = await Message.findOne({ senderId: "000000000000000000000000" }).sort({ createdAt: -1 });
  console.log("RAW CONTENT:");
  console.log(JSON.stringify(msg.content));
  process.exit(0);
}

check();

import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["register", "reset_password", "change_password", "delete_account"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Tự động xoá sau 5 phút
    },
  }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;

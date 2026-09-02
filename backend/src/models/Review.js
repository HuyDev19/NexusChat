import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Only 1 review per user
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: ["approved", "rejected"],
      default: "approved", // AI automatically approves or rejects
    },
    aiConfidence: {
      type: Number, // Stores how confident the AI was in its decision
    },
    rejectionReason: {
      type: String, // If rejected, why?
    }
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["direct", "group", "reminder"],
      default: "direct",
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    imgUrl: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    errorReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query for pending scheduled messages
scheduledMessageSchema.index({ status: 1, scheduledFor: 1 });

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);

export default ScheduledMessage;

import mongoose from "mongoose";


// Cấu trúc của user trong cuộc tró chuyện
const messageSchema = new mongoose.Schema(
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
    },
    content: {
      type: String,
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    imgUrl: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresIn: {
      type: Number, // In seconds
    },
    expiresAt: {
      type: Date,
    },
    isViewOnce: {
      type: Boolean,
      default: false,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isRecalled: {
      type: Boolean,
      default: false,
    },
    poll: {
      question: { type: String },
      options: [
        {
          text: { type: String },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      allowMultiple: { type: Boolean, default: false },
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    gameEvent: {
      action: { type: String, enum: ["invite", "start", "end"] },
      gameType: { type: String, enum: ["chess", "sudoku"] },
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" }
    },
    sharedContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    editHistory: [
      {
        content: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Tạo index để tối ưu truy vấn tin nhắn theo cuộc trò chuyện và thời gian tạo
messageSchema.index({ conversationId: 1, createdAt: -1 });

// TTL Index for disappearing messages
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
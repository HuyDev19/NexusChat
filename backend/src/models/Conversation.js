import mongoose from "mongoose";


// Cấu trúc của user trong cuộc tró chuyện
const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);


// Cấu trúc nhóm trong cuộc trò chuyện nhóm
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  }
);


// Cấu trúc tin nhắn cuối cùng trong cuộc trò chuyện
const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);


// Cấu trúc cuộc trò chuyện
const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);


// Tạo index để tối ưu truy vấn cuộc trò chuyện theo user và thời gian tin nhắn cuối
conversationSchema.index({
  "participant.userId": 1,
  lastMessageAt: -1,
});

// có thể thêm các trường để tạo thông tin cho nhóm như ảnh và mô tả nhóm này để làm sau

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    coverUrl: {
      type: String, // link CDN ảnh bìa
    },
    coverId: {
      type: String, // ID để xoá ảnh bìa
    },
    note: {
      content: { type: String, maxlength: 60, default: "" },
      expiresAt: { type: Date, default: null }
    },
    bio: {
      type: String,
      maxlength: 500, // tuỳ
    },
    phone: {
      type: String,
      sparse: true, // cho phép null, nhưng không được trùng
    },
    presenceStatus: {
      type: String,
      enum: ['online', 'offline', 'busy'],
      default: 'online',
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    lockedConversations: [
      {
        conversationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Conversation",
        },
        pin: {
          type: String,
        }
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    readReceipts: {
      type: Boolean,
      default: true,
    },
    photos: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        caption: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
        reactions: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String, required: true }
          }
        ]
      }
    ]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;

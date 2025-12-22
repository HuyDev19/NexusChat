import mongoose from "mongoose";


// Cấu trúc của yêu cầu kết bạn
const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index để đảm bảo không có yêu cầu kết bạn trùng lặp
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
// Tạo index để tối ưu truy vấn yêu cầu kết bạn theo người gửi và người nhận
friendRequestSchema.index({ from: 1 });
friendRequestSchema.index({ to: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
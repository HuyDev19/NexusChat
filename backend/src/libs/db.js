import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const connectDB = async () => {
  try {
    // @ts-ignore
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Liên kết CSDL thành công!");

    // Xóa tất cả dữ liệu nhóm chat cộng đồng NexusChat trên toàn hệ thống
    try {
      const communityConvos = await Conversation.find({ type: "community" });
      if (communityConvos.length > 0) {
        const convoIds = communityConvos.map((c) => c._id);
        await Message.deleteMany({ conversationId: { $in: convoIds } });
        await Conversation.deleteMany({ _id: { $in: convoIds } });
        console.log(`Đã xóa hoàn toàn ${communityConvos.length} nhóm chat cộng đồng NexusChat.`);
      }
    } catch (cleanupError) {
      console.warn("Lỗi dọn dẹp nhóm chat cộng đồng:", cleanupError);
    }
  } catch (error) {
    console.log("Lỗi khi kết nối CSDL:", error);
    process.exit(1);
  }
};

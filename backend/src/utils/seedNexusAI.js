import User from "../models/User.js";

export const NEXUS_AI_ID = "000000000000000000000000";

export const seedNexusAIUser = async () => {
  try {
    const aiUser = await User.findById(NEXUS_AI_ID);
    
    const penguinAvatar = "https://cdn-icons-png.flaticon.com/512/826/826963.png";

    if (!aiUser) {
      await User.create({
        _id: NEXUS_AI_ID,
        username: "NexusAI",
        displayName: "NexusAI",
        email: "ai@nexuschat.com",
        hashedPassword: "not_a_real_password_because_ai_cant_login", // Will not be used
        avatarUrl: penguinAvatar,
        bio: "Xin chào! Mình là trợ lý AI của NexusChat. Gọi tên mình bằng @NexusAI để bắt đầu trò chuyện nhé!",
        presenceStatus: "online",
      });
      console.log("NexusAI bot user created successfully.");
    } else {
      // Nếu user đã tồn tại, ta cập nhật lại ảnh avatar mới
      aiUser.avatarUrl = penguinAvatar;
      await aiUser.save();
      console.log("NexusAI bot user already exists. Avatar updated to penguin!");
    }
  } catch (error) {
    console.error("Error seeding NexusAI:", error);
  }
};

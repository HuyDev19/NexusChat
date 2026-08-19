import User from "../models/User.js";

export const NEXUS_AI_ID = "000000000000000000000000";

export const seedNexusAIUser = async () => {
  try {
    const aiUser = await User.findById(NEXUS_AI_ID);
    
    if (!aiUser) {
      await User.create({
        _id: NEXUS_AI_ID,
        username: "NexusAI",
        displayName: "NexusAI",
        email: "ai@nexuschat.com",
        hashedPassword: "not_a_real_password_because_ai_cant_login", // Will not be used
        avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=NexusAI&backgroundColor=b6e3f4", // A cool bot avatar
        bio: "Xin chào! Mình là trợ lý AI của NexusChat. Gọi tên mình bằng @NexusAI để bắt đầu trò chuyện nhé!",
        presenceStatus: "online",
      });
      console.log("NexusAI bot user created successfully.");
    } else {
      console.log("NexusAI bot user already exists.");
    }
  } catch (error) {
    console.error("Error seeding NexusAI:", error);
  }
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { NEXUS_AI_ID } from "../utils/seedNexusAI.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import { checkAIRateLimit } from "../middlewares/aiRateLimiter.js";

const SYSTEM_INSTRUCTION = `Bạn là NexusAI, một trợ lý ảo thông minh, vui tính và hòa đồng trong ứng dụng nhắn tin NexusChat. 
Hãy xưng hô bằng "mình" và gọi người dùng bằng "cậu" hoặc tên của họ nếu biết.
Trả lời một cách tự nhiên, ngắn gọn (1-3 câu) giống như đang chat trên messenger, sử dụng emoji khi phù hợp.
Nếu có ai đó trêu đùa, hãy hùa theo một cách hài hước.
Không bao giờ xưng "tôi" - "bạn" một cách máy móc, trừ khi cần trang trọng.
Tuyệt đối không trả lời dài dòng kiểu bách khoa toàn thư, trừ khi được yêu cầu giải thích chi tiết một khái niệm khó.
Nếu bạn không biết, hãy nói "Chịu thôi, mình không biết cái này 😅" thay vì cố bịa ra câu trả lời.`;

export const handleAIResponse = async (conversationId, io, senderId) => {
  try {
    if (senderId && !checkAIRateLimit(senderId.toString())) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const aiMessage = await Message.create({
          conversationId: conversation._id,
          senderId: NEXUS_AI_ID,
          content: "Bạn thao tác quá nhanh, vui lòng đợi 1 phút nữa nhé! ⏳",
        });

        updateConversationAfterCreateMessage(conversation, aiMessage, NEXUS_AI_ID);
        await conversation.save();

        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("new-message", {
            message: aiMessage,
            conversation,
            unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
          });
        });
      }
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("NexusAI is called but GEMINI_API_KEY is missing in .env");
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
      // Tạm tắt tính năng Search vì một số tài khoản miễn phí mới (Free tier) 
      // có thể bị Google đánh lỗi 429 (Rate Limit) ngay lập tức khi dùng tool này.
      // tools: [
      //   { googleSearch: {} } 
      // ]
    });

    // Notify typing
    const roomId = conversationId.toString();
    io.to(roomId).emit("typing-start", { conversationId: roomId, userId: NEXUS_AI_ID });

    // Fetch conversation context (last 15 messages)
    const recentMessages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate("senderId", "displayName");
    
    recentMessages.reverse(); // chronological order

    // Build history for Gemini
    const history = recentMessages.map((msg) => {
      const isBot = msg.senderId?._id?.toString() === NEXUS_AI_ID;
      const senderName = isBot ? "NexusAI" : (msg.senderId?.displayName || "Người dùng");
      
      let textContent = msg.content || "";
      if (msg.imgUrl) textContent += " [Hình ảnh đính kèm]";
      if (msg.audioUrl) textContent += " [Âm thanh đính kèm]";

      return {
        role: isBot ? "model" : "user",
        parts: [{ text: `${isBot ? "" : `[${senderName} nói]: `}${textContent}` }],
      };
    });

    // Create chat session with history (excluding the very last message which will be the prompt)
    // Wait, the last message is already in recentMessages and is the one that triggered the bot.
    // It's better to pass the whole history up to the N-1 message, and the last one as the main prompt.
    // However, if the trigger message is in history, we can just pop it and send it as the current message.
    
    if (history.length === 0) return;

    const currentPromptObj = history.pop(); // The message that triggered the bot
    const currentPrompt = currentPromptObj.parts[0].text;

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(currentPrompt);
    const responseText = result.response.text();

    // End typing
    io.to(roomId).emit("typing-end", { conversationId: roomId, userId: NEXUS_AI_ID });

    if (responseText) {
      // Save AI message to database
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const aiMessage = await Message.create({
        conversationId: conversation._id,
        senderId: NEXUS_AI_ID,
        content: responseText,
      });

      updateConversationAfterCreateMessage(conversation, aiMessage, NEXUS_AI_ID);
      await conversation.save();

      // Emit new message
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("new-message", {
          message: aiMessage,
          conversation,
          unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
        });
      });
    }

  } catch (error) {
    console.error("Lỗi khi xử lý phản hồi AI:", error);
    const roomId = conversationId.toString();
    io.to(roomId).emit("typing-end", { conversationId: roomId, userId: NEXUS_AI_ID });
    
    try {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        let errorMessage = "Xin lỗi, mình đang gặp sự cố kỹ thuật 😅 (Vui lòng thử lại sau)";
        if (error.status === 429) {
          errorMessage = "Xin lỗi cậu, API Key hiện tại đã hết hạn mức sử dụng (Quota Exceeded / Rate Limit). Vui lòng cập nhật API Key mới nhé! 😢";
        }
        
        const aiMessage = await Message.create({
          conversationId: conversation._id,
          senderId: NEXUS_AI_ID,
          content: errorMessage,
        });

        updateConversationAfterCreateMessage(conversation, aiMessage, NEXUS_AI_ID);
        await conversation.save();

        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("new-message", {
            message: aiMessage,
            conversation,
            unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
          });
        });
      }
    } catch (fallbackError) {
      console.error("Không thể gửi tin nhắn lỗi:", fallbackError);
    }
  }
};

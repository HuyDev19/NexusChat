import Game from "../models/Game.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const inviteGame = async (req, res) => {
  try {
    const { conversationId, gameType } = req.body;
    const senderId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ message: "Thiếu conversationId" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    // Kiểm tra xem có ván game nào đang chờ hoặc đang chơi không
    const existingGame = await Game.findOne({
      conversationId,
      status: { $in: ["waiting", "playing"] }
    });

    if (existingGame) {
      return res.status(400).json({ message: "Đã có một ván game đang diễn ra. Bạn có thể Hủy lời mời cũ để tạo ván mới." });
    }

    // Tạo game mới (waiting)
    const newGame = new Game({
      conversationId,
      gameType: gameType || "chess",
      status: "waiting",
      players: {
        white: senderId, // Người mời mặc định là quân trắng
        black: null
      }
    });

    await newGame.save();

    // Tạo tin nhắn mời chơi
    const newMessage = new Message({
      conversationId,
      senderId,
      content: `Đã gửi lời mời chơi ${gameType === "chess" ? "Cờ Vua" : "Sudoku"} 🎮`,
      gameEvent: {
        action: "invite",
        gameType: gameType || "chess",
        gameId: newGame._id
      }
    });

    await newMessage.save();
    
    // Thêm tin nhắn vào conversation
    await updateConversationAfterCreateMessage(conversation, newMessage, senderId);
    await conversation.save();

    // KHÔNG populate senderId vì frontend (addMessage) mong đợi string/ObjectId để check isOwn

    // Emit event tin nhắn mới
    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        const pId = (p.userId?._id || p.userId || p._id).toString();
        io.to(`user:${pId}`).emit("new-message", {
          message: newMessage,
          conversation,
          unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
        });
      });
    }

    return res.status(201).json({ game: newGame, message: newMessage });
  } catch (error) {
    console.error("Lỗi khi mời chơi game:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const joinGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id;

    const game = await Game.findById(gameId).populate("players.white players.black", "displayName avatarUrl username");
    
    if (!game) {
      return res.status(404).json({ message: "Không tìm thấy ván game" });
    }

    if (game.status !== "waiting") {
      return res.status(400).json({ message: "Ván game này không còn mở để tham gia." });
    }

    if (game.players.white?._id.toString() === userId.toString()) {
      return res.status(400).json({ message: "Bạn không thể tự chơi với chính mình." });
    }

    // Set user as black player
    game.players.black = userId;
    game.status = "playing";
    await game.save();

    await game.populate("players.white players.black", "displayName avatarUrl username");

    // Emit events
    const conversation = await Conversation.findById(game.conversationId);
    const io = req.app.get("io");
    if (io && conversation) {
      io.to(game.conversationId.toString()).emit("game:started", game);
    }

    return res.status(200).json({ game });
  } catch (error) {
    console.error("Lỗi khi tham gia game:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId).populate("players.white players.black", "displayName avatarUrl username");
    
    if (!game) {
      return res.status(404).json({ message: "Không tìm thấy ván game" });
    }

    return res.status(200).json({ game });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin game:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

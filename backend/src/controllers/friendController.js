import mongoose from "mongoose";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Conversation from "../models/Conversation.js";


// Gửi yêu cầu kết bạn
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    if (from.toString() === to.toString()) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời kết bạn cho chính mình" });
    }

    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (existingRequest) {
      return res.status(400).json({ message: "Đã có lời mời kết bạn đang chờ" });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    return res
      .status(201)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    // Xoá lời mời kết bạn sau khi đã chấp nhận
    await FriendRequest.findByIdAndDelete(requestId);


    // Lấy thông tin người gửi lời mời để trả về
    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl presenceStatus")
      .lean();

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// Từ chối lời mời kết bạn
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString() && request.from.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy lời mời này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// Lấy danh sách bạn bè
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ],
    })
      .populate("userA", "_id displayName avatarUrl coverUrl note presenceStatus lastActiveAt updatedAt")
      .populate("userB", "_id displayName avatarUrl coverUrl note presenceStatus lastActiveAt updatedAt")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// Lấy danh sách yêu cầu kết bạn
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id displayName avatarUrl coverUrl note username presenceStatus lastActiveAt updatedAt";

    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Xóa bạn bè (Hủy kết bạn)
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({ message: "Thiếu thông tin người bạn cần xóa" });
    }

    let userA = userId.toString();
    let userB = friendId.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const deleted = await Friend.findOneAndDelete({ userA, userB });
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy quan hệ bạn bè" });
    }

    // Reset chuỗi tin nhắn khi xóa bạn bè
    try {
      const directConversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, new mongoose.Types.ObjectId(friendId)] }
      });

      if (directConversation) {
        directConversation.streak = {
          count: 0,
          lastMessageDate: null,
          senders: [],
          isBothMessaged: false,
        };
        if (typeof directConversation.markModified === "function") {
          directConversation.markModified("streak");
        }
        await directConversation.save();

        const io = req.app.get("io");
        if (io) {
          io.to(`user:${userId}`).to(`user:${friendId}`).emit("conversation:streak-reset", {
            conversationId: directConversation._id,
            streak: directConversation.streak,
          });
        }
      }
    } catch (streakErr) {
      console.error("Lỗi khi reset streak:", streakErr);
    }

    return res.status(200).json({ message: "Đã xóa bạn bè thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
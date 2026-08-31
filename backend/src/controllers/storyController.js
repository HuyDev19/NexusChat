import Story from "../models/Story.js";
import User from "../models/User.js";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs";

export const createStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType, musicTitle, musicArtist, musicCoverUrl, musicPreviewUrl } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    if (!["image", "video"].includes(mediaType)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Loại media không hợp lệ" });
    }

    const folder = mediaType === "video" ? "nexuschat_stories_video" : "nexuschat_stories_image";
    const resource_type = mediaType === "video" ? "video" : "image";

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type,
    });

    fs.unlinkSync(file.path);

    const music = musicPreviewUrl ? {
      title: musicTitle,
      artist: musicArtist,
      coverUrl: musicCoverUrl,
      previewUrl: musicPreviewUrl,
    } : undefined;

    // Expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      userId,
      mediaUrl: result.secure_url,
      mediaType,
      music,
      expiresAt,
    });

    await story.populate("userId", "username displayName avatarUrl");

    // Emit event to friends/all users (depends on privacy, assuming global for simplicity or friends in real app)
    const io = req.app.get("io");
    if (io) {
      io.emit("story:new", { userId, storyId: story._id, story });
    }

    return res.status(201).json({ message: "Tạo Story thành công", story });
  } catch (error) {
    console.error("Lỗi khi tạo Story:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo Story" });
  }
};

export const getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Fetch active stories
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .populate("userId", "username displayName avatarUrl")
      .populate("viewers", "username displayName avatarUrl")
      .populate("reactions.userId", "username displayName avatarUrl")
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const uId = story.userId._id.toString();
      if (!acc[uId]) {
        acc[uId] = {
          user: story.userId,
          stories: [],
          allViewed: true,
        };
      }
      acc[uId].stories.push(story);
      
      const hasViewed = story.viewers.some(v => v._id.toString() === userId.toString() || v.toString() === userId.toString());
      if (!hasViewed) {
        acc[uId].allViewed = false;
      }
      
      return acc;
    }, {});

    const result = Object.values(groupedStories).sort((a, b) => {
      // Unviewed stories come first
      if (a.allViewed === b.allViewed) {
        return new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt);
      }
      return a.allViewed ? 1 : -1;
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Lỗi khi lấy Story:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy Story" });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Không tìm thấy Story" });
    }

    if (!story.viewers.includes(userId)) {
      story.viewers.push(userId);
      await story.save();

      const io = req.app.get("io");
      if (io) {
        const viewer = await User.findById(userId).select("username displayName avatarUrl");
        io.to(`user:${story.userId}`).emit("story:viewed", {
          storyId: story._id,
          viewer,
        });
      }
    }

    return res.status(200).json({ message: "Thành công", viewers: story.viewers });
  } catch (error) {
    console.error("Lỗi khi đánh dấu xem Story:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const reactStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { emoji } = req.body;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Không tìm thấy Story" });
    }

    const existingReaction = story.reactions.find(r => r.userId.toString() === userId.toString() && r.emoji === emoji);
    if (!existingReaction) {
      story.reactions.push({ userId, emoji });
      await story.save();

      const io = req.app.get("io");
      if (io) {
        const reactor = await User.findById(userId).select("username displayName avatarUrl");
        io.to(`user:${story.userId}`).emit("story:reacted", {
          storyId: story._id,
          reaction: {
            userId: reactor,
            emoji,
            createdAt: new Date(),
          },
        });
      }
    }

    return res.status(200).json({ message: "Đã thả cảm xúc", reactions: story.reactions });
  } catch (error) {
    console.error("Lỗi khi react Story:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Không tìm thấy Story" });
    }

    if (story.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền xoá Story này" });
    }

    // Xoá ảnh/video trên Cloudinary
    if (story.mediaUrl) {
      const folder = story.mediaType === "video" ? "nexuschat_stories_video" : "nexuschat_stories_image";
      const publicId = story.mediaUrl.split("/").pop().split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`${folder}/${publicId}`, { 
          resource_type: story.mediaType === "video" ? "video" : "image" 
        }).catch(() => {});
      }
    }

    await story.deleteOne();

    return res.status(200).json({ message: "Đã xoá Story" });
  } catch (error) {
    console.error("Lỗi khi xoá Story:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá Story" });
  }
};

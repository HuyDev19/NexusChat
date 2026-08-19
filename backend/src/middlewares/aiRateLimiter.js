const requestCounts = new Map();

const WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS = 5;

export const checkAIRateLimit = (userId) => {
  const now = Date.now();
  if (!requestCounts.has(userId)) {
    requestCounts.set(userId, []);
  }

  const timestamps = requestCounts.get(userId);
  
  // Lọc các request trong 1 phút gần nhất
  const recentTimestamps = timestamps.filter(time => now - time < WINDOW_MS);
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    requestCounts.set(userId, recentTimestamps);
    return false; // Vượt quá giới hạn
  }

  recentTimestamps.push(now);
  requestCounts.set(userId, recentTimestamps);
  return true; // Hợp lệ
};

// Express middleware cho route API
export const aiRateLimiterMiddleware = (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const isAllowed = checkAIRateLimit(userId.toString());
  if (!isAllowed) {
    return res.status(429).json({ message: "Bạn thao tác quá nhanh, vui lòng đợi 1 phút nữa nhé!" });
  }

  next();
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatOnlineTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 60) {
    return `${diffMins}m`; // 5m, 45m
  } else if (diffHours < 24) {
    return `${diffHours}h`; // 3h, 20h
  } else if (diffDays < 30) {
    return `${diffDays}d`; // 1d, 12d
  } else if (diffMonths < 12) {
    return `${diffMonths}m`; // 1m, 2m, 11m
  } else {
    return `${diffYears}y`; // 1y, 2y
  }
};

export const formatMessageTime = (date: Date) => {
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) {
    return timeStr; // ví dụ: "14:35"
  } else if (isYesterday) {
    return `Hôm qua ${timeStr}`; // ví dụ: "Hôm qua 23:10"
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`; // ví dụ: "22/9 09:15"
  } else {
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${timeStr}`; // ví dụ: "15/12/2023 18:40"
  }
};

export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return str.toLowerCase().trim();
}

export const isNoteExpired = (note?: any) => {
  if (!note) return true;
  if (typeof note === "string") return false;
  if (!note.content) return true;
  if (!note.expiresAt) return false;
  return new Date(note.expiresAt).getTime() < Date.now();
};

export const isStreakActive = (streak?: { count: number; lastMessageDate?: string | Date | null }) => {
  if (!streak || !streak.count || streak.count < 1 || !streak.lastMessageDate) return false;
  const d1 = new Date(streak.lastMessageDate);
  const d2 = new Date();
  const u1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const u2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  const dayDiff = Math.floor((u2 - u1) / (1000 * 60 * 60 * 24));
  return dayDiff < 2;
};

export const isStreakOnFire = (streak?: { count: number; lastMessageDate?: string | Date | null; isBothMessaged?: boolean; senders?: string[] }) => {
  if (!isStreakActive(streak)) return false;
  return Boolean(streak?.isBothMessaged || (streak?.senders && streak.senders.length >= 2));
};

export const getOfflineMinutes = (dateStrOrDate?: string | Date | null): number | null => {
  if (!dateStrOrDate) return null;
  const date = new Date(dateStrOrDate);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 0;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return diffMins;
};

export const getEffectiveStatus = (
  isOnline: boolean,
  presenceStatus?: "online" | "offline" | "busy" | string | null
): "online" | "offline" | "busy" => {
  if (presenceStatus === "offline") return "offline";
  if (presenceStatus === "busy") return isOnline ? "busy" : "offline";
  return isOnline ? "online" : "offline";
};

export const formatLastActive = (
  dateStrOrDate?: string | Date | null,
  isOnline?: boolean,
  presenceStatus?: "online" | "offline" | "busy" | string | null
): string => {
  const status = getEffectiveStatus(Boolean(isOnline), presenceStatus);
  if (status === "online") return "Đang hoạt động";
  if (status === "busy") return "Đang bận";

  if (!dateStrOrDate) return "Ngoại tuyến";
  const date = new Date(dateStrOrDate);
  if (isNaN(date.getTime())) return "Ngoại tuyến";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa mới truy cập";
  if (diffMins < 60) return `Hoạt động ${diffMins} phút trước`;
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;
  if (diffDays < 7) return `Hoạt động ${diffDays} ngày trước`;
  return "Không hoạt động gần đây";
};
export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  coverId?: string;
  note?: {
    content: string;
    expiresAt: string | null;
  };
  bio?: string;
  phone?: string;
  presenceStatus?: 'online' | 'offline' | 'busy';
  lastActiveAt?: string;
  lockedConversations?: { conversationId: string; pin: string }[];
  blockedUsers?: string[];
  readReceipts?: boolean;
  photos?: {
    _id: string;
    url: string;
    publicId?: string;
    caption?: string;
    createdAt: string;
    reactions?: { userId: string; emoji: string }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  note?: {
    content: string;
    expiresAt: string | null;
  };
  presenceStatus?: 'online' | 'offline' | 'busy';
  lastActiveAt?: string;
  updatedAt?: string;
}

export interface FriendRequest {
  _id: string;
  from?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  to?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: string;
  updatedAt: string;
}
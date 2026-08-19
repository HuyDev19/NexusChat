export interface Participant {
  _id: string;
  username?: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  note?: {
    content: string;
    expiresAt: string | null;
  };
  presenceStatus?: 'online' | 'offline' | 'busy';
  joinedAt: string;
  role?: 'leader' | 'member';
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
  description?: string;
  avatar?: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group" | "community";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  wallpaper?: string;
  streak?: {
    count: number;
    lastMessageDate: string;
  };
  nicknames?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  audioUrl?: string | null;
  reactions?: { userId: string; emoji: string }[];
  isPinned?: boolean;
  expiresIn?: number;
  expiresAt?: Date | string;
  isViewOnce?: boolean;
  viewedBy?: string[];
  isRecalled?: boolean;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  poll?: {
    question: string;
    options: {
      _id: string;
      text: string;
      votes: string[];
    }[];
    allowMultiple: boolean;
  };
  replyTo?: {
    _id: string;
    content: string | null;
    senderId: string;
    imgUrl?: string | null;
    audioUrl?: string | null;
    isRecalled?: boolean;
  };
  isForwarded?: boolean;
}
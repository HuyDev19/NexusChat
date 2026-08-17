import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    otp: string
  ) => Promise<void>;
  sendOtp: (email: string, type: "register" | "reset_password" | "change_password" | "delete_account") => Promise<void>;
  verifyOtp: (email: string, otp: string, type: "register" | "reset_password" | "change_password" | "delete_account") => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  changePassword: (otp: string, newPassword: string) => Promise<void>;
  deleteAccount: (otp: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  unlockedConversations: string[];
  typingUsers: Record<string, string[]>; // { conversationId: [userIds] }
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  searchQuery: string;
  archivedConversations: string[];
  pinnedConversations: string[];
  mutedConversations: Record<string, number>; // convoId -> expiresAt timestamp (-1 = permanent)
  setSearchQuery: (query: string) => void;
  archiveConversation: (id: string) => void;
  unarchiveConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;
  muteConversation: (id: string, durationMs?: number) => void;
  unmuteConversation: (id: string) => void;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string | null,
    audioUrl?: string,
    expiresIn?: number,
    isViewOnce?: boolean
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string | null,
    audioUrl?: string,
    expiresIn?: number,
    isViewOnce?: boolean,
    poll?: any
  ) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearChatHistory: (id: string) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  removeConversation: (id: string) => void;
  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => void;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: unknown) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;
  updateParticipantData: (user: Partial<User> & { _id: string }) => void;
  uploadAudio: (file: Blob) => Promise<string>;
  uploadImage: (file: File) => Promise<string>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  markMediaAsViewed: (messageId: string) => Promise<void>;
  recallMessage: (messageId: string) => Promise<void>;
  updateWallpaper: (conversationId: string, data: string | File) => Promise<void>;
  updateNickname: (conversationId: string, targetUserId: string, nickname: string) => Promise<void>;
  updateConversationFields: (conversationId: string, fields: Partial<Conversation>) => void;
  updateMessageReactions: (conversationId: string, messageId: string, reactions: any[]) => void;
  updateMessagePinStatus: (conversationId: string, messageId: string, isPinned: boolean) => void;
  updateMessageFields: (conversationId: string, messageId: string, fields: Partial<Message>) => void;
  unlockConversation: (conversationId: string) => void;
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>;
  removeGroupMember: (conversationId: string, memberId: string) => Promise<void>;
  updateGroupRole: (conversationId: string, memberId: string, role: "leader" | "member") => Promise<void>;
  updateGroupInfo: (conversationId: string, name?: string, description?: string) => Promise<void>;
  updateGroupAvatar: (conversationId: string, file: File) => Promise<void>;
  voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
  emitTypingStart: (conversationId: string, participantIds: string[]) => void;
  emitTypingEnd: (conversationId: string, participantIds: string[]) => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  updateFriendData: (user: Partial<User> & { _id: string }) => void;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateCoverUrl: (formData: FormData) => Promise<void>;
  updateNote: (content: string, expiresInHours?: number) => Promise<void>;
  updateProfile: (data: { 
    displayName?: string; 
    phone?: string; 
    bio?: string; 
    presenceStatus?: 'online' | 'offline' | 'busy';
    lockedConversations?: { conversationId: string; pin: string }[];
  }) => Promise<void>;
}
import { create } from "zustand";
import { callService } from "@/services/callService";
import { useSocketStore } from "./useSocketStore";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export interface IncomingCall {
  conversationId: string;
  roomName: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  conversationType?: string;
}

export interface ActiveCall {
  conversationId: string;
  roomName: string;
  token: string;
  serverUrl: string;
  isVideo: boolean;
}

interface CallState {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  activeGroupCalls: Record<string, { roomName: string; isVideo: boolean; active: boolean }>;
  
  // Actions
  setIncomingCall: (call: IncomingCall | null) => void;
  setActiveCall: (call: ActiveCall | null) => void;
  setActiveGroupCall: (conversationId: string, data: { roomName?: string; isVideo?: boolean; active: boolean }) => void;
  
  // Nghiệp vụ cuộc gọi
  startCall: (conversationId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  joinExistingCall: (conversationId: string, roomName: string, isVideo: boolean) => Promise<void>;
}

export const useCallStore = create<CallState>((set, get) => ({
  incomingCall: null,
  activeCall: null,
  activeGroupCalls: {},

  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCall: (call) => set({ activeCall: call }),
  setActiveGroupCall: (conversationId, data) => set((state) => {
    if (!data.active) {
      const updated = { ...state.activeGroupCalls };
      delete updated[conversationId];
      return { activeGroupCalls: updated };
    }
    return {
      activeGroupCalls: {
        ...state.activeGroupCalls,
        [conversationId]: {
          roomName: data.roomName || "",
          isVideo: data.isVideo || false,
          active: true
        }
      }
    };
  }),

  /**
   * Bắt đầu cuộc gọi mới (Người gọi)
   */
  startCall: async (conversationId: string, isVideo: boolean) => {
    try {
      const socket = useSocketStore.getState().socket;
      const currentUser = useAuthStore.getState().user;
      const activeChat = useChatStore.getState().conversations.find(c => c._id === conversationId);

      if (!socket || !currentUser || !activeChat) return;

      // Sinh roomName ngẫu nhiên độc nhất dựa trên conversationId + timestamp
      const roomName = `room_${conversationId}_${Date.now()}`;

      // 1. Lấy token cho bản thân (người gọi)
      const callData = await callService.getCallToken(conversationId, roomName, isVideo);

      // 2. Lấy danh sách ID người nhận cuộc gọi (tất cả participants ngoại trừ người gọi)
      const targetUserIds = activeChat.participants
        .map(p => p._id)
        .filter(id => id !== currentUser._id);

      // 3. Gửi tín hiệu đổ chuông qua Socket.IO
      socket.emit("call:invite", {
        conversationId,
        roomName,
        targetUserIds,
        isVideo,
        callerName: currentUser.displayName || currentUser.username,
        callerAvatar: currentUser.avatarUrl || "",
        conversationType: activeChat.type,
      });

      // Nếu là nhóm, cập nhật luôn local state activeGroupCalls
      if (activeChat.type === 'group' || activeChat.type === 'community') {
        get().setActiveGroupCall(conversationId, { roomName, isVideo, active: true });
      }

      // 4. Vào phòng gọi ở giao diện người gọi
      set({
        activeCall: {
          conversationId,
          roomName,
          token: callData.token,
          serverUrl: callData.serverUrl,
          isVideo,
        },
        incomingCall: null
      });
    } catch (error) {
      console.error("[useCallStore] Lỗi startCall:", error);
    }
  },

  /**
   * Đồng ý nghe cuộc gọi (Người nhận)
   */
  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    try {
      const socket = useSocketStore.getState().socket;
      if (!socket) return;

      // 1. Lấy token để tham gia phòng họp LiveKit
      const callData = await callService.getCallToken(
        incomingCall.conversationId,
        incomingCall.roomName,
        incomingCall.isVideo
      );

      // 2. Gửi tín hiệu Socket.IO báo đã chấp nhận cuộc gọi cho người gọi biết
      socket.emit("call:accept", {
        roomName: incomingCall.roomName,
        callerId: incomingCall.callerId,
        conversationId: incomingCall.conversationId,
        conversationType: incomingCall.conversationType,
      });

      // 3. Cập nhật state activeCall
      set({
        activeCall: {
          conversationId: incomingCall.conversationId,
          roomName: incomingCall.roomName,
          token: callData.token,
          serverUrl: callData.serverUrl,
          isVideo: incomingCall.isVideo,
        },
        incomingCall: null,
      });
    } catch (error) {
      console.error("[useCallStore] Lỗi acceptCall:", error);
    }
  },

  /**
   * Từ chối nghe cuộc gọi (Người nhận)
   */
  declineCall: () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const socket = useSocketStore.getState().socket;
    if (socket) {
      socket.emit("call:decline", {
        roomName: incomingCall.roomName,
        callerId: incomingCall.callerId,
        reason: "declined",
        conversationType: incomingCall.conversationType,
      });
    }

    set({ incomingCall: null });
  },

  /**
   * Tắt cuộc gọi (Khi bấm gác máy hoặc nhận sự kiện cuộc gọi kết thúc)
   */
  endCall: () => {
    const { activeCall } = get();
    const socket = useSocketStore.getState().socket;
    const currentUser = useAuthStore.getState().user;
    const activeChat = useChatStore.getState().conversations.find(
      (c) => c._id === activeCall?.conversationId
    );

    if (activeCall && socket && currentUser && activeChat) {
      const isGroup = activeChat.type === 'group' || activeChat.type === 'community';
      
      if (isGroup) {
        // Nếu là gọi nhóm, chỉ thoát khỏi phòng (leave)
        socket.emit("call:leave", {
          conversationId: activeCall.conversationId,
          roomName: activeCall.roomName
        });
      } else {
        // Cuộc gọi 1:1, kết thúc hoàn toàn
        const targetUserIds = activeChat.participants
          .map((p) => p._id)
          .filter((id) => id !== currentUser._id);

        socket.emit("call:end", {
          roomName: activeCall.roomName,
          participantIds: targetUserIds,
          conversationId: activeCall.conversationId,
          conversationType: activeChat.type
        });
      }
    }

    set({ activeCall: null, incomingCall: null });
  },

  /**
   * Tính năng Rejoin: Tham gia vào cuộc gọi nhóm đang diễn ra
   */
  joinExistingCall: async (conversationId: string, roomName: string, isVideo: boolean) => {
    try {
      const socket = useSocketStore.getState().socket;
      if (!socket) return;

      const callData = await callService.getCallToken(conversationId, roomName, isVideo);
      
      // Notify backend we joined
      socket.emit("call:accept", {
        roomName,
        callerId: "rejoin", // dummy callerId since we are rejoining
        conversationId,
        conversationType: 'group'
      });

      set({
        activeCall: {
          conversationId,
          roomName,
          token: callData.token,
          serverUrl: callData.serverUrl,
          isVideo,
        },
        incomingCall: null
      });
    } catch (error) {
      console.error("[useCallStore] Lỗi joinExistingCall:", error);
    }
  },
}));

import api from "@/lib/axios";

export interface CallTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
}

export const callService = {
  /**
   * Lấy Access Token từ Backend để kết nối vào phòng gọi LiveKit
   */
  async getCallToken(
    conversationId: string,
    roomName: string,
    isVideo: boolean
  ): Promise<CallTokenResponse> {
    const res = await api.post<CallTokenResponse>("/calls/token", {
      conversationId,
      roomName,
      isVideo,
    });
    return res.data;
  },
};

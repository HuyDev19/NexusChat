import api from "@/lib/axios";

export const gameService = {
  inviteGame: async (conversationId: string, gameType: string = "chess") => {
    const response = await api.post("/games/invite", { conversationId, gameType });
    return response.data;
  },

  joinGame: async (gameId: string) => {
    const response = await api.post(`/games/${gameId}/join`);
    return response.data;
  },

  getGame: async (gameId: string) => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  }
};

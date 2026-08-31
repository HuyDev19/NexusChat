import { create } from "zustand";
import { gameService } from "../services/gameService";

interface GameState {
  currentGame: any | null;
  isOpen: boolean;
  isLoading: boolean;
  inviteGame: (conversationId: string, gameType?: string) => Promise<any>;
  joinGame: (gameId: string) => Promise<any>;
  getGame: (gameId: string) => Promise<any>;
  setGame: (game: any) => void;
  openGame: (gameId: string) => void;
  closeGame: () => void;
  updateGameFromSocket: (data: any) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  isOpen: false,
  isLoading: false,

  inviteGame: async (conversationId: string, gameType = "chess") => {
    set({ isLoading: true });
    try {
      const data = await gameService.inviteGame(conversationId, gameType);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  joinGame: async (gameId: string) => {
    set({ isLoading: true });
    try {
      const data = await gameService.joinGame(gameId);
      set({ currentGame: data.game, isOpen: true });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  getGame: async (gameId: string) => {
    set({ isLoading: true });
    try {
      const data = await gameService.getGame(gameId);
      set({ currentGame: data.game, isOpen: true });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  setGame: (game) => set({ currentGame: game }),

  openGame: async (gameId) => {
    await get().getGame(gameId);
  },

  closeGame: () => set({ isOpen: false }),

  updateGameFromSocket: (data) => set((state) => {
    const id = data.gameId || data._id;
    if (state.currentGame && state.currentGame._id === id) {
      return {
        currentGame: {
          ...state.currentGame,
          ...data, // merge updated fields (fen, pgn, turn, status, etc)
        }
      };
    }
    return state;
  })
}));

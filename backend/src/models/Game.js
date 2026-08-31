import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    gameType: {
      type: String,
      enum: ["chess", "sudoku"],
      default: "chess",
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished", "cancelled"],
      default: "waiting",
    },
    players: {
      white: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      black: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    fen: {
      type: String,
      default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Initial chess board
    },
    pgn: {
      type: String,
      default: "",
    },
    turn: {
      type: String,
      enum: ["w", "b"],
      default: "w",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDraw: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;

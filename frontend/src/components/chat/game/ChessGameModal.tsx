import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Loader2 } from "lucide-react";

export default function ChessGameModal() {
  const { currentGame, isOpen, closeGame } = useGameStore();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();

  const [chess] = useState(() => new Chess());
  const [boardWidth, setBoardWidth] = useState(400);
  // position state riêng để trigger re-render bàn cờ
  const [position, setPosition] = useState("start");

  // Sync FEN từ server khi đối phương đánh hoặc khi game mới bắt đầu
  useEffect(() => {
    if (currentGame?.fen) {
      try {
        chess.load(currentGame.fen);
        setPosition(chess.fen());
      } catch (e) {
        console.error("Invalid FEN", currentGame.fen);
      }
    } else if (currentGame?.status === "playing") {
      chess.reset();
      setPosition(chess.fen());
    }
  }, [currentGame?.fen, currentGame?.status]);

  // Calculate dynamic width based on window size
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(window.innerWidth - 64, 450);
      setBoardWidth(maxWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!currentGame || !isOpen) return null;

  // So sánh ID cẩn thận (có thể là string hoặc object)
  const myId = user?._id?.toString();
  const whiteId = currentGame.players?.white?._id?.toString() || currentGame.players?.white?.toString();
  const blackId = currentGame.players?.black?._id?.toString() || currentGame.players?.black?.toString();

  const isWhite = myId === whiteId;
  const isBlack = myId === blackId;
  const isPlayer = isWhite || isBlack;
  // Người trắng (người mời) nhìn từ hướng trắng (trắng ở dưới), người đen (người nhận) nhìn từ hướng đen (đen ở dưới)
  const boardOrientation: "white" | "black" = isBlack ? "black" : "white";

  // Dữ liệu người chơi
  const whitePlayer = currentGame.players?.white;
  const blackPlayer = currentGame.players?.black;
  const opponentData = isWhite ? blackPlayer : whitePlayer;
  const meData = isWhite ? whitePlayer : blackPlayer;

  const currentTurn = chess.turn(); // "w" hoặc "b"
  const isMyTurn = currentGame.status === "playing" && (
    (isWhite && currentTurn === "w") ||
    (isBlack && currentTurn === "b")
  );

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!isMyTurn || currentGame.status !== "playing") return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      const newFen = chess.fen();
      const newPgn = chess.pgn();
      const newTurn = chess.turn();

      // Cập nhật UI ngay lập tức
      setPosition(newFen);
      useGameStore.getState().setGame({
        ...currentGame,
        fen: newFen,
        pgn: newPgn,
        turn: newTurn,
      });

      // Gửi nước đi qua socket
      if (socket) {
        socket.emit("game:move", {
          gameId: currentGame._id,
          fen: newFen,
          pgn: newPgn,
          turn: newTurn,
          move: move.san,
          conversationId: currentGame.conversationId,
        });

        // Kiểm tra kết thúc ván
        if (chess.isGameOver()) {
          const isDraw = !chess.isCheckmate();
          const winnerId = chess.isCheckmate() ? user?._id : null;
          socket.emit("game:end", {
            gameId: currentGame._id,
            winnerId,
            isDraw,
            conversationId: currentGame.conversationId,
          });
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeGame}>
      <DialogContent className="sm:max-w-md p-4 bg-background border-border shadow-2xl rounded-3xl flex flex-col items-center">
        <DialogHeader className="w-full mb-2">
          <DialogTitle className="text-center text-lg font-bold">
            {currentGame.gameType === "chess" ? "Cờ Vua" : "Trò Chơi"}
          </DialogTitle>
        </DialogHeader>

        {currentGame.status === "waiting" && (
          <div className="w-full flex flex-col items-center justify-center p-8 bg-muted/30 rounded-2xl border border-dashed border-border mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="font-semibold text-foreground">Đang chờ đối thủ...</p>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Chờ người kia bấm Tham gia để bắt đầu ván cờ.
            </p>
          </div>
        )}

        {/* TOP PLAYER (Opponent) */}
        {currentGame.status !== "waiting" && opponentData && (
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-border shadow-sm">
                <AvatarImage src={opponentData.avatarUrl} />
                <AvatarFallback>{opponentData.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{opponentData.displayName}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  Cầm quân: {isWhite ? "Đen ♟️" : "Trắng ♙"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CHESS BOARD */}
        <div 
          className="rounded-lg overflow-hidden shadow-xl border-4 border-muted relative"
          style={{ width: boardWidth, height: boardWidth }}
        >
          {currentGame.status === "playing" || currentGame.status === "finished" ? (
            <Chessboard
              id="NexusChessBoard"
              position={position}
              onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              boardWidth={boardWidth}
              customDarkSquareStyle={{ backgroundColor: "#779556" }}
              customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
              isDraggablePiece={({ piece }) => {
                if (currentGame.status !== "playing") return false;
                if (!isPlayer || !isMyTurn) return false;
                const pieceColor = piece[0];
                return (isWhite && pieceColor === "w") || (isBlack && pieceColor === "b");
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Chessboard 
                position="start" 
                boardWidth={boardWidth}
                customDarkSquareStyle={{ backgroundColor: "#779556" }}
                customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
                arePiecesDraggable={false}
              />
            </div>
          )}

          {currentGame.status === "finished" && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white p-4 text-center">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-lg mb-2 uppercase">
                {currentGame.isDraw ? "Hòa!" : "Chiếu Bí!"}
              </h2>
              {!currentGame.isDraw && currentGame.winner && (
                <p className="font-medium text-lg">
                  {currentGame.winner === user?._id ? "Bạn đã thắng 🎉" : "Bạn đã thua 😢"}
                </p>
              )}
              {currentGame.isDraw && <p className="font-medium">Ván cờ kết thúc với kết quả hòa.</p>}
            </div>
          )}
        </div>

        {/* BOTTOM PLAYER (Me) */}
        {currentGame.status !== "waiting" && meData && (
          <div className="w-full flex items-center justify-between mt-3 px-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary shadow-sm">
                <AvatarImage src={meData.avatarUrl} />
                <AvatarFallback>{meData.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Bạn</span>
                <span className="text-xs text-muted-foreground font-medium">
                  Cầm quân: {isWhite ? "Trắng ♙" : "Đen ♟️"}
                </span>
              </div>
            </div>
            {isMyTurn && (
              <span className="text-xs font-bold text-white animate-pulse bg-green-500 px-2 py-1 rounded-md shadow-md">Đến lượt bạn</span>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

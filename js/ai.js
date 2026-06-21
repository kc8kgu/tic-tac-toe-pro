import { PLAYERS, evaluateBoard } from './game.js';

export function findBestMove(board, player) {
  const isMaximizingPlayer = player === PLAYERS.O;
  let bestScore = isMaximizingPlayer ? -Infinity : Infinity;
  let move = null;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== '') continue;

    const nextBoard = [...board];
    nextBoard[index] = player;
    const score = minimax(nextBoard, !isMaximizingPlayer);

    if (isMaximizingPlayer ? score > bestScore : score < bestScore) {
      bestScore = score;
      move = index;
    }
  }

  return move;
}

function minimax(board, isMaximizing) {
  const result = evaluateBoard(board);

  if (result.winner === PLAYERS.O) return 10;
  if (result.winner === PLAYERS.X) return -10;
  if (result.isDraw) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== '') continue;

      const nextBoard = [...board];
      nextBoard[index] = PLAYERS.O;
      bestScore = Math.max(bestScore, minimax(nextBoard, false));
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== '') continue;

    const nextBoard = [...board];
    nextBoard[index] = PLAYERS.X;
    bestScore = Math.min(bestScore, minimax(nextBoard, true));
  }

  return bestScore;
}

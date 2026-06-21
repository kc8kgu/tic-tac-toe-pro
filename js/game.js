export const PLAYERS = {
  X: 'X',
  O: 'O'
};

export const GAME_MODES = {
  AI: 'ai',
  PVP: 'pvp'
};

export const EMPTY_BOARD = Object.freeze(['', '', '', '', '', '', '', '', '']);

export const WINNING_CONDITIONS = Object.freeze([
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]);

export function createInitialScores() {
  return {
    ai: { X: 0, AI: 0 },
    pvp: { X: 0, O: 0 }
  };
}

export function createInitialGameState({
  mode = GAME_MODES.AI,
  soundEnabled = true,
  scores = createInitialScores()
} = {}) {
  return {
    currentPlayer: PLAYERS.X,
    gameBoard: [...EMPTY_BOARD],
    gameActive: true,
    scores,
    soundEnabled,
    isAiThinking: false,
    gameMode: mode,
    lastResult: null
  };
}

export function evaluateBoard(board) {
  for (const condition of WINNING_CONDITIONS) {
    const [a, b, c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningLine: condition,
        isDraw: false
      };
    }
  }

  return {
    winner: null,
    winningLine: [],
    isDraw: !board.includes('')
  };
}

export function getScoreKey(player, mode) {
  if (player === PLAYERS.X) return 'X';
  return mode === GAME_MODES.AI ? 'AI' : 'O';
}

export function getPlayerLabel(player, mode) {
  if (player === PLAYERS.X) return 'X';
  return mode === GAME_MODES.AI ? 'AI' : 'O';
}

export function getWinnerPhrase(player, mode) {
  if (player === PLAYERS.O && mode === GAME_MODES.AI) return 'AI Player';
  return `Player ${getPlayerLabel(player, mode)}`;
}

export function nextPlayer(player) {
  return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
}

export function playMove(state, index) {
  if (
    !state.gameActive ||
    state.isAiThinking ||
    index < 0 ||
    index >= state.gameBoard.length ||
    state.gameBoard[index] !== ''
  ) {
    return state;
  }

  const gameBoard = [...state.gameBoard];
  gameBoard[index] = state.currentPlayer;

  const evaluation = evaluateBoard(gameBoard);
  const scores = cloneScores(state.scores);

  if (evaluation.winner) {
    scores[state.gameMode][getScoreKey(evaluation.winner, state.gameMode)] += 1;

    return {
      ...state,
      gameBoard,
      scores,
      gameActive: false,
      isAiThinking: false,
      lastResult: evaluation
    };
  }

  if (evaluation.isDraw) {
    return {
      ...state,
      gameBoard,
      gameActive: false,
      isAiThinking: false,
      lastResult: evaluation
    };
  }

  return {
    ...state,
    gameBoard,
    currentPlayer: nextPlayer(state.currentPlayer),
    lastResult: null
  };
}

export function resetGameState(state) {
  return {
    ...createInitialGameState({
      mode: state.gameMode,
      soundEnabled: state.soundEnabled,
      scores: cloneScores(state.scores)
    })
  };
}

export function resetScoresState(state) {
  return {
    ...state,
    scores: createInitialScores()
  };
}

export function switchModeState(state, mode) {
  return resetGameState({
    ...state,
    gameMode: mode
  });
}

function cloneScores(scores) {
  return {
    ai: { X: scores.ai?.X || 0, AI: scores.ai?.AI || 0 },
    pvp: { X: scores.pvp?.X || 0, O: scores.pvp?.O || 0 }
  };
}

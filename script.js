// Game constants and state helpers
const PLAYERS = {
  X: 'X',
  O: 'O'
};

const GAME_MODES = {
  AI: 'ai',
  PVP: 'pvp'
};

const EMPTY_BOARD = Object.freeze(['', '', '', '', '', '', '', '', '']);

const WINNING_CONDITIONS = Object.freeze([
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]);

function createInitialScores() {
  return {
    ai: { X: 0, AI: 0 },
    pvp: { X: 0, O: 0 }
  };
}

function createInitialGameState({
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

function evaluateBoard(board) {
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

function getScoreKey(player, mode) {
  if (player === PLAYERS.X) return 'X';
  return mode === GAME_MODES.AI ? 'AI' : 'O';
}

function getPlayerLabel(player, mode) {
  if (player === PLAYERS.X) return 'X';
  return mode === GAME_MODES.AI ? 'AI' : 'O';
}

function getWinnerPhrase(player, mode) {
  if (player === PLAYERS.O && mode === GAME_MODES.AI) return 'AI Player';
  return `Player ${getPlayerLabel(player, mode)}`;
}

function nextPlayer(player) {
  return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
}

function playMove(state, index) {
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

function resetGameState(state) {
  return {
    ...createInitialGameState({
      mode: state.gameMode,
      soundEnabled: state.soundEnabled,
      scores: cloneScores(state.scores)
    })
  };
}

function resetScoresState(state) {
  return {
    ...state,
    scores: createInitialScores()
  };
}

function switchModeState(state, mode) {
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

// AI move selection
function findBestMove(board, player) {
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

// Preference storage
const STORAGE_KEYS = {
  theme: 'ttt-theme',
  sound: 'ttt-sound',
  mode: 'ttt-mode',
  scores: 'ttt-scores'
};

function loadPreferences(storage = window.localStorage) {
  const theme = storage.getItem(STORAGE_KEYS.theme) || 'dark';
  const sound = storage.getItem(STORAGE_KEYS.sound);
  const mode = normalizeMode(storage.getItem(STORAGE_KEYS.mode));

  return {
    theme,
    soundEnabled: sound === null ? true : sound === 'true',
    mode,
    scores: loadScores(storage.getItem(STORAGE_KEYS.scores))
  };
}

function savePreferences(
  storage = window.localStorage,
  { theme, soundEnabled, mode, scores }
) {
  storage.setItem(STORAGE_KEYS.theme, theme);
  storage.setItem(STORAGE_KEYS.sound, String(soundEnabled));
  storage.setItem(STORAGE_KEYS.mode, normalizeMode(mode));
  storage.setItem(STORAGE_KEYS.scores, JSON.stringify(scores));
}

function loadScores(value) {
  const defaults = createInitialScores();

  if (!value) return defaults;

  try {
    const parsed = JSON.parse(value);

    return {
      ai: {
        X: parsed.ai?.X || 0,
        AI: parsed.ai?.AI || 0
      },
      pvp: {
        X: parsed.pvp?.X || 0,
        O: parsed.pvp?.O ?? parsed.pvp?.Y ?? 0
      }
    };
  } catch {
    return defaults;
  }
}

function normalizeMode(mode) {
  return mode === GAME_MODES.PVP ? GAME_MODES.PVP : GAME_MODES.AI;
}

// UI/controller constants
const AI_MOVE_DELAY_MS = 600;
const HINT_DURATION_MS = 1000;

const MARKUP = {
  X: '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><line class="stroke" x1="20" y1="20" x2="80" y2="80"/><line class="stroke" x1="80" y1="20" x2="20" y2="80"/></svg>',
  O: '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle class="stroke" cx="50" cy="50" r="35"/></svg>'
};

class TicTacToeController {
  constructor() {
    const preferences = loadPreferences();

    this.state = createInitialGameState({
      mode: preferences.mode,
      soundEnabled: preferences.soundEnabled,
      scores: preferences.scores
    });
    this.currentTheme = preferences.theme;
    this.audioCtx = null;
    this.aiMoveTimeoutId = null;
    this.hintTimeoutId = null;
    this.gameToken = 0;

    this.elements = {
      board: document.getElementById('board'),
      cells: [...document.querySelectorAll('.cell')],
      statusDisplay: document.getElementById('status'),
      resetButton: document.getElementById('reset'),
      resetScoresButton: document.getElementById('reset-scores'),
      hintButton: document.getElementById('hint'),
      xScoreElement: document.getElementById('x-score'),
      oScoreElement: document.getElementById('o-score'),
      winModal: document.getElementById('win-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalMessage: document.getElementById('modal-message'),
      closeModalButton: document.getElementById('close-modal'),
      lightThemeBtn: document.getElementById('light-theme'),
      darkThemeBtn: document.getElementById('dark-theme'),
      soundToggleBtn: document.getElementById('sound-toggle'),
      aiModeBtn: document.getElementById('ai-mode'),
      pvpModeBtn: document.getElementById('pvp-mode'),
      xScoreBox: document.getElementById('x-score-box'),
      oScoreBox: document.getElementById('o-score-box'),
      xLabel: document.getElementById('x-label'),
      oLabel: document.getElementById('o-label'),
      confetti: document.getElementById('confetti')
    };

    this.applyTheme(this.currentTheme);
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    this.elements.board.addEventListener('click', (event) => {
      const cell = event.target.closest('.cell');
      if (!cell) return;
      this.handleCellSelection(Number(cell.dataset.index));
    });

    this.elements.resetButton.addEventListener('click', () => this.resetGame());
    this.elements.resetScoresButton.addEventListener('click', () => this.resetScores());
    this.elements.hintButton.addEventListener('click', () => this.showHint());
    this.elements.closeModalButton.addEventListener('click', () => this.closeModal());
    this.elements.winModal.addEventListener('click', (event) => {
      if (event.target === this.elements.winModal) this.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.elements.winModal.classList.contains('active')) {
        this.closeModal();
      }
    });

    this.elements.lightThemeBtn.addEventListener('click', () => this.switchTheme('light'));
    this.elements.darkThemeBtn.addEventListener('click', () => this.switchTheme('dark'));
    this.elements.soundToggleBtn.addEventListener('click', () => this.toggleSound());
    this.elements.aiModeBtn.addEventListener('click', () => this.switchMode(GAME_MODES.AI));
    this.elements.pvpModeBtn.addEventListener('click', () => this.switchMode(GAME_MODES.PVP));
  }

  handleCellSelection(index) {
    if (this.state.isAiThinking || !this.state.gameActive) return;
    this.playAt(index);
  }

  playAt(index) {
    const previousState = this.state;
    const nextState = playMove(this.state, index);

    if (nextState === previousState) return;

    this.state = nextState;
    this.playSynthSound('move');
    this.render();
    this.handleRoundResult(previousState);
    this.persistPreferences();
    this.scheduleAiMove();
  }

  handleRoundResult(previousState) {
    if (previousState.lastResult === this.state.lastResult || this.state.gameActive) return;

    const result = this.state.lastResult;

    if (result.winner) {
      const winnerPhrase = getWinnerPhrase(result.winner, this.state.gameMode);
      const isAiWin = result.winner === PLAYERS.O && this.state.gameMode === GAME_MODES.AI;

      this.playSynthSound('win');
      this.showModal(
        `${winnerPhrase} Wins!`,
        isAiWin ? 'Sorry for your loss!' : 'Congratulations on your victory!',
        true
      );
      return;
    }

    if (result.isDraw) {
      this.playSynthSound('draw');
      this.showModal("It's a Draw!", 'No one wins this round!');
    }
  }

  scheduleAiMove() {
    this.clearPendingAiMove();

    if (
      this.state.gameMode !== GAME_MODES.AI ||
      this.state.currentPlayer !== PLAYERS.O ||
      !this.state.gameActive
    ) {
      return;
    }

    this.state = {
      ...this.state,
      isAiThinking: true
    };
    this.render();

    const moveToken = this.gameToken;
    this.aiMoveTimeoutId = window.setTimeout(() => {
      this.aiMoveTimeoutId = null;
      if (moveToken !== this.gameToken) return;

      const bestMove = findBestMove(this.state.gameBoard, PLAYERS.O);
      this.state = {
        ...this.state,
        isAiThinking: false
      };

      if (bestMove === null) {
        this.render();
        return;
      }

      this.playAt(bestMove);
    }, AI_MOVE_DELAY_MS);
  }

  resetGame() {
    this.clearPendingAiMove();
    this.clearHint();
    this.gameToken += 1;
    this.state = resetGameState(this.state);
    this.closeModal();
    this.render();
    this.persistPreferences();
  }

  resetScores() {
    this.state = resetScoresState(this.state);
    this.render();
    this.persistPreferences();
  }

  switchMode(mode) {
    if (mode === this.state.gameMode) return;
    this.clearPendingAiMove();
    this.clearHint();
    this.gameToken += 1;
    this.state = switchModeState(this.state, mode);
    this.closeModal();
    this.render();
    this.persistPreferences();
  }

  switchTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.renderThemeControls();
    this.persistPreferences();
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }

  toggleSound() {
    this.state = {
      ...this.state,
      soundEnabled: !this.state.soundEnabled
    };
    this.renderSoundToggle();
    this.persistPreferences();
  }

  showHint() {
    if (!this.state.gameActive || this.state.isAiThinking) return;

    const hintIndex = findBestMove(this.state.gameBoard, this.state.currentPlayer);
    if (hintIndex === null) return;

    this.clearHint();
    this.elements.cells[hintIndex].classList.add('hinted');
    this.hintTimeoutId = window.setTimeout(() => this.clearHint(), HINT_DURATION_MS);
  }

  clearHint() {
    if (this.hintTimeoutId !== null) {
      window.clearTimeout(this.hintTimeoutId);
      this.hintTimeoutId = null;
    }

    this.elements.cells.forEach((cell) => cell.classList.remove('hinted'));
  }

  clearPendingAiMove() {
    if (this.aiMoveTimeoutId !== null) {
      window.clearTimeout(this.aiMoveTimeoutId);
      this.aiMoveTimeoutId = null;
    }
  }

  render() {
    this.renderCells();
    this.renderStatus();
    this.renderScores();
    this.renderModeControls();
    this.renderThemeControls();
    this.renderSoundToggle();
    this.renderActivePlayer();
  }

  renderCells() {
    const winningLine = this.state.lastResult?.winningLine || [];

    this.elements.cells.forEach((cell, index) => {
      const player = this.state.gameBoard[index];
      const isPlayable = this.state.gameActive && !this.state.isAiThinking && player === '';
      const renderedPlayer = cell.dataset.renderedPlayer || '';

      if (renderedPlayer !== player) {
        cell.innerHTML = player ? MARKUP[player] : '';
        cell.dataset.renderedPlayer = player;
      }

      cell.classList.toggle('x', player === PLAYERS.X);
      cell.classList.toggle('o', player === PLAYERS.O);
      cell.classList.toggle('winner', winningLine.includes(index));
      cell.disabled = !isPlayable;
      cell.setAttribute('aria-label', this.getCellLabel(index, player));
    });
  }

  renderStatus() {
    if (this.state.lastResult?.winner) {
      this.elements.statusDisplay.textContent = `${getWinnerPhrase(
        this.state.lastResult.winner,
        this.state.gameMode
      )} wins!`;
      return;
    }

    if (this.state.lastResult?.isDraw) {
      this.elements.statusDisplay.textContent = "It's a draw!";
      return;
    }

    if (this.state.isAiThinking) {
      this.elements.statusDisplay.textContent = 'AI is thinking...';
      return;
    }

    this.elements.statusDisplay.textContent = `Player ${getPlayerLabel(
      this.state.currentPlayer,
      this.state.gameMode
    )}'s turn`;
  }

  renderScores() {
    const bucket = this.state.scores[this.state.gameMode];
    this.elements.xScoreElement.textContent = bucket.X;
    this.elements.oScoreElement.textContent = bucket[getScoreKey(PLAYERS.O, this.state.gameMode)];
    this.elements.xLabel.textContent = this.state.gameMode === GAME_MODES.AI ? 'You' : 'Player X';
    this.elements.oLabel.textContent = this.state.gameMode === GAME_MODES.AI ? 'AI' : 'Player O';
  }

  renderModeControls() {
    this.elements.aiModeBtn.classList.toggle('active', this.state.gameMode === GAME_MODES.AI);
    this.elements.pvpModeBtn.classList.toggle('active', this.state.gameMode === GAME_MODES.PVP);
    this.elements.aiModeBtn.setAttribute('aria-pressed', String(this.state.gameMode === GAME_MODES.AI));
    this.elements.pvpModeBtn.setAttribute('aria-pressed', String(this.state.gameMode === GAME_MODES.PVP));
  }

  renderThemeControls() {
    this.elements.lightThemeBtn.classList.toggle('active', this.currentTheme === 'light');
    this.elements.darkThemeBtn.classList.toggle('active', this.currentTheme === 'dark');
    this.elements.lightThemeBtn.setAttribute('aria-pressed', String(this.currentTheme === 'light'));
    this.elements.darkThemeBtn.setAttribute('aria-pressed', String(this.currentTheme === 'dark'));
  }

  renderSoundToggle() {
    const icon = this.elements.soundToggleBtn.querySelector('.sound-icon');
    icon.className = this.state.soundEnabled
      ? 'sound-icon fas fa-volume-up'
      : 'sound-icon fas fa-volume-mute';
    this.elements.soundToggleBtn.setAttribute(
      'aria-label',
      this.state.soundEnabled ? 'Turn sound off' : 'Turn sound on'
    );
    this.elements.soundToggleBtn.setAttribute('aria-pressed', String(this.state.soundEnabled));
  }

  renderActivePlayer() {
    this.elements.xScoreBox.classList.toggle('active', this.state.currentPlayer === PLAYERS.X);
    this.elements.oScoreBox.classList.toggle('active', this.state.currentPlayer === PLAYERS.O);
  }

  getCellLabel(index, player) {
    if (player) return `Cell ${index + 1}, ${player}`;
    return `Cell ${index + 1}, empty`;
  }

  persistPreferences() {
    savePreferences(window.localStorage, {
      theme: this.currentTheme,
      soundEnabled: this.state.soundEnabled,
      mode: this.state.gameMode,
      scores: this.state.scores
    });
  }

  playSynthSound(type) {
    if (!this.state.soundEnabled) return;

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioCtx = this.audioCtx;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const sound = {
      move: { wave: 'sine', start: 440, end: 440, duration: 0.1 },
      win: { wave: 'triangle', start: 523.25, end: 880, duration: 0.5 },
      draw: { wave: 'sawtooth', start: 220, end: 220, duration: 0.4 }
    }[type];

    oscillator.type = sound.wave;
    oscillator.frequency.setValueAtTime(sound.start, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(sound.end, audioCtx.currentTime + sound.duration);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + sound.duration);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + sound.duration);
  }

  launchConfetti() {
    const colors = ['#60a5fa', '#f87171', '#fbbf24', '#4ade80'];
    const container = this.elements.confetti;
    container.innerHTML = '';

    for (let index = 0; index < 30; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      container.appendChild(piece);
    }
  }

  showModal(title, message, celebrate = false) {
    this.elements.modalTitle.textContent = title;
    this.elements.modalMessage.textContent = message;
    this.elements.confetti.innerHTML = '';

    if (celebrate) this.launchConfetti();

    this.elements.winModal.classList.add('active');
    this.elements.closeModalButton.focus();
  }

  closeModal() {
    this.elements.winModal.classList.remove('active');
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Service worker support is optional for gameplay. */
    });
  });
}

new TicTacToeController();

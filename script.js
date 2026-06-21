const GAME_CONFIG = {
    PLAYERS: {
        X: 'X',
        O: 'O'
    },
    WINNING_CONDITIONS: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ]
};

class TicTacToe {
    constructor() {
        this.state = {
            currentPlayer: GAME_CONFIG.PLAYERS.X,
            gameBoard: ['', '', '', '', '', '', '', '', ''],
            gameActive: true,
            scores: { [GAME_CONFIG.PLAYERS.X]: 0, [GAME_CONFIG.PLAYERS.O]: 0 },
            soundEnabled: true,
            isAiThinking: false,
            gameMode: 'ai'
        };

        this.winningConditions = GAME_CONFIG.WINNING_CONDITIONS;
        this.audioCtx = null;
        this.loadPreferences();

        this.elements = {
            board: document.getElementById('board'),
            cells: document.querySelectorAll('.cell'),
            statusDisplay: document.getElementById('status'),
            resetButton: document.getElementById('reset'),
            hintButton:document.getElementById('hint'),
            xScoreElement: document.getElementById('x-score'),
            oScoreElement:document.getElementById('o-score'),
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
            confetti: document.getElementById('confetti')
        };

        this.switchTheme(this.pendingTheme);
        this.elements.soundToggleBtn.querySelector('i').className =
            this.state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        this.elements.aiModeBtn.classList.toggle('active', this.state.gameMode === 'ai');
        this.elements.pvpModeBtn.classList.toggle('active', this.state.gameMode === 'pvp');
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.state.currentPlayer = GAME_CONFIG.PLAYERS.X;
        this.state.gameBoard = ['', '', '', '', '', '', '', '', ''];
        this.state.gameActive = true;
        this.state.isAiThinking = false;
        this.elements.statusDisplay.textContent = `Player ${this.state.currentPlayer}'s turn`;
        this.elements.cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('x', 'o', 'winner');
        });
        this.updateActivePlayerUI();
        this.updateScore();
    }

    loadPreferences() {
        const theme = localStorage.getItem('ttt-theme') || 'dark';
        const sound = localStorage.getItem('ttt-sound');
        const mode = localStorage.getItem('ttt-mode') || 'ai';
        const scores = localStorage.getItem('ttt-scores');
        this.state.soundEnabled = sound === null ? true : sound === 'true';
        this.state.gameMode = mode;
        if (scores) {
            try {
                this.state.scores = JSON.parse(scores);
            } catch {
                /* ignore malformed stored scores */
            }
        }
        this.pendingTheme = theme;
    }

    savePreferences() {
        localStorage.setItem('ttt-theme', document.body.className.replace('theme-', ''));
        localStorage.setItem('ttt-sound', String(this.state.soundEnabled));
        localStorage.setItem('ttt-mode', this.state.gameMode);
        localStorage.setItem('ttt-scores', JSON.stringify(this.state.scores));
    }

    setupEventListeners() {
        this.elements.board.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e);
            }
        });
        this.elements.resetButton.addEventListener('click', () => this.resetGame());
        this.elements.hintButton.addEventListener('click', () => this.showHint());
        this.elements.closeModalButton.addEventListener('click', () => this.closeModal());
        this.elements.lightThemeBtn.addEventListener('click', () => this.switchTheme('light'));
        this.elements.darkThemeBtn.addEventListener('click', () => this.switchTheme('dark'));
        this.elements.soundToggleBtn.addEventListener('click', () => {
            this.state.soundEnabled = !this.state.soundEnabled;
            const icon = this.elements.soundToggleBtn.querySelector('i');
            icon.className = this.state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            this.savePreferences();
        });
        this.elements.aiModeBtn.addEventListener('click', () => this.switchMode('ai'));
        this.elements.pvpModeBtn.addEventListener('click', () => this.switchMode('pvp'));
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
        if (type === 'move') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        } else if (type === 'win') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        } else if (type === 'draw') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        }
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.index);
        if (this.state.gameBoard[clickedCellIndex] !== '' || !this.state.gameActive || this.state.isAiThinking) return;
        this.playSynthSound('move');
        this.updateCell(clickedCell, clickedCellIndex);
        this.checkResult();
    }

    updateCell(cell, index) {
        this.state.gameBoard[index] = this.state.currentPlayer;
        cell.innerHTML = this.state.currentPlayer === GAME_CONFIG.PLAYERS.X
            ? '<svg viewBox="0 0 100 100"><line class="stroke" x1="20" y1="20" x2="80" y2="80"/><line class="stroke" x1="80" y1="20" x2="20" y2="80"/></svg>'
            : '<svg viewBox="0 0 100 100"><circle class="stroke" cx="50" cy="50" r="35"/></svg>';
        cell.classList.add(this.state.currentPlayer.toLowerCase());
    }

    checkResult() {
        let roundWon = false;
        let winningLine = [];
        for (const condition of this.winningConditions) {
            const [a, b, c] = condition;
            if (this.state.gameBoard[a] && 
                this.state.gameBoard[a] === this.state.gameBoard[b] && 
                this.state.gameBoard[a] === this.state.gameBoard[c]) {
                roundWon = true;
                winningLine = condition;
                break;
            }
        }
        if (roundWon) {
            this.playSynthSound('win');
            this.elements.statusDisplay.textContent = `🎉 Player ${this.state.currentPlayer} wins!`;
            this.state.gameActive = false;
            winningLine.forEach(index => this.elements.cells[index].classList.add('winner'));
            this.state.scores[this.state.currentPlayer]++;
            this.updateScore();
            this.savePreferences();
            this.showModal(`Player ${this.state.currentPlayer} Wins!`, `Congratulations on your victory!`, true);
            return;
        }
        if (!this.state.gameBoard.includes('')) {
            this.playSynthSound('draw');
            this.elements.statusDisplay.textContent = "🤝 It's a draw!";
            this.state.gameActive = false;
            this.showModal("It's a Draw!", "No one wins this round!");
            return;
        }
        this.state.currentPlayer = this.state.currentPlayer === GAME_CONFIG.PLAYERS.X ? GAME_CONFIG.PLAYERS.O : GAME_CONFIG.PLAYERS.X;
        this.elements.statusDisplay.textContent = `Player ${this.state.currentPlayer}'s turn`;
        this.updateActivePlayerUI();
        if (this.state.gameMode === 'ai' && this.state.currentPlayer === GAME_CONFIG.PLAYERS.O && this.state.gameActive) {
            this.state.isAiThinking = true;
            setTimeout(() => this.makeAiMove(), 600);
        }
    }

    makeAiMove() {
        this.state.isAiThinking = false;
        const bestMove = this.findBestMove(GAME_CONFIG.PLAYERS.O);
        if (bestMove !== null) {
            const cell = this.elements.cells[bestMove];
            this.handleCellClick({ target: cell });
        }
    }

    findBestMove(player) {
        const isO = player === GAME_CONFIG.PLAYERS.O;
        let bestScore = isO ? -Infinity : Infinity;
        let move = null;
        for (let i = 0; i < 9; i++) {
            if (this.state.gameBoard[i] === '') {
                this.state.gameBoard[i] = player;
                let score = this.minimax(this.state.gameBoard, 0, !isO);
                this.state.gameBoard[i] = '';
                if (isO ? score > bestScore : score < bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinnerForMinimax(board);
        if (winner !== null) {
            return winner === GAME_CONFIG.PLAYERS.O ? 10 : winner === GAME_CONFIG.PLAYERS.X ? -10 : 0;
        }
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = GAME_CONFIG.PLAYERS.O;
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = GAME_CONFIG.PLAYERS.X;
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWinnerForMinimax(board) {
        for (const condition of this.winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (!board.includes('')) return 'draw';
        return null;
    }

    resetGame() { this.init(); }

    showHint() {
        if (!this.state.gameActive || this.state.isAiThinking) return;
        const hintIndex = this.findBestMove(this.state.currentPlayer);
        if (hintIndex !== null) {
            const targetCell = this.elements.cells[hintIndex];
            targetCell.style.boxShadow = '0 0 15px #fbbf24';
            targetCell.style.transform = 'scale(1.1)';
            setTimeout(() => {
                targetCell.style.boxShadow = '';
                targetCell.style.transform = '';
            }, 1000);
        }
    }

    updateScore() {
        this.elements.xScoreElement.textContent = this.state.scores.X;
        this.elements.oScoreElement.textContent = this.state.scores.O;
    }

    updateActivePlayerUI() {
        this.elements.xScoreBox.classList.toggle('active', this.state.currentPlayer === GAME_CONFIG.PLAYERS.X);
        this.elements.oScoreBox.classList.toggle('active', this.state.currentPlayer === GAME_CONFIG.PLAYERS.O);
    }

    launchConfetti() {
        const colors = ['#60a5fa', '#f87171', '#fbbf24', '#4ade80'];
        const container = this.elements.confetti;
        container.innerHTML = '';
        for (let i = 0; i < 30; i++) {
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
        if (celebrate) this.launchConfetti();
        else this.elements.confetti.innerHTML = '';
        this.elements.winModal.classList.add('active');
    }

    closeModal() { this.elements.winModal.classList.remove('active'); }

    switchTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.elements.lightThemeBtn.classList.remove('active');
        this.elements.darkThemeBtn.classList.remove('active');
        if (theme === 'light') this.elements.lightThemeBtn.classList.add('active');
        else this.elements.darkThemeBtn.classList.add('active');
        this.savePreferences();
    }

    switchMode(mode) {
        if (mode === this.state.gameMode) return;
        this.state.gameMode = mode;
        this.elements.aiModeBtn.classList.toggle('active', mode === 'ai');
        this.elements.pvpModeBtn.classList.toggle('active', mode === 'pvp');
        this.savePreferences();
        this.resetGame();
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

new TicTacToe();
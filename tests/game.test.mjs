import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAYERS,
  createInitialGameState,
  evaluateBoard,
  playMove,
  resetGameState,
  getScoreKey,
  getPlayerLabel
} from '../js/game.js';
import { findBestMove } from '../js/ai.js';

test('evaluateBoard returns winner, line, and draw state', () => {
  assert.deepEqual(
    evaluateBoard(['X', 'X', 'X', '', '', '', '', '', '']),
    { winner: 'X', winningLine: [0, 1, 2], isDraw: false }
  );

  assert.deepEqual(
    evaluateBoard(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']),
    { winner: null, winningLine: [], isDraw: true }
  );
});

test('playMove applies a legal move and advances the active player', () => {
  const state = createInitialGameState({ mode: 'pvp' });
  const next = playMove(state, 4);

  assert.equal(next.gameBoard[4], PLAYERS.X);
  assert.equal(next.currentPlayer, PLAYERS.O);
  assert.equal(next.gameActive, true);
  assert.equal(next.lastResult, null);
});

test('playMove records a win, updates scores, and blocks later moves', () => {
  const state = {
    ...createInitialGameState({ mode: 'pvp' }),
    gameBoard: ['X', 'X', '', 'O', 'O', '', '', '', ''],
    currentPlayer: PLAYERS.X
  };

  const won = playMove(state, 2);
  const blocked = playMove(won, 5);

  assert.equal(won.gameActive, false);
  assert.equal(won.lastResult.winner, PLAYERS.X);
  assert.deepEqual(won.lastResult.winningLine, [0, 1, 2]);
  assert.equal(won.scores.pvp.X, 1);
  assert.deepEqual(blocked, won);
});

test('resetGameState preserves scores, mode, and sound preference', () => {
  const state = {
    ...createInitialGameState({ mode: 'ai' }),
    soundEnabled: false,
    scores: {
      ai: { X: 2, AI: 3 },
      pvp: { X: 4, O: 5 }
    }
  };

  const reset = resetGameState(state);

  assert.equal(reset.gameMode, 'ai');
  assert.equal(reset.soundEnabled, false);
  assert.deepEqual(reset.scores, state.scores);
  assert.deepEqual(reset.gameBoard, ['', '', '', '', '', '', '', '', '']);
});

test('AI chooses a winning move and player labels match game mode', () => {
  const board = ['O', 'O', '', 'X', 'X', '', '', '', ''];

  assert.equal(findBestMove(board, PLAYERS.O), 2);
  assert.equal(getScoreKey(PLAYERS.O, 'ai'), 'AI');
  assert.equal(getScoreKey(PLAYERS.O, 'pvp'), 'O');
  assert.equal(getPlayerLabel(PLAYERS.O, 'ai'), 'AI');
  assert.equal(getPlayerLabel(PLAYERS.O, 'pvp'), 'O');
});

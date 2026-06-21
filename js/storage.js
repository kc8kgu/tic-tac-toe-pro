import { GAME_MODES, createInitialScores } from './game.js';

const STORAGE_KEYS = {
  theme: 'ttt-theme',
  sound: 'ttt-sound',
  mode: 'ttt-mode',
  scores: 'ttt-scores'
};

export function loadPreferences(storage = window.localStorage) {
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

export function savePreferences(
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

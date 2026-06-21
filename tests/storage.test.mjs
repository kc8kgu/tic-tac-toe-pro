import test from 'node:test';
import assert from 'node:assert/strict';

import { loadPreferences, savePreferences } from '../js/storage.js';

test('loadPreferences normalizes stored preferences and legacy pvp score', () => {
  const storage = new MapStorage({
    'ttt-theme': 'light',
    'ttt-sound': 'false',
    'ttt-mode': 'pvp',
    'ttt-scores': JSON.stringify({
      ai: { X: 2, AI: 1 },
      pvp: { X: 4, Y: 3 }
    })
  });

  assert.deepEqual(loadPreferences(storage), {
    theme: 'light',
    soundEnabled: false,
    mode: 'pvp',
    scores: {
      ai: { X: 2, AI: 1 },
      pvp: { X: 4, O: 3 }
    }
  });
});

test('savePreferences writes the current theme, sound, mode, and scores', () => {
  const storage = new MapStorage();
  const scores = {
    ai: { X: 1, AI: 2 },
    pvp: { X: 3, O: 4 }
  };

  savePreferences(storage, {
    theme: 'dark',
    soundEnabled: true,
    mode: 'ai',
    scores
  });

  assert.equal(storage.getItem('ttt-theme'), 'dark');
  assert.equal(storage.getItem('ttt-sound'), 'true');
  assert.equal(storage.getItem('ttt-mode'), 'ai');
  assert.deepEqual(JSON.parse(storage.getItem('ttt-scores')), scores);
});

class MapStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

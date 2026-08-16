import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { generateCursorColor } from './colors.js';

void describe('generateCursorColor', () => {
  void it('returns a color that is not already used when one is available', () => {
    const usedColors = new Set<string>(['#2563eb']);

    const color = generateCursorColor(usedColors);

    assert.match(color, /^#[0-9a-f]{6}$/iu);
    assert.notEqual(color, '#2563eb');
  });
});

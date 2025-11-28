'use strict';
const assert = require('assert');

module.exports = function (text, opts) {
  const ch = text[0];
  assert(ch, 'expect a string');

  const fontSize = opts.fontSize;
  const font = (Array.isArray(opts.font))
    ? opts.font[Math.floor(Math.random() * opts.font.length)]
    : opts.font;
  const fontScale = fontSize / font.unitsPerEm;

  const glyph = font.charToGlyph(ch);
  const width = glyph.advanceWidth ? glyph.advanceWidth * fontScale : 0;
  const left = opts.x - (width / 2);

  const height = (font.ascender + font.descender) * fontScale;
  const top = opts.y + (height / 2);
  const path = glyph.getPath(left, top, fontSize);

  return path;
};

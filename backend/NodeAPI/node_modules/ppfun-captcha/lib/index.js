'use strict';

const chToPath = require('./ch-to-path');
const randomizePath = require('./randomize-path');
const random = require('./random');
const optionMngr = require('./option-manager');

const opts = optionMngr.options;

function shuffleArray(array) {
  let count = array.length,
    randomnumber,
    temp;
  while( count ){
    randomnumber = Math.random() * count-- | 0;
    temp = array[count];
    array[count] = array[randomnumber];
    array[randomnumber] = temp
  }
}

function mergePaths(paths) {
  if (!paths.length) {
    return [];
  }
  const out = paths[0];
  for (let i = 1; i < paths.length; i += 1) {
    out.commands = out.commands.concat(
      paths[i].commands,
    );
  }
  return out;
}

const getTextPath = function (text, width, height, options) {
  const len = text.length;
  const spacing = (width - 2) / (len + 1);
  let i = -1;
  const out = [];

  while (++i < len) {
    const x = spacing * (i + 1);
    const y = height / 2;
    const charPath = chToPath(text[i], Object.assign({x, y}, options));
    out.push(charPath);
  }

  return out;
};

const createSvg = function (paths, options) {
  const width = options.width;
  const height = options.height;
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  const start = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0,0,${width},${height}">`;
  const bgRect = options.background ? `<rect width="100%" height="100%" fill="${options.background}"/>` : '';
  const path = paths.map(
    (p) => `<path fill="${options.fill}" stroke="${options.stroke}" ${(options.style) ? `style="${options.style}"` : ''}${p.attributes ? ` ${p.attributes}` : ''} d="${p.toPathData()}">${p.innerSVG || ''}</path>`
  ).join('');
  return `${start}${bgRect}${path}</svg>`;
};

const createCaptcha = function (text, options) {
  const width = options.width;
  const height = options.height;

  /* Create character paths and order them randomly */
  let paths = [].concat(getTextPath(text, width, height, options));
  shuffleArray(paths);
  /*
   * 1. join paths together
   * 2. randomize nodes
   * 3. randomly split path
   * 4. remove gaps with random lines
   */
  paths = [randomizePath(mergePaths(paths), options)];

  if (typeof options.filter === 'function') {
    paths = options.filter(paths, options);
  }

  return createSvg(paths, options);
};

const create = function (options) {
  options = Object.assign({}, opts, options);

  const text = random.captchaText(options);
  const data = createCaptcha(text, options);
  return {text, data};
};

const createMathExpr = function (options) {
  options = Object.assign({}, opts, options);

  const expr = random.mathExpr(options.mathMin, options.mathMax, options.mathOperator);
  const text = expr.text;
  const data = createCaptcha(expr.equation, options);
  return {text, data};
};

module.exports.create = create;
module.exports.createMathExpr = createMathExpr;
module.exports.createCaptcha = function (text, options) {
  options = Object.assign({}, opts, options);
  return createCaptcha(text, options);
}
module.exports.options = opts;
module.exports.loadFont = optionMngr.loadFont;

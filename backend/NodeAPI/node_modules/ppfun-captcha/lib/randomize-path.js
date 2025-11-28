'use strict';
const assert = require('assert');

function rndPathCmd(cmd, deviation) {
  const r = (Math.random() * deviation * 2) - deviation;

  switch (cmd.type) {
    case 'M':
    case 'L':
      cmd.x += r;
      cmd.y += r;
      break;
    case 'Q':
    case 'C':
      cmd.x += r;
      cmd.y += r;
      cmd.x1 += r;
      cmd.y1 += r;
      break;
    default:
      // Close path cmd
      break;
  }

  return cmd;
}

// https://riptutorial.com/zh-CN/html5-canvas/example/19077/%E5%9C%A8%E4%BD%8D%E7%BD%AE%E6%8B%86%E5%88%86%E8%B4%9D%E5%A1%9E%E5%B0%94%E6%9B%B2%E7%BA%BF
function splitQuadraticBezier(position, x1, y1, x2, y2, x3, y3) {
  let v1, v2, v3, retPoints, i, c;

  if (position <= 0 || position >= 1) {
    throw new RangeError('spliteCurveAt requires position > 0 && position < 1');
  }

  retPoints = []; // Array of coordinates
  i = 0;
  v1 = {};
  v2 = {};
  v3 = {};
  v1.x = x1;
  v1.y = y1;
  v2.x = x2;
  v2.y = y2;
  v3.x = x3;
  v3.y = y3;

  c = position;
  retPoints[i++] = v1.x;  // Start point
  retPoints[i++] = v1.y;
  retPoints[i++] = (v1.x += (v2.x - v1.x) * c);  // New control point for first curve
  retPoints[i++] = (v1.y += (v2.y - v1.y) * c);
  v2.x += (v3.x - v2.x) * c;
  v2.y += (v3.y - v2.y) * c;
  retPoints[i++] = v1.x + (v2.x - v1.x) * c;  // New end and start of first and second curves
  retPoints[i++] = v1.y + (v2.y - v1.y) * c;
  retPoints[i++] = v2.x;  // New control point for second curve
  retPoints[i++] = v2.y;
  retPoints[i++] = v3.x;  // New endpoint of second curve
  retPoints[i++] = v3.y;
  return retPoints;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomizePathNodes(commands, opts) {
  // 随机化路径节点
  // 规则：
  // 如果当前节点是 L(Line)，下一个节点也是 Line，那么随机插入一个中间点
  // 如果当前节点是 Q，且前节点为 L 或 M，那么拆分这个曲线
  const result = [];
  for (let i = 0; i < commands.length - 1; i++) {
    const command = commands[i];
    if (command.type === 'L') {
      const next = commands[i + 1];
      if (next.type === 'L' && Math.random() > opts.truncateLineProbability) {
        const r = randomRange(-0.1, 0.1);
        result.push(command);
        result.push({
          type: 'L',
          x: (command.x + next.x) / 2 + r,
          y: (command.y + next.y) / 2 + r
        });
      } else {
        result.push(command);
      }
    } else if (command.type === 'Q' && i >= 1) {
      const prev = commands[i - 1];
      if ((prev.type === 'L' || prev.type === 'M') && Math.random() > opts.truncateCurveProbability) {
        const p0_x = prev.x;
        const p0_y = prev.y;
        const r = randomRange(-0.1, 0.1);
        const cp_x = command.x1 + r;
        const cp_y = command.y1 + r;
        const p1_x = command.x + r;
        const p1_y = command.y + r;
        const newCurve = splitQuadraticBezier(randomRange(opts.truncateCurvePositionMin, opts.truncateCurvePositionMax), p0_x, p0_y, cp_x, cp_y, p1_x, p1_y);

        const q1 = {
          type: 'Q',
          x1: newCurve[2],
          y1: newCurve[3],
          x: newCurve[4],
          y: newCurve[5]
        };
        const l1 = {
          type: 'L',
          x: newCurve[4],
          y: newCurve[5]
        };
        const q2 = {
          type: 'Q',
          x1: newCurve[6],
          y1: newCurve[7],
          x: newCurve[8],
          y: newCurve[9]
        };
        const l2 = {
          type: 'L',
          x: newCurve[8],
          y: newCurve[9]
        };
        result.push(q1);
        // 插入一个 L 是因为貌似原本的 Path 里不会存在连续的 QQ
        // result.push(l1);
        result.push(q2);
        // Result.push(l2);
      }
    } else {
      result.push(command);
    }
  }
  return result;
}

/*
* Connect two points with a random path
* @param avgDist average distance between nodes
* @param qDist ratio of curves to lines
* @return array of path commands
*/
function connectPoints(xa, ya, xb, yb, qDist, avgDist, deviation) {
  const dist = distance(xa, ya, xb, yb);
  const min = avgDist / 15;
  const max = avgDist * 4;
  let drawDist = randomRange(min, max);
  let xp = xa;
  let yp = ya;
  const path = [];
  while (drawDist < dist) {
    const ratio = drawDist / dist;
    const x = (xb - xa) * ratio + xa + Math.random()
      * deviation * 2 - deviation;
    const y = (yb - ya) * ratio + ya + Math.random()
      * deviation * 2 - deviation;
    const point = {};
    if (Math.random() < qDist) {
      const x1 = randomRange(xp, x) + Math.random()
        * deviation - deviation / 2;
      const y1 = randomRange(yp, y) + Math.random()
        * deviation - deviation / 2;
      point.type = 'Q';
      point.x1 = x1;
      point.y1 = y1;
    } else {
      point.type = 'L';
    }
    point.x = x;
    point.y = y;
    path.push(point);
    xp = x;
    yp = y;
    drawDist += randomRange(min, max);
  }
  path.push({type: 'L', x: xb, y: yb});
  return path;
}

/*
* Removes gaps in path (Z and following M command)
*/
function removeGaps(commands, options) {
  if (!commands.length) {
    return commands;
  }
  let newCommands = [commands[0]];
  // Calculate metadata of path and filter zero-length paths
  let points = 0;
  let qCount = 0;
  let length = 0;
  let i = 1;
  while (i < commands.length) {
    const command = commands[i];
    const type = command.type;
    newCommands.push(command);
    if (type === 'L' || type === 'Q') {
      const prevCommand = commands[i - 1];
      if (prevCommand.x) {
        const dist = distance(
          prevCommand.x, prevCommand.y, command.x, command.y,
        );
        if (!dist) {
          newCommands.pop();
        } else {
          points += 1;
          if (type === 'Q') {
            qCount += 1;
          }
          length += dist;
        }
      }
    }
    i += 1;
  }
  const avgDist = length / points;
  const qDist = qCount / points;

  newCommands = [commands[0]];
  commands.push(commands[0]);
  i = 1;
  while (i < commands.length) {
    const command = commands[i];
    if (command.type === 'Z') {
      /*
      * Is it save to assume that every Z command is always
      * leaded and followed by a command with x,y?
      * Might not be save outside of glyphs.
      */
      const prevCommand = commands[i - 1];
      const nextCommand = commands[i += 1];
      const points = connectPoints(
        prevCommand.x, prevCommand.y,
        nextCommand.x, nextCommand.y,
        qDist, avgDist,
        options.connectionPathDeviation,
      );
      newCommands = newCommands.concat(points);
    } else {
      newCommands.push(command);
    }
    i += 1;
  }
  return newCommands;
}

/*
 * convert bezier curves in path to lines,
 * currently only simple lines to control points
 */
function convertToLines(commands) {
  if (!commands.length) {
    return commands;
  }
  let newCommands = [commands[0]];
  let i = 1;
  while (i < commands.length) {
    const command = commands[i];
    switch (command.type) {
      case 'Q': {
        newCommands.push({
          type: 'L',
          x: command.x1,
          y: command.y1,
        });
        newCommands.push({
          type: 'L',
          x: command.x,
          y: command.y,
        });
        break;
      }
      case 'C': {
        newCommands.push({
          type: 'L',
          x: command.x1,
          y: command.y1,
        });
        newCommands.push({
          type: 'L',
          x: command.x2,
          y: command.y2,
        });
        newCommands.push({
          type: 'L',
          x: command.x,
          y: command.y,
        });
        break;
      }
      default:
        newCommands.push(command);
        break;
    }
    i += 1;
  }
  return newCommands;
}

module.exports = function (path, opts) {
  // Randomize path commands
  path.commands.forEach((c) => rndPathCmd(c, opts.nodeDeviation));
  path.commands = randomizePathNodes(path.commands, opts);
  path.commands = removeGaps(path.commands, opts);
  path.commands = convertToLines(path.commands);
  return path;
};

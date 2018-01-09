// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const util = require('./util');
const {JSONToShape} = require('./shapes');

const INFINITE = 'infinite';
module.exports = function(snapshot, opts) {
  let s;
  if (opts == null) { opts = {}; }
  const shapes = ((() => {
    const result = [];
    for (s of Array.from(snapshot.shapes)) {       result.push(JSONToShape(s));
    }
    return result;
  })());
  let backgroundShapes = [];
  if (snapshot.backgroundShapes) {
    backgroundShapes = ((() => {
      const result1 = [];
      for (s of Array.from(snapshot.backgroundShapes)) {         result1.push(JSONToShape(s));
      }
      return result1;
    })());
  }

  if (opts.margin == null) { opts.margin = {top: 0, right: 0, bottom: 0, left: 0}; }
  const imageSize = snapshot.imageSize || {width: INFINITE, height: INFINITE};

  const colors = snapshot.colors || {background: 'transparent'};
  const allShapes = shapes.concat(backgroundShapes);

  const dummyCanvas = document.createElement('canvas');
  const ctx = dummyCanvas.getContext('2d');

  if (opts.rect) {
    opts.rect.x -= opts.margin.left;
    opts.rect.y -= opts.margin.top;
    opts.rect.width += opts.margin.left + opts.margin.right;
    opts.rect.height += opts.margin.top + opts.margin.bottom;
  } else {
    opts.rect = util.getDefaultImageRect(
      ((() => {
      const result2 = [];
      for (s of Array.from(allShapes)) {         result2.push(s.getBoundingRect(ctx));
      }
      return result2;
    })()),
      imageSize,
      opts.margin
    );
  }

  return util.renderShapesToSVG(
    backgroundShapes.concat(shapes), opts.rect, colors.background);
};

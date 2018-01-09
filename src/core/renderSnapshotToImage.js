/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const util = require('./util');
const {JSONToShape} = require('./shapes');

// mostly copypasta from LiterallyCanvas.coffee
const INFINITE = 'infinite';
const renderWatermark = function(ctx, image, scale) {
  if (!image.width) { return; }

  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  return ctx.restore();
};

module.exports = function(snapshot, opts) {
  let s;
  if (opts == null) { opts = {}; }
  if (opts.scale == null) { opts.scale = 1; }

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

  const watermarkCanvas = document.createElement('canvas');
  const watermarkCtx = watermarkCanvas.getContext('2d');

  if (opts.rect) {
    opts.rect.x -= opts.margin.left;
    opts.rect.y -= opts.margin.top;
    opts.rect.width += opts.margin.left + opts.margin.right;
    opts.rect.height += opts.margin.top + opts.margin.bottom;
  } else {
    opts.rect = util.getDefaultImageRect(
      ((() => {
      const result2 = [];
      for (s of Array.from(allShapes)) {         result2.push(s.getBoundingRect(watermarkCtx));
      }
      return result2;
    })()),
      imageSize,
      opts.margin
    );
  }

  watermarkCanvas.width = opts.rect.width * opts.scale;
  watermarkCanvas.height = opts.rect.height * opts.scale;
  watermarkCtx.fillStyle = colors.background;
  watermarkCtx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);

  if (!(opts.rect.width && opts.rect.height)) {
    return null;
  }

  if (opts.watermarkImage) {
    renderWatermark(watermarkCtx, opts.watermarkImage, opts.watermarkScale);
  }

  return util.combineCanvases(
    watermarkCanvas,
    util.renderShapes(backgroundShapes, opts.rect, opts.scale),
    util.renderShapes(shapes, opts.rect, opts.scale));
};
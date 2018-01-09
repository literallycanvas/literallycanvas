/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('./ie_customevent');
require('./ie_setLineDash');

const LiterallyCanvasModel = require('./core/LiterallyCanvas');
const defaultOptions = require('./core/defaultOptions');

const canvasRenderer = require('./core/canvasRenderer');
const svgRenderer = require('./core/svgRenderer');
const shapes = require('./core/shapes');
const util = require('./core/util');
const renderSnapshotToImage = require('./core/renderSnapshotToImage');
const renderSnapshotToSVG = require('./core/renderSnapshotToSVG');

const {localize} = require('./core/localization');

// @ifdef INCLUDE_GUI
const LiterallyCanvasReactComponent = require('./reactGUI/LiterallyCanvas');
const initReactDOM = require('./reactGUI/initDOM');
require('./optionsStyles/font');
require('./optionsStyles/stroke-width');
require('./optionsStyles/line-options-and-stroke-width');
require('./optionsStyles/polygon-and-stroke-width');
require('./optionsStyles/stroke-or-fill');
require('./optionsStyles/null');
const {defineOptionsStyle} = require('./optionsStyles/optionsStyles');
// @endif

var conversion = {
  snapshotToShapes(snapshot) {
    return Array.from(snapshot.shapes).map((shape) => shapes.JSONToShape(shape));
  },
  snapshotJSONToShapes(json) { return conversion.snapshotToShapes(JSON.parse(json)); }
};


const baseTools = require('./tools/base');
const tools = {
  Pencil: require('./tools/Pencil'),
  Eraser: require('./tools/Eraser'),
  Line: require('./tools/Line'),
  Rectangle: require('./tools/Rectangle'),
  Ellipse: require('./tools/Ellipse'),
  Text: require('./tools/Text'),
  Polygon: require('./tools/Polygon'),
  Pan: require('./tools/Pan'),
  Eyedropper: require('./tools/Eyedropper'),
  SelectShape: require('./tools/SelectShape'),

  Tool: baseTools.Tool,
  ToolWithStroke: baseTools.ToolWithStroke
};


const defaultTools = defaultOptions.tools;
let defaultImageURLPrefix = defaultOptions.imageURLPrefix;
const setDefaultImageURLPrefix = function(newDefault) {
  defaultImageURLPrefix = newDefault;
  return defaultOptions.imageURLPrefix = newDefault;
};


const init = function(el, opts) {
  if (opts == null) { opts = {}; }
  for (let opt in defaultOptions) {
    if (!(opt in opts)) {
      opts[opt] = defaultOptions[opt];
    }
  }

  // Destroy all children of the element we're using

  for (let child of Array.from(el.children)) {
    el.removeChild(child);
  }

  // @ifdef INCLUDE_GUI
  return require('./reactGUI/initDOM')(el, opts);
  // @endif
  // @ifndef INCLUDE_GUI
  return initWithoutGUI(el, opts);
};
  // @endif


var initWithoutGUI = function(el, opts) {
  const originalClassName = el.className;
  if ([' ', ' '].join(el.className).indexOf(' literally ') === -1) {
    el.className = el.className + ' literally';
  }

  if (el.className.includes('toolbar-hidden') === false) {
    el.className = el.className + ' toolbar-hidden';
  }

  if ('imageSize' in opts && 'height' in opts.imageSize) {
    el.style.height = opts.imageSize.height + 'px';
  }

  const drawingViewElement = document.createElement('div');
  drawingViewElement.className = 'lc-drawing';
  el.appendChild(drawingViewElement);

  const lc = new LiterallyCanvasModel(drawingViewElement, opts);
  lc.teardown = function() {
    lc._teardown();
    for (let child of Array.from(el.children)) {
      el.removeChild(child);
    }
    return el.className = originalClassName;
  };

  if ('onInit' in opts) {
    opts.onInit(lc);
  }

  return lc;
};


const registerJQueryPlugin = _$ =>
  _$.fn.literallycanvas = function(opts) {
    if (opts == null) { opts = {}; }
    this.each((ix, el) => {
      return el.literallycanvas = init(el, opts);
    });
    return this;
  }
;


// non-browserify compatibility
if (typeof window !== 'undefined') {
  window.LC = {init};
  if (window.$) {
      registerJQueryPlugin(window.$);
    }
}


module.exports = {
  init, registerJQueryPlugin, util, tools,
  setDefaultImageURLPrefix, defaultTools,
  // @ifdef INCLUDE_GUI
  defineOptionsStyle,
  LiterallyCanvasReactComponent,
  // @endif

  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,

  defineCanvasRenderer:  canvasRenderer.defineCanvasRenderer,
  renderShapeToContext: canvasRenderer.renderShapeToContext,
  renderShapeToCanvas: canvasRenderer.renderShapeToCanvas,
  renderShapesToCanvas: util.renderShapes,

  defineSVGRenderer: svgRenderer.defineSVGRenderer,
  renderShapeToSVG: svgRenderer.renderShapeToSVG,
  renderShapesToSVG: util.renderShapesToSVG,

  snapshotToShapes: conversion.snapshotToShapes,
  snapshotJSONToShapes: conversion.snapshotJSONToShapes,

  renderSnapshotToImage,
  renderSnapshotToSVG,

  localize
};

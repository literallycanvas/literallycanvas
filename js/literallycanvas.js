!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.LC=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

},{}],2:[function(_dereq_,module,exports){
var INFINITE, JSONToShape, LiterallyCanvas, Pencil, actions, bindEvents, createShape, math, shapeToJSON, util, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

actions = _dereq_('./actions');

bindEvents = _dereq_('./bindEvents');

math = _dereq_('./math');

_ref = _dereq_('./shapes'), createShape = _ref.createShape, shapeToJSON = _ref.shapeToJSON, JSONToShape = _ref.JSONToShape;

Pencil = _dereq_('../tools/Pencil');

util = _dereq_('./util');

INFINITE = 'infinite';

module.exports = LiterallyCanvas = (function() {
  function LiterallyCanvas(containerEl, opts) {
    this.containerEl = containerEl;
    this.setImageSize = __bind(this.setImageSize, this);
    bindEvents(this, this.containerEl, opts.keyboardShortcuts);
    this.colors = {
      primary: opts.primaryColor || '#000',
      secondary: opts.secondaryColor || '#fff',
      background: opts.backgroundColor || 'transparent'
    };
    this.containerEl.style['background-color'] = this.colors.background;
    this.watermarkImage = opts.watermarkImage;
    this.watermarkScale = opts.watermarkScale || 1;
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    this.containerEl.appendChild(this.backgroundCanvas);
    this.backgroundShapes = opts.backgroundShapes || [];
    this._shapesInProgress = [];
    this.canvas = document.createElement('canvas');
    this.canvas.style['background-color'] = 'transparent';
    this.containerEl.appendChild(this.canvas);
    this.buffer = document.createElement('canvas');
    this.buffer.style['background-color'] = 'transparent';
    this.ctx = this.canvas.getContext('2d');
    this.bufferCtx = this.buffer.getContext('2d');
    this.backingScale = util.getBackingScale(this.ctx);
    this.shapes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.isDragging = false;
    this.position = {
      x: 0,
      y: 0
    };
    this.scale = 1.0;
    this.tool = new Pencil();
    this.width = opts.imageSize.width || INFINITE;
    this.height = opts.imageSize.height || INFINITE;
    this.setZoom(this.scale);
    util.matchElementSize(this.containerEl, [this.backgroundCanvas, this.canvas], this.backingScale, (function(_this) {
      return function() {
        _this.keepPanInImageBounds();
        return _this.repaintAllLayers();
      };
    })(this));
    if (this.watermarkImage) {
      this.watermarkImage.onload = (function(_this) {
        return function() {
          return _this.repaintLayer('background');
        };
      })(this);
    }
  }

  LiterallyCanvas.prototype.trigger = function(name, data) {
    return this.canvas.dispatchEvent(new CustomEvent(name, {
      detail: data
    }));
  };

  LiterallyCanvas.prototype.on = function(name, fn) {
    var wrapper;
    wrapper = function(e) {
      return fn(e.detail);
    };
    this.canvas.addEventListener(name, wrapper);
    return (function(_this) {
      return function() {
        return _this.canvas.removeEventListener(name, wrapper);
      };
    })(this);
  };

  LiterallyCanvas.prototype.getRenderScale = function() {
    return this.scale * this.backingScale;
  };

  LiterallyCanvas.prototype.clientCoordsToDrawingCoords = function(x, y) {
    return {
      x: (x * this.backingScale - this.position.x) / this.getRenderScale(),
      y: (y * this.backingScale - this.position.y) / this.getRenderScale()
    };
  };

  LiterallyCanvas.prototype.drawingCoordsToClientCoords = function(x, y) {
    return {
      x: x * this.getRenderScale() + this.position.x,
      y: y * this.getRenderScale() + this.position.y
    };
  };

  LiterallyCanvas.prototype.setImageSize = function(width, height) {
    this.width = width || INFINITE;
    this.height = height || INFINITE;
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('imageSizeChange', {
      width: this.width,
      height: this.height
    });
  };

  LiterallyCanvas.prototype.setTool = function(tool) {
    this.tool.willBecomeInactive(this);
    this.tool = tool;
    this.trigger('toolChange', {
      tool: tool
    });
    return tool.didBecomeActive(this);
  };

  LiterallyCanvas.prototype.setShapesInProgress = function(newVal) {
    return this._shapesInProgress = newVal;
  };

  LiterallyCanvas.prototype.begin = function(x, y) {
    return util.requestAnimationFrame((function(_this) {
      return function() {
        var newPos;
        newPos = _this.clientCoordsToDrawingCoords(x, y);
        _this.tool.begin(newPos.x, newPos.y, _this);
        _this.isDragging = true;
        return _this.trigger("drawStart", {
          tool: _this.tool
        });
      };
    })(this));
  };

  LiterallyCanvas.prototype["continue"] = function(x, y) {
    return util.requestAnimationFrame((function(_this) {
      return function() {
        var newPos;
        newPos = _this.clientCoordsToDrawingCoords(x, y);
        if (_this.isDragging) {
          _this.tool["continue"](newPos.x, newPos.y, _this);
          return _this.trigger("drawContinue", {
            tool: _this.tool
          });
        }
      };
    })(this));
  };

  LiterallyCanvas.prototype.end = function(x, y) {
    return util.requestAnimationFrame((function(_this) {
      return function() {
        var newPos;
        newPos = _this.clientCoordsToDrawingCoords(x, y);
        if (_this.isDragging) {
          _this.tool.end(newPos.x, newPos.y, _this);
          _this.isDragging = false;
          return _this.trigger("drawEnd", {
            tool: _this.tool
          });
        }
      };
    })(this));
  };

  LiterallyCanvas.prototype.setColor = function(name, color) {
    this.colors[name] = color;
    switch (name) {
      case 'background':
        this.containerEl.style.backgroundColor = this.colors.background;
        this.repaintLayer('background');
        break;
      case 'primary':
        this.repaintLayer('main');
        break;
      case 'secondary':
        this.repaintLayer('main');
    }
    this.trigger("" + name + "ColorChange", this.colors[name]);
    if (name === 'background') {
      return this.trigger("drawingChange");
    }
  };

  LiterallyCanvas.prototype.getColor = function(name) {
    return this.colors[name];
  };

  LiterallyCanvas.prototype.saveShape = function(shape, triggerShapeSaveEvent, previousShapeId) {
    if (triggerShapeSaveEvent == null) {
      triggerShapeSaveEvent = true;
    }
    if (previousShapeId == null) {
      previousShapeId = null;
    }
    if (!previousShapeId) {
      previousShapeId = this.shapes.length ? this.shapes[this.shapes.length - 1].id : null;
    }
    this.execute(new actions.AddShapeAction(this, shape, previousShapeId));
    if (triggerShapeSaveEvent) {
      this.trigger('shapeSave', {
        shape: shape,
        previousShapeId: previousShapeId
      });
    }
    return this.trigger('drawingChange');
  };

  LiterallyCanvas.prototype.pan = function(x, y) {
    return this.setPan(this.position.x - x, this.position.y - y);
  };

  LiterallyCanvas.prototype.keepPanInImageBounds = function() {
    var renderScale, x, y, _ref1;
    renderScale = this.getRenderScale();
    _ref1 = this.position, x = _ref1.x, y = _ref1.y;
    if (this.width !== INFINITE) {
      if (this.canvas.width > this.width * renderScale) {
        x = (this.canvas.width - this.width * renderScale) / 2;
      } else {
        x = Math.max(Math.min(0, x), this.canvas.width - this.width * renderScale);
      }
    }
    if (this.height !== INFINITE) {
      if (this.canvas.height > this.height * renderScale) {
        y = (this.canvas.height - this.height * renderScale) / 2;
      } else {
        y = Math.max(Math.min(0, y), this.canvas.height - this.height * renderScale);
      }
    }
    return this.position = {
      x: x,
      y: y
    };
  };

  LiterallyCanvas.prototype.setPan = function(x, y) {
    this.position = {
      x: x,
      y: y
    };
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('pan', {
      x: this.position.x,
      y: this.position.y
    });
  };

  LiterallyCanvas.prototype.zoom = function(factor) {
    var newScale;
    newScale = this.scale + factor;
    newScale = Math.max(newScale, 0.6);
    newScale = Math.min(newScale, 4.0);
    newScale = Math.round(newScale * 100) / 100;
    return this.setZoom(newScale);
  };

  LiterallyCanvas.prototype.setZoom = function(scale) {
    var oldScale;
    oldScale = this.scale;
    this.scale = scale;
    this.position.x = math.scalePositionScalar(this.position.x, this.canvas.width, oldScale, this.scale);
    this.position.y = math.scalePositionScalar(this.position.y, this.canvas.height, oldScale, this.scale);
    this.keepPanInImageBounds();
    this.repaintAllLayers();
    return this.trigger('zoom', {
      oldScale: oldScale,
      newScale: this.scale
    });
  };

  LiterallyCanvas.prototype.repaintAllLayers = function() {
    var key, _i, _len, _ref1;
    _ref1 = ['background', 'main'];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i];
      this.repaintLayer(key);
    }
    return null;
  };

  LiterallyCanvas.prototype.repaintLayer = function(repaintLayerKey, dirty) {
    var retryCallback;
    if (dirty == null) {
      dirty = repaintLayerKey === 'main';
    }
    switch (repaintLayerKey) {
      case 'background':
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        retryCallback = (function(_this) {
          return function() {
            return _this.repaintLayer('background');
          };
        })(this);
        if (this.watermarkImage) {
          this._renderWatermark(this.backgroundCtx, true, retryCallback);
        }
        this.draw(this.backgroundShapes, this.backgroundCtx, retryCallback);
        break;
      case 'main':
        retryCallback = (function(_this) {
          return function() {
            return _this.repaintLayer('main', true);
          };
        })(this);
        if (dirty) {
          this.buffer.width = this.canvas.width;
          this.buffer.height = this.canvas.height;
          this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
          this.draw(this.shapes, this.bufferCtx, retryCallback);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.canvas.width > 0 && this.canvas.height > 0) {
          this.ctx.fillStyle = '#ccc';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.clipped(((function(_this) {
            return function() {
              _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
              return _this.ctx.drawImage(_this.buffer, 0, 0);
            };
          })(this)), this.ctx);
          this.clipped(((function(_this) {
            return function() {
              return _this.transformed((function() {
                var shape, _i, _len, _ref1, _results;
                _ref1 = _this._shapesInProgress;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                  shape = _ref1[_i];
                  _results.push(shape.drawLatest(_this.ctx, _this.bufferCtx));
                }
                return _results;
              }), _this.ctx, _this.bufferCtx);
            };
          })(this)), this.ctx, this.bufferCtx);
        }
    }
    return this.trigger('repaint', {
      layerKey: repaintLayerKey
    });
  };

  LiterallyCanvas.prototype._renderWatermark = function(ctx, worryAboutRetina, retryCallback) {
    if (worryAboutRetina == null) {
      worryAboutRetina = true;
    }
    if (!this.watermarkImage.width) {
      this.watermarkImage.onload = retryCallback;
      return;
    }
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(this.watermarkScale, this.watermarkScale);
    if (worryAboutRetina) {
      ctx.scale(this.backingScale, this.backingScale);
    }
    ctx.drawImage(this.watermarkImage, -this.watermarkImage.width / 2, -this.watermarkImage.height / 2);
    return ctx.restore();
  };

  LiterallyCanvas.prototype.drawShapeInProgress = function(shape) {
    this.repaintLayer('main', false);
    return this.clipped(((function(_this) {
      return function() {
        return _this.transformed((function() {
          return shape.drawLatest(_this.ctx, _this.bufferCtx);
        }), _this.ctx, _this.bufferCtx);
      };
    })(this)), this.ctx, this.bufferCtx);
  };

  LiterallyCanvas.prototype.draw = function(shapes, ctx, retryCallback) {
    var drawShapes;
    if (!shapes.length) {
      return;
    }
    drawShapes = (function(_this) {
      return function() {
        var shape, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = shapes.length; _i < _len; _i++) {
          shape = shapes[_i];
          _results.push(shape.draw(ctx, retryCallback));
        }
        return _results;
      };
    })(this);
    return this.clipped(((function(_this) {
      return function() {
        return _this.transformed(drawShapes, ctx);
      };
    })(this)), ctx);
  };

  LiterallyCanvas.prototype.clipped = function() {
    var contexts, ctx, fn, height, width, x, y, _i, _j, _len, _len1, _results;
    fn = arguments[0], contexts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    x = this.width === INFINITE ? 0 : this.position.x;
    y = this.height === INFINITE ? 0 : this.position.y;
    width = (function() {
      switch (this.width) {
        case INFINITE:
          return this.canvas.width;
        default:
          return this.width * this.getRenderScale();
      }
    }).call(this);
    height = (function() {
      switch (this.height) {
        case INFINITE:
          return this.canvas.height;
        default:
          return this.height * this.getRenderScale();
      }
    }).call(this);
    for (_i = 0, _len = contexts.length; _i < _len; _i++) {
      ctx = contexts[_i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
    }
    fn();
    _results = [];
    for (_j = 0, _len1 = contexts.length; _j < _len1; _j++) {
      ctx = contexts[_j];
      _results.push(ctx.restore());
    }
    return _results;
  };

  LiterallyCanvas.prototype.transformed = function() {
    var contexts, ctx, fn, scale, _i, _j, _len, _len1, _results;
    fn = arguments[0], contexts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = contexts.length; _i < _len; _i++) {
      ctx = contexts[_i];
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      scale = this.getRenderScale();
      ctx.scale(scale, scale);
    }
    fn();
    _results = [];
    for (_j = 0, _len1 = contexts.length; _j < _len1; _j++) {
      ctx = contexts[_j];
      _results.push(ctx.restore());
    }
    return _results;
  };

  LiterallyCanvas.prototype.clear = function() {
    var newShapes, oldShapes;
    oldShapes = this.shapes;
    newShapes = [];
    this.execute(new actions.ClearAction(this, oldShapes, newShapes));
    this.repaintLayer('main');
    this.trigger('clear', null);
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.execute = function(action) {
    this.undoStack.push(action);
    action["do"]();
    return this.redoStack = [];
  };

  LiterallyCanvas.prototype.undo = function() {
    var action;
    if (!this.undoStack.length) {
      return;
    }
    action = this.undoStack.pop();
    action.undo();
    this.redoStack.push(action);
    this.trigger('undo', {
      action: action
    });
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.redo = function() {
    var action;
    if (!this.redoStack.length) {
      return;
    }
    action = this.redoStack.pop();
    this.undoStack.push(action);
    action["do"]();
    this.trigger('redo', {
      action: action
    });
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.canUndo = function() {
    return !!this.undoStack.length;
  };

  LiterallyCanvas.prototype.canRedo = function() {
    return !!this.redoStack.length;
  };

  LiterallyCanvas.prototype.getPixel = function(x, y) {
    var p, pixel;
    p = this.drawingCoordsToClientCoords(x, y);
    pixel = this.ctx.getImageData(p.x, p.y, 1, 1).data;
    if (pixel[3]) {
      return "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
    } else {
      return null;
    }
  };

  LiterallyCanvas.prototype.getContentBounds = function() {
    return util.getBoundingRect((this.shapes.concat(this.backgroundShapes)).map(function(s) {
      return s.getBoundingRect();
    }), this.width === INFINITE ? 0 : this.width, this.height === INFINITE ? 0 : this.height);
  };

  LiterallyCanvas.prototype.getImage = function(opts) {
    var watermarkCanvas, watermarkCtx;
    if (opts == null) {
      opts = {};
    }
    if (opts.rect == null) {
      opts.rect = this.getContentBounds();
    }
    if (!(opts.rect.width && opts.rect.height)) {
      return;
    }
    if (opts.scale == null) {
      opts.scale = 1;
    }
    if (opts.scaleDownRetina == null) {
      opts.scaleDownRetina = true;
    }
    if (opts.includeWatermark == null) {
      opts.includeWatermark = this.watermarkImage && true;
    }
    if (!opts.scaleDownRetina) {
      opts.scale *= this.backingScale;
    }
    this.repaintLayer('main', true);
    watermarkCanvas = document.createElement('canvas');
    watermarkCanvas.width = opts.rect.width * opts.scale;
    watermarkCanvas.height = opts.rect.height * opts.scale;
    watermarkCtx = watermarkCanvas.getContext('2d');
    watermarkCtx.fillStyle = this.colors.background;
    watermarkCtx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
    if (opts.includeWatermark) {
      this._renderWatermark(watermarkCtx, false);
    }
    return util.combineCanvases(watermarkCanvas, util.renderShapes(this.backgroundShapes, opts.rect, opts.scale), util.renderShapes(this.shapes, opts.rect, opts.scale));
  };

  LiterallyCanvas.prototype.canvasForExport = function() {
    this.repaintAllLayers();
    return util.combineCanvases(this.backgroundCanvas, this.canvas);
  };

  LiterallyCanvas.prototype.canvasWithBackground = function(backgroundImageOrCanvas) {
    return util.combineCanvases(backgroundImageOrCanvas, this.canvasForExport());
  };

  LiterallyCanvas.prototype.getSnapshot = function() {
    var shape;
    return {
      shapes: (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.shapes;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          shape = _ref1[_i];
          _results.push(shapeToJSON(shape));
        }
        return _results;
      }).call(this),
      colors: this.colors
    };
  };

  LiterallyCanvas.prototype.getSnapshotJSON = function() {
    return JSON.stringify(this.getSnapshot());
  };

  LiterallyCanvas.prototype.getSVGString = function(opts) {
    var height, width, x, y, _ref1;
    if (opts == null) {
      opts = {};
    }
    if (opts.rect == null) {
      opts.rect = this.getContentBounds();
    }
    _ref1 = opts.rect, x = _ref1.x, y = _ref1.y, width = _ref1.width, height = _ref1.height;
    if (!(opts.rect.width && opts.rect.height)) {
      return;
    }
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='" + width + "' height='" + height + "' viewBox='0 0 " + width + " " + height + "'> <rect width='" + width + "' height='" + height + "' x='0' y='0' fill='" + this.colors.background + "' /> <g transform='translate(" + (-x) + ", " + (-y) + ")'> " + (this.backgroundShapes.map(function(s) {
      return s.toSVG();
    }).join('')) + " " + (this.shapes.map(function(s) {
      return s.toSVG();
    }).join('')) + " </g> </svg>").replace(/(\r\n|\n|\r)/gm, "");
  };

  LiterallyCanvas.prototype.loadSnapshot = function(snapshot) {
    var k, shape, shapeRepr, _i, _j, _len, _len1, _ref1, _ref2;
    if (!snapshot) {
      return;
    }
    if (snapshot.colors == null) {
      snapshot.colors = this.colors;
    }
    _ref1 = ['primary', 'secondary', 'background'];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      k = _ref1[_i];
      this.setColor(k, snapshot.colors[k]);
    }
    this.shapes = [];
    _ref2 = snapshot.shapes;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      shapeRepr = _ref2[_j];
      shape = JSONToShape(shapeRepr);
      if (shape) {
        this.execute(new actions.AddShapeAction(this, shape));
      }
    }
    this.repaintAllLayers();
    this.trigger('snapshotLoad');
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.loadSnapshotJSON = function(str) {
    return this.loadSnapshot(JSON.parse(str));
  };

  return LiterallyCanvas;

})();


},{"../tools/Pencil":36,"./actions":4,"./bindEvents":5,"./math":9,"./shapes":10,"./util":11}],3:[function(_dereq_,module,exports){
var TextRenderer, getLinesToRender, getNextLine, parseFontString;

_dereq_('./fontmetrics.js');

parseFontString = function(font) {
  var fontFamily, fontItems, fontSize, item, maybeSize, remainingFontString, _i, _len;
  fontItems = font.split(' ');
  fontSize = 0;
  for (_i = 0, _len = fontItems.length; _i < _len; _i++) {
    item = fontItems[_i];
    maybeSize = parseInt(item.replace("px", ""), 10);
    if (!isNaN(maybeSize)) {
      fontSize = maybeSize;
    }
  }
  if (!fontSize) {
    throw "Font size not found";
  }
  remainingFontString = font.substring(fontItems[0].length + 1).replace('bold ', '').replace('italic ', '').replace('underline ', '');
  fontFamily = remainingFontString;
  return {
    fontSize: fontSize,
    fontFamily: fontFamily
  };
};

getNextLine = function(ctx, text, forcedWidth) {
  var doesSubstringFit, endIndex, isEndOfString, isNonWord, isWhitespace, lastGoodIndex, lastOkayIndex, nextWordStartIndex, textToHere, wasInWord;
  if (!text.length) {
    return ['', ''];
  }
  endIndex = 0;
  lastGoodIndex = 0;
  lastOkayIndex = 0;
  wasInWord = false;
  while (true) {
    endIndex += 1;
    isEndOfString = endIndex >= text.length;
    isWhitespace = (!isEndOfString) && text[endIndex].match(/\s/);
    isNonWord = isWhitespace || isEndOfString;
    textToHere = text.substring(0, endIndex);
    doesSubstringFit = forcedWidth ? ctx.measureTextWidth(textToHere).width <= forcedWidth : true;
    if (doesSubstringFit) {
      lastOkayIndex = endIndex;
    }
    if (isNonWord && wasInWord) {
      wasInWord = false;
      if (doesSubstringFit) {
        lastGoodIndex = endIndex;
      }
    }
    wasInWord = !isWhitespace;
    if (isEndOfString || !doesSubstringFit) {
      if (doesSubstringFit) {
        return [text, ''];
      } else if (lastGoodIndex > 0) {
        nextWordStartIndex = lastGoodIndex + 1;
        while (nextWordStartIndex < text.length && text[nextWordStartIndex].match('/\s/')) {
          nextWordStartIndex += 1;
        }
        return [text.substring(0, lastGoodIndex), text.substring(nextWordStartIndex)];
      } else {
        return [text.substring(0, lastOkayIndex), text.substring(lastOkayIndex)];
      }
    }
  }
};

getLinesToRender = function(ctx, text, forcedWidth) {
  var lines, nextLine, remainingText, textLine, textSplitOnLines, _i, _len, _ref, _ref1;
  textSplitOnLines = text.split(/\r\n|\r|\n/g);
  lines = [];
  for (_i = 0, _len = textSplitOnLines.length; _i < _len; _i++) {
    textLine = textSplitOnLines[_i];
    _ref = getNextLine(ctx, textLine, forcedWidth), nextLine = _ref[0], remainingText = _ref[1];
    if (nextLine) {
      while (nextLine) {
        lines.push(nextLine);
        _ref1 = getNextLine(ctx, remainingText, forcedWidth), nextLine = _ref1[0], remainingText = _ref1[1];
      }
    } else {
      lines.push(textLine);
    }
  }
  return lines;
};

TextRenderer = (function() {
  function TextRenderer(ctx, text, font, forcedWidth, forcedHeight) {
    var fontFamily, fontSize, _ref;
    this.text = text;
    this.font = font;
    this.forcedWidth = forcedWidth;
    this.forcedHeight = forcedHeight;
    _ref = parseFontString(this.font), fontFamily = _ref.fontFamily, fontSize = _ref.fontSize;
    ctx.font = this.font;
    ctx.textBaseline = 'baseline';
    this.emDashWidth = ctx.measureTextWidth('—', fontSize, fontFamily).width;
    this.caratWidth = ctx.measureTextWidth('|', fontSize, fontFamily).width;
    this.lines = getLinesToRender(ctx, text, this.forcedWidth);
    this.metricses = this.lines.map((function(_this) {
      return function(line) {
        return ctx.measureText2(line || 'X', fontSize, _this.font);
      };
    })(this));
    this.metrics = {
      ascent: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var ascent;
        ascent = _arg.ascent;
        return ascent;
      })),
      descent: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var descent;
        descent = _arg.descent;
        return descent;
      })),
      fontsize: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var fontsize;
        fontsize = _arg.fontsize;
        return fontsize;
      })),
      leading: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var leading;
        leading = _arg.leading;
        return leading;
      })),
      width: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var width;
        width = _arg.width;
        return width;
      })),
      height: Math.max.apply(Math, this.metricses.map(function(_arg) {
        var height;
        height = _arg.height;
        return height;
      })),
      bounds: {
        minx: Math.min.apply(Math, this.metricses.map(function(_arg) {
          var bounds;
          bounds = _arg.bounds;
          return bounds.minx;
        })),
        miny: Math.min.apply(Math, this.metricses.map(function(_arg) {
          var bounds;
          bounds = _arg.bounds;
          return bounds.miny;
        })),
        maxx: Math.max.apply(Math, this.metricses.map(function(_arg) {
          var bounds;
          bounds = _arg.bounds;
          return bounds.maxx;
        })),
        maxy: Math.max.apply(Math, this.metricses.map(function(_arg) {
          var bounds;
          bounds = _arg.bounds;
          return bounds.maxy;
        }))
      }
    };
    this.boundingBoxWidth = Math.ceil(this.metrics.width);
  }

  TextRenderer.prototype.draw = function(ctx, x, y) {
    var i, line, _i, _len, _ref, _results;
    ctx.textBaseline = 'top';
    ctx.font = this.font;
    i = 0;
    _ref = this.lines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      ctx.fillText(line, x, y + i * this.metrics.leading);
      _results.push(i += 1);
    }
    return _results;
  };

  TextRenderer.prototype.getWidth = function(isEditing) {
    if (isEditing == null) {
      isEditing = false;
    }
    if (this.forcedWidth) {
      return this.forcedWidth;
    } else {
      if (isEditing) {
        return this.metrics.bounds.maxx + this.caratWidth;
      } else {
        return this.metrics.bounds.maxx;
      }
    }
  };

  TextRenderer.prototype.getHeight = function() {
    return this.forcedHeight || (this.metrics.leading * this.lines.length);
  };

  return TextRenderer;

})();

module.exports = TextRenderer;


},{"./fontmetrics.js":6}],4:[function(_dereq_,module,exports){
var AddShapeAction, ClearAction;

ClearAction = (function() {
  function ClearAction(lc, oldShapes, newShapes) {
    this.lc = lc;
    this.oldShapes = oldShapes;
    this.newShapes = newShapes;
  }

  ClearAction.prototype["do"] = function() {
    this.lc.shapes = this.newShapes;
    return this.lc.repaintLayer('main');
  };

  ClearAction.prototype.undo = function() {
    this.lc.shapes = this.oldShapes;
    return this.lc.repaintLayer('main');
  };

  return ClearAction;

})();

AddShapeAction = (function() {
  function AddShapeAction(lc, shape, previousShapeId) {
    this.lc = lc;
    this.shape = shape;
    this.previousShapeId = previousShapeId != null ? previousShapeId : null;
  }

  AddShapeAction.prototype["do"] = function() {
    var found, newShapes, shape, _i, _len, _ref;
    if (!this.lc.shapes.length || this.lc.shapes[this.lc.shapes.length - 1].id === this.previousShapeId || this.previousShapeId === null) {
      this.lc.shapes.push(this.shape);
    } else {
      newShapes = [];
      found = false;
      _ref = this.lc.shapes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        shape = _ref[_i];
        newShapes.push(shape);
        if (shape.id === this.previousShapeId) {
          newShapes.push(this.shape);
          found = true;
        }
      }
      if (!found) {
        newShapes.push(this.shape);
      }
      this.lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  };

  AddShapeAction.prototype.undo = function() {
    var newShapes, shape, _i, _len, _ref;
    if (this.lc.shapes[this.lc.shapes.length - 1].id === this.shape.id) {
      this.lc.shapes.pop();
    } else {
      newShapes = [];
      _ref = this.lc.shapes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        shape = _ref[_i];
        if (shape.id !== this.shape.id) {
          newShapes.push(shape);
        }
      }
      lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  };

  return AddShapeAction;

})();

module.exports = {
  ClearAction: ClearAction,
  AddShapeAction: AddShapeAction
};


},{}],5:[function(_dereq_,module,exports){
var bindEvents, buttonIsDown, coordsForTouchEvent, position;

coordsForTouchEvent = function(el, e) {
  var p, tx, ty;
  tx = e.changedTouches[0].clientX;
  ty = e.changedTouches[0].clientY;
  p = el.getBoundingClientRect();
  return [tx - p.left, ty - p.top];
};

position = function(el, e) {
  var p;
  p = el.getBoundingClientRect();
  return {
    left: e.clientX - p.left,
    top: e.clientY - p.top
  };
};

buttonIsDown = function(e) {
  if (e.buttons != null) {
    return e.buttons === 1;
  } else {
    return e.which > 0;
  }
};

module.exports = bindEvents = function(lc, canvas, panWithKeyboard) {
  var mouseMoveListener, mouseUpListener, touchEndListener, touchMoveListener;
  if (panWithKeyboard == null) {
    panWithKeyboard = false;
  }
  mouseMoveListener = (function(_this) {
    return function(e) {
      var p;
      e.preventDefault();
      p = position(canvas, e);
      return lc["continue"](p.left, p.top);
    };
  })(this);
  mouseUpListener = (function(_this) {
    return function(e) {
      var p;
      e.preventDefault();
      canvas.onselectstart = function() {
        return true;
      };
      p = position(canvas, e);
      lc.end(p.left, p.top);
      document.removeEventListener('mousemove', mouseMoveListener);
      return document.removeEventListener('mouseup', mouseUpListener);
    };
  })(this);
  canvas.addEventListener('mousedown', (function(_this) {
    return function(e) {
      var down, p;
      down = true;
      e.preventDefault();
      canvas.onselectstart = function() {
        return false;
      };
      p = position(canvas, e);
      lc.begin(p.left, p.top);
      document.addEventListener('mousemove', mouseMoveListener);
      return document.addEventListener('mouseup', mouseUpListener);
    };
  })(this));
  touchMoveListener = function(e) {
    e.preventDefault();
    return lc["continue"].apply(lc, coordsForTouchEvent(canvas, e));
  };
  touchEndListener = function(e) {
    e.preventDefault();
    lc.end.apply(lc, coordsForTouchEvent(canvas, e));
    document.removeEventListener('touchmove', touchMoveListener);
    document.removeEventListener('touchend', touchEndListener);
    return document.removeEventListener('touchcancel', touchEndListener);
  };
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      lc.begin.apply(lc, coordsForTouchEvent(canvas, e));
      document.addEventListener('touchmove', touchMoveListener);
      document.addEventListener('touchend', touchEndListener);
      return document.addEventListener('touchcancel', touchEndListener);
    } else {
      return lc["continue"].apply(lc, coordsForTouchEvent(canvas, e));
    }
  });
  if (panWithKeyboard) {
    return document.addEventListener('keydown', function(e) {
      switch (e.keyCode) {
        case 37:
          lc.pan(-10, 0);
          break;
        case 38:
          lc.pan(0, -10);
          break;
        case 39:
          lc.pan(10, 0);
          break;
        case 40:
          lc.pan(0, 10);
      }
      return lc.repaintAllLayers();
    });
  }
};


},{}],6:[function(_dereq_,module,exports){
/**
  This library rewrites the Canvas2D "measureText" function
  so that it returns a more complete metrics object.
  This library is licensed under the MIT (Expat) license,
  the text for which is included below.

** -----------------------------------------------------------------------------

  CHANGELOG:

    2012-01-21 - Whitespace handling added by Joe Turner
                 (https://github.com/oampo)

    2015-06-08 - Various hacks added by Steve Johnson

** -----------------------------------------------------------------------------

  Copyright (C) 2011 by Mike "Pomax" Kamermans

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
**/
(function(){
  var NAME = "FontMetrics Library"
  var VERSION = "1-2012.0121.1300";

  // if there is no getComputedStyle, this library won't work.
  if(!document.defaultView.getComputedStyle) {
    throw("ERROR: 'document.defaultView.getComputedStyle' not found. This library only works in browsers that can report computed CSS values.");
  }

  // store the old text metrics function on the Canvas2D prototype
  CanvasRenderingContext2D.prototype.measureTextWidth = CanvasRenderingContext2D.prototype.measureText;

  /**
   *  shortcut function for getting computed CSS values
   */
  var getCSSValue = function(element, property) {
    return document.defaultView.getComputedStyle(element,null).getPropertyValue(property);
  };

  // debug function
  var show = function(canvas, ctx, xstart, w, h, metrics)
  {
    document.body.appendChild(canvas);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';

    ctx.beginPath();
    ctx.moveTo(xstart,0);
    ctx.lineTo(xstart,h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xstart+metrics.bounds.maxx,0);
    ctx.lineTo(xstart+metrics.bounds.maxx,h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,h/2-metrics.ascent);
    ctx.lineTo(w,h/2-metrics.ascent);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,h/2+metrics.descent);
    ctx.lineTo(w,h/2+metrics.descent);
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * The new text metrics function
   */
  CanvasRenderingContext2D.prototype.measureText2 = function(
      textstring, fontSize, fontString) {
    var metrics = this.measureTextWidth(textstring),
        isSpace = !(/\S/.test(textstring));
    metrics.fontsize = fontSize;

    // for text lead values, we meaure a multiline text container.
    var leadDiv = document.createElement("div");
    leadDiv.style.position = "absolute";
    leadDiv.style.opacity = 0;
    leadDiv.style.font = fontString;
    leadDiv.innerHTML = textstring + "<br/>" + textstring;
    document.body.appendChild(leadDiv);

    // make some initial guess at the text leading (using the standard TeX ratio)
    metrics.leading = 1.2 * fontSize;

    // then we try to get the real value from the browser
    var leadDivHeight = getCSSValue(leadDiv,"height");
    leadDivHeight = leadDivHeight.replace("px","");
    if (leadDivHeight >= fontSize * 2) { metrics.leading = (leadDivHeight/2) | 0; }
    document.body.removeChild(leadDiv);

    // if we're not dealing with white space, we can compute metrics
    if (!isSpace) {
        // Have characters, so measure the text
        var canvas = document.createElement("canvas");
        var padding = 100;
        canvas.width = metrics.width + padding;
        canvas.height = 3*fontSize;
        canvas.style.opacity = 1;
        canvas.style.font = fontString;
        var ctx = canvas.getContext("2d");
        ctx.font = fontString;

        var w = canvas.width,
            h = canvas.height,
            baseline = h/2;

        // Set all canvas pixeldata values to 255, with all the content
        // data being 0. This lets us scan for data[i] != 255.
        ctx.fillStyle = "white";
        ctx.fillRect(-1, -1, w+2, h+2);
        ctx.fillStyle = "black";
        ctx.fillText(textstring, padding/2, baseline);
        var pixelData = ctx.getImageData(0, 0, w, h).data;

        // canvas pixel data is w*4 by h*4, because R, G, B and A are separate,
        // consecutive values in the array, rather than stored as 32 bit ints.
        var i = 0,
            w4 = w * 4,
            len = pixelData.length;

        // Finding the ascent uses a normal, forward scanline
        while (++i < len && pixelData[i] === 255) {}
        var ascent = (i/w4)|0;

        // Finding the descent uses a reverse scanline
        i = len - 1;
        while (--i > 0 && pixelData[i] === 255) {}
        var descent = (i/w4)|0;

        // find the min-x coordinate
        for(i = 0; i<len && pixelData[i] === 255; ) {
          i += w4;
          if(i>=len) { i = (i-len) + 4; }}
        var minx = ((i%w4)/4) | 0;

        // find the max-x coordinate
        var step = 1;
        for(i = len-3; i>=0 && pixelData[i] === 255; ) {
          i -= w4;
          if(i<0) { i = (len - 3) - (step++)*4; }}
        var maxx = ((i%w4)/4) + 1 | 0;

        // set font metrics
        metrics.ascent = (baseline - ascent);
        metrics.descent = (descent - baseline);
        metrics.bounds = { minx: minx - (padding/2),
                           maxx: maxx - (padding/2),
                           miny: 0,
                           maxy: descent-ascent };
        metrics.height = 1+(descent - ascent);
    }

    // if we ARE dealing with whitespace, most values will just be zero.
    else {
        // Only whitespace, so we can't measure the text
        metrics.ascent = 0;
        metrics.descent = 0;
        metrics.bounds = { minx: 0,
                           maxx: metrics.width, // Best guess
                           miny: 0,
                           maxy: 0 };
        metrics.height = 0;
    }
    return metrics;
  };
}());

},{}],7:[function(_dereq_,module,exports){
module.exports = {
  arrow: (function() {
    var getPoints;
    getPoints = function(x, y, angle, width, length) {
      return [
        {
          x: x + Math.cos(angle + Math.PI / 2) * width / 2,
          y: y + Math.sin(angle + Math.PI / 2) * width / 2
        }, {
          x: x + Math.cos(angle) * length,
          y: y + Math.sin(angle) * length
        }, {
          x: x + Math.cos(angle - Math.PI / 2) * width / 2,
          y: y + Math.sin(angle - Math.PI / 2) * width / 2
        }
      ];
    };
    return {
      drawToCanvas: function(ctx, x, y, angle, width, color, length) {
        var points;
        if (length == null) {
          length = 0;
        }
        length = length || width;
        ctx.fillStyle = color;
        ctx.lineWidth = 0;
        ctx.strokeStyle = 'transparent';
        ctx.beginPath();
        points = getPoints(x, y, angle, width, length);
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        return ctx.fill();
      },
      svg: function(x, y, angle, width, color, length) {
        var points;
        if (length == null) {
          length = 0;
        }
        length = length || width;
        points = getPoints(x, y, angle, width, length);
        return "<polygon fill='" + color + "' stroke='none' points='" + (points.map(function(p) {
          return "" + p.x + "," + p.y;
        })) + "' />";
      }
    };
  })()
};


},{}],8:[function(_dereq_,module,exports){
var localize, strings, _;

strings = {};

localize = function(localStrings) {
  return strings = localStrings;
};

_ = function(string) {
  var translation;
  translation = strings[string];
  return translation || string;
};

module.exports = {
  localize: localize,
  _: _
};


},{}],9:[function(_dereq_,module,exports){
var Point, math, normals, unit, util, _slope;

Point = _dereq_('./shapes').Point;

util = _dereq_('./util');

math = {};

math.toPoly = function(line) {
  var index, n, point, polyLeft, polyRight, _i, _len;
  polyLeft = [];
  polyRight = [];
  index = 0;
  for (_i = 0, _len = line.length; _i < _len; _i++) {
    point = line[_i];
    n = normals(point, _slope(line, index));
    polyLeft = polyLeft.concat([n[0]]);
    polyRight = [n[1]].concat(polyRight);
    index += 1;
  }
  return polyLeft.concat(polyRight);
};

_slope = function(line, index) {
  var point;
  if (line.length < 3) {
    point = {
      x: 0,
      y: 0
    };
  }
  if (index === 0) {
    point = _slope(line, index + 1);
  } else if (index === line.length - 1) {
    point = _slope(line, index - 1);
  } else {
    point = math.diff(line[index - 1], line[index + 1]);
  }
  return point;
};

math.diff = function(a, b) {
  return {
    x: b.x - a.x,
    y: b.y - a.y
  };
};

unit = function(vector) {
  var length;
  length = math.len(vector);
  return {
    x: vector.x / length,
    y: vector.y / length
  };
};

normals = function(p, slope) {
  slope = unit(slope);
  slope.x = slope.x * p.size / 2;
  slope.y = slope.y * p.size / 2;
  return [
    {
      x: p.x - slope.y,
      y: p.y + slope.x,
      color: p.color
    }, {
      x: p.x + slope.y,
      y: p.y - slope.x,
      color: p.color
    }
  ];
};

math.len = function(vector) {
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
};

math.scalePositionScalar = function(val, viewportSize, oldScale, newScale) {
  var newSize, oldSize;
  oldSize = viewportSize * oldScale;
  newSize = viewportSize * newScale;
  return val + (oldSize - newSize) / 2;
};

module.exports = math;


},{"./shapes":10,"./util":11}],10:[function(_dereq_,module,exports){
var HANDLE_SIZE, JSONToShape, LinePath, MARGIN, TextRenderer, bspline, createShape, defineShape, lineEndCapShapes, linePathFuncs, shapeToJSON, shapes, util, _createLinePathFromData, _doAllPointsShareStyle, _dual, _mid, _refine,
  __slice = [].slice;

util = _dereq_('./util');

lineEndCapShapes = _dereq_('../core/lineEndCapShapes.coffee');

TextRenderer = _dereq_('./TextRenderer');

shapes = {};

defineShape = function(name, props) {
  var Shape, k;
  Shape = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    (_ref = props.constructor).call.apply(_ref, [this].concat(__slice.call(args)));
    return this;
  };
  if (props.toSVG == null) {
    props.toSVG = function() {
      return '';
    };
  }
  Shape.prototype.className = name;
  Shape.fromJSON = props.fromJSON;
  Shape.prototype.drawLatest = function(ctx, bufferCtx) {
    return this.draw(ctx, bufferCtx);
  };
  for (k in props) {
    if (k !== 'fromJSON') {
      Shape.prototype[k] = props[k];
    }
  }
  shapes[name] = Shape;
  return Shape;
};

createShape = function() {
  var args, name, s;
  name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  s = (function(func, args, ctor) {
    ctor.prototype = func.prototype;
    var child = new ctor, result = func.apply(child, args);
    return Object(result) === result ? result : child;
  })(shapes[name], args, function(){});
  s.id = util.getGUID();
  return s;
};

JSONToShape = function(_arg) {
  var className, data, id, shape;
  className = _arg.className, data = _arg.data, id = _arg.id;
  if (className in shapes) {
    shape = shapes[className].fromJSON(data);
    if (shape) {
      if (id) {
        shape.id = id;
      }
      return shape;
    } else {
      console.log('Unreadable shape:', className, data);
      return null;
    }
  } else {
    console.log("Unknown shape:", className, data);
    return null;
  }
};

shapeToJSON = function(shape) {
  return {
    className: shape.className,
    data: shape.toJSON(),
    id: shape.id
  };
};

bspline = function(points, order) {
  if (!order) {
    return points;
  }
  return bspline(_dual(_dual(_refine(points))), order - 1);
};

_refine = function(points) {
  var index, point, refined, _i, _len;
  points = [points[0]].concat(points).concat(util.last(points));
  refined = [];
  index = 0;
  for (_i = 0, _len = points.length; _i < _len; _i++) {
    point = points[_i];
    refined[index * 2] = point;
    if (points[index + 1]) {
      refined[index * 2 + 1] = _mid(point, points[index + 1]);
    }
    index += 1;
  }
  return refined;
};

_dual = function(points) {
  var dualed, index, point, _i, _len;
  dualed = [];
  index = 0;
  for (_i = 0, _len = points.length; _i < _len; _i++) {
    point = points[_i];
    if (points[index + 1]) {
      dualed[index] = _mid(point, points[index + 1]);
    }
    index += 1;
  }
  return dualed;
};

_mid = function(a, b) {
  return createShape('Point', {
    x: a.x + ((b.x - a.x) / 2),
    y: a.y + ((b.y - a.y) / 2),
    size: a.size + ((b.size - a.size) / 2),
    color: a.color
  });
};

defineShape('Image', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    return this.image = args.image || null;
  },
  draw: function(ctx, retryCallback) {
    if (this.image.width) {
      return ctx.drawImage(this.image, this.x, this.y);
    } else if (retryCallback) {
      return this.image.onload = retryCallback;
    }
  },
  getBoundingRect: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.image.width,
      height: this.image.height
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      imageSrc: this.image.src
    };
  },
  fromJSON: function(data) {
    var img;
    img = new Image();
    img.src = data.imageSrc;
    return createShape('Image', {
      x: data.x,
      x: data.y,
      image: img
    });
  },
  toSVG: function() {
    return "<image x='" + this.x + "' y='" + this.y + "' width='" + this.image.naturalWidth + "' height='" + this.image.naturalHeight + "' xlink:href='" + this.image.src + "' />";
  }
});

defineShape('Rectangle', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.width = args.width || 0;
    this.height = args.height || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.strokeColor = args.strokeColor || 'black';
    return this.fillColor = args.fillColor || 'transparent';
  },
  draw: function(ctx) {
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    return ctx.strokeRect(this.x, this.y, this.width, this.height);
  },
  getBoundingRect: function() {
    return {
      x: this.x - this.strokeWidth / 2,
      y: this.y - this.strokeWidth / 2,
      width: this.width + this.strokeWidth,
      height: this.height + this.strokeWidth
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor
    };
  },
  fromJSON: function(data) {
    return createShape('Rectangle', data);
  },
  toSVG: function() {
    return "<rect x='" + this.x + "' y='" + this.y + "' width='" + this.width + "' height='" + this.height + "' stroke='" + this.strokeColor + "' fill='" + this.fillColor + "' stroke-width='" + this.strokeWidth + "' />";
  }
});

defineShape('Ellipse', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.width = args.width || 0;
    this.height = args.height || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.strokeColor = args.strokeColor || 'black';
    return this.fillColor = args.fillColor || 'transparent';
  },
  draw: function(ctx) {
    var centerX, centerY, halfHeight, halfWidth;
    ctx.save();
    halfWidth = Math.floor(this.width / 2);
    halfHeight = Math.floor(this.height / 2);
    centerX = this.x + halfWidth;
    centerY = this.y + halfHeight;
    ctx.translate(centerX, centerY);
    ctx.scale(1, Math.abs(this.height / this.width));
    ctx.beginPath();
    ctx.arc(0, 0, Math.abs(halfWidth), 0, Math.PI * 2);
    ctx.closePath();
    ctx.restore();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    return ctx.stroke();
  },
  getBoundingRect: function() {
    return {
      x: this.x - this.strokeWidth / 2,
      y: this.y - this.strokeWidth / 2,
      width: this.width + this.strokeWidth,
      height: this.height + this.strokeWidth
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor
    };
  },
  fromJSON: function(data) {
    return createShape('Ellipse', data);
  },
  toSVG: function() {
    var centerX, centerY, halfHeight, halfWidth;
    halfWidth = Math.floor(this.width / 2);
    halfHeight = Math.floor(this.height / 2);
    centerX = this.x + halfWidth;
    centerY = this.y + halfHeight;
    return "<ellipse cx='" + centerX + "' cy='" + centerY + "' rx='" + halfWidth + "' ry='" + halfHeight + "' stroke='" + this.strokeColor + "' fill='" + this.fillColor + "' stroke-width='" + this.strokeWidth + "' />";
  }
});

defineShape('Line', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x1 = args.x1 || 0;
    this.y1 = args.y1 || 0;
    this.x2 = args.x2 || 0;
    this.y2 = args.y2 || 0;
    this.strokeWidth = args.strokeWidth || 1;
    this.strokeStyle = args.strokeStyle || null;
    this.color = args.color || 'black';
    this.capStyle = args.capStyle || 'round';
    this.endCapShapes = args.endCapShapes || [null, null];
    return this.dash = args.dash || null;
  },
  draw: function(ctx) {
    var arrowWidth;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.color;
    ctx.lineCap = this.capStyle;
    if (this.dash) {
      ctx.setLineDash(this.dash);
    }
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    if (this.dash) {
      ctx.setLineDash([]);
    }
    arrowWidth = Math.max(this.strokeWidth * 2.2, 5);
    if (this.endCapShapes[0]) {
      lineEndCapShapes[this.endCapShapes[0]].drawToCanvas(ctx, this.x1, this.y1, Math.atan2(this.y1 - this.y2, this.x1 - this.x2), arrowWidth, this.color);
    }
    if (this.endCapShapes[1]) {
      return lineEndCapShapes[this.endCapShapes[1]].drawToCanvas(ctx, this.x2, this.y2, Math.atan2(this.y2 - this.y1, this.x2 - this.x1), arrowWidth, this.color);
    }
  },
  getBoundingRect: function() {
    return {
      x: Math.min(this.x1, this.x2) - this.strokeWidth / 2,
      y: Math.min(this.y1, this.y2) - this.strokeWidth / 2,
      width: Math.abs(this.x2 - this.x1) + this.strokeWidth / 2,
      height: Math.abs(this.y2 - this.y1) + this.strokeWidth / 2
    };
  },
  toJSON: function() {
    return {
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      strokeWidth: this.strokeWidth,
      color: this.color,
      capStyle: this.capStyle,
      dash: this.dash,
      endCapShapes: this.endCapShapes
    };
  },
  fromJSON: function(data) {
    return createShape('Line', data);
  },
  toSVG: function() {
    var arrowWidth, capString, dashString;
    dashString = this.dash ? "stroke-dasharray='" + (this.dash.join(', ')) + "'" : '';
    capString = '';
    arrowWidth = Math.max(this.strokeWidth * 2.2, 5);
    if (this.endCapShapes[0]) {
      capString += lineEndCapShapes[this.endCapShapes[0]].svg(this.x1, this.y1, Math.atan2(this.y1 - this.y2, this.x1 - this.x2), arrowWidth, this.color);
    }
    if (this.endCapShapes[1]) {
      capString += lineEndCapShapes[this.endCapShapes[1]].svg(this.x2, this.y2, Math.atan2(this.y2 - this.y1, this.x2 - this.x1), arrowWidth, this.color);
    }
    return "<g> <line x1='" + this.x1 + "' y1='" + this.y1 + "' x2='" + this.x2 + "' y2='" + this.y2 + "' " + dashString + " stroke-linecap='" + this.capStyle + "' stroke='" + this.color + "'stroke-width='" + this.strokeWidth + "' /> " + capString + " <g>";
  }
});

_doAllPointsShareStyle = function(points) {
  var color, point, size, _i, _len;
  if (!points.length) {
    return false;
  }
  size = points[0].size;
  color = points[0].color;
  for (_i = 0, _len = points.length; _i < _len; _i++) {
    point = points[_i];
    if (!(point.size === size && point.color === color)) {
      console.log(size, color, point.size, point.color);
    }
    if (!(point.size === size && point.color === color)) {
      return false;
    }
  }
  return true;
};

_createLinePathFromData = function(shapeName, data) {
  var pointData, points, smoothedPoints, x, y;
  points = null;
  if (data.points) {
    points = (function() {
      var _i, _len, _ref, _results;
      _ref = data.points;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pointData = _ref[_i];
        _results.push(JSONToShape(pointData));
      }
      return _results;
    })();
  } else if (data.pointCoordinatePairs) {
    points = (function() {
      var _i, _len, _ref, _ref1, _results;
      _ref = data.pointCoordinatePairs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], x = _ref1[0], y = _ref1[1];
        _results.push(JSONToShape({
          className: 'Point',
          data: {
            x: x,
            y: y,
            size: data.pointSize,
            color: data.pointColor,
            smooth: data.smooth
          }
        }));
      }
      return _results;
    })();
  }
  smoothedPoints = null;
  if (data.smoothedPointCoordinatePairs) {
    smoothedPoints = (function() {
      var _i, _len, _ref, _ref1, _results;
      _ref = data.smoothedPointCoordinatePairs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], x = _ref1[0], y = _ref1[1];
        _results.push(JSONToShape({
          className: 'Point',
          data: {
            x: x,
            y: y,
            size: data.pointSize,
            color: data.pointColor,
            smooth: data.smooth
          }
        }));
      }
      return _results;
    })();
  }
  if (!points[0]) {
    return null;
  }
  return createShape(shapeName, {
    points: points,
    smoothedPoints: smoothedPoints,
    order: data.order,
    tailSize: data.tailSize,
    smooth: data.smooth
  });
};

linePathFuncs = {
  constructor: function(args) {
    var point, points, _i, _len, _results;
    if (args == null) {
      args = {};
    }
    points = args.points || [];
    this.order = args.order || 3;
    this.tailSize = args.tailSize || 3;
    this.smooth = 'smooth' in args ? args.smooth : true;
    this.segmentSize = Math.pow(2, this.order);
    this.sampleSize = this.tailSize + 1;
    if (args.smoothedPoints) {
      this.points = args.points;
      return this.smoothedPoints = args.smoothedPoints;
    } else {
      this.points = [];
      _results = [];
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        point = points[_i];
        _results.push(this.addPoint(point));
      }
      return _results;
    }
  },
  getBoundingRect: function() {
    return util.getBoundingRect(this.points.map(function(p) {
      return {
        x: p.x - p.size / 2,
        y: p.y - p.size / 2,
        width: p.size,
        height: p.size
      };
    }));
  },
  toJSON: function() {
    var p, point;
    if (_doAllPointsShareStyle(this.points)) {
      return {
        order: this.order,
        tailSize: this.tailSize,
        smooth: this.smooth,
        pointCoordinatePairs: (function() {
          var _i, _len, _ref, _results;
          _ref = this.points;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            point = _ref[_i];
            _results.push([point.x, point.y]);
          }
          return _results;
        }).call(this),
        smoothedPointCoordinatePairs: (function() {
          var _i, _len, _ref, _results;
          _ref = this.smoothedPoints;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            point = _ref[_i];
            _results.push([point.x, point.y]);
          }
          return _results;
        }).call(this),
        pointSize: this.points[0].size,
        pointColor: this.points[0].color
      };
    } else {
      return {
        order: this.order,
        tailSize: this.tailSize,
        smooth: this.smooth,
        points: (function() {
          var _i, _len, _ref, _results;
          _ref = this.points;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            _results.push(shapeToJSON(p));
          }
          return _results;
        }).call(this)
      };
    }
  },
  fromJSON: function(data) {
    return _createLinePathFromData('LinePath', data);
  },
  toSVG: function() {
    return "<polyline fill='none' points='" + (this.smoothedPoints.map(function(p) {
      return "" + p.x + "," + p.y;
    }).join(' ')) + "' stroke='" + this.points[0].color + "' stroke-width='" + this.points[0].size + "' />";
  },
  draw: function(ctx) {
    return this.drawPoints(ctx, this.smoothedPoints);
  },
  drawLatest: function(ctx, bufferCtx) {
    var drawEnd, drawStart, segmentStart;
    this.drawPoints(ctx, this.tail ? this.tail : this.smoothedPoints);
    if (this.tail) {
      segmentStart = this.smoothedPoints.length - this.segmentSize * this.tailSize;
      drawStart = segmentStart < this.segmentSize * 2 ? 0 : segmentStart;
      drawEnd = segmentStart + this.segmentSize + 1;
      return this.drawPoints(bufferCtx, this.smoothedPoints.slice(drawStart, drawEnd));
    }
  },
  addPoint: function(point) {
    this.points.push(point);
    if (!this.smooth) {
      this.smoothedPoints = this.points;
      return;
    }
    if (!this.smoothedPoints || this.points.length < this.sampleSize) {
      return this.smoothedPoints = bspline(this.points, this.order);
    } else {
      this.tail = util.last(bspline(util.last(this.points, this.sampleSize), this.order), this.segmentSize * this.tailSize);
      return this.smoothedPoints = this.smoothedPoints.slice(0, this.smoothedPoints.length - this.segmentSize * (this.tailSize - 1)).concat(this.tail);
    }
  },
  drawPoints: function(ctx, points) {
    var point, _i, _len, _ref;
    if (!points.length) {
      return;
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = points[0].color;
    ctx.lineWidth = points[0].size;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    _ref = points.slice(1);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      point = _ref[_i];
      ctx.lineTo(point.x, point.y);
    }
    return ctx.stroke();
  }
};

LinePath = defineShape('LinePath', linePathFuncs);

defineShape('ErasedLinePath', {
  constructor: linePathFuncs.constructor,
  toJSON: linePathFuncs.toJSON,
  addPoint: linePathFuncs.addPoint,
  drawPoints: linePathFuncs.drawPoints,
  getBoundingRect: linePathFuncs.getBoundingRect,
  draw: function(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    linePathFuncs.draw.call(this, ctx);
    return ctx.restore();
  },
  drawLatest: function(ctx, bufferCtx) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    bufferCtx.save();
    bufferCtx.globalCompositeOperation = "destination-out";
    linePathFuncs.drawLatest.call(this, ctx, bufferCtx);
    ctx.restore();
    return bufferCtx.restore();
  },
  fromJSON: function(data) {
    return _createLinePathFromData('ErasedLinePath', data);
  }
});

defineShape('Point', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.size = args.size || 0;
    return this.color = args.color || '';
  },
  lastPoint: function() {
    return this;
  },
  draw: function(ctx) {
    throw "not implemented";
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      size: this.size,
      color: this.color
    };
  },
  fromJSON: function(data) {
    return createShape('Point', data);
  }
});

defineShape('Text', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.v = args.v || 0;
    this.text = args.text || '';
    this.color = args.color || 'black';
    this.font = args.font || '18px sans-serif';
    this.forcedWidth = args.forcedWidth || null;
    return this.forcedHeight = args.forcedHeight || null;
  },
  _makeRenderer: function(ctx) {
    ctx.lineHeight = 1.2;
    this.renderer = new TextRenderer(ctx, this.text, this.font, this.forcedWidth, this.forcedHeight);
    if (this.v < 1) {
      console.log('repairing baseline');
      this.v = 1;
      this.x -= this.renderer.metrics.bounds.minx;
      return this.y -= this.renderer.metrics.leading - this.renderer.metrics.descent;
    }
  },
  draw: function(ctx, bufferCtx) {
    if (!this.renderer) {
      this._makeRenderer(ctx);
    }
    ctx.fillStyle = this.color;
    return this.renderer.draw(ctx, this.x, this.y);
  },
  setText: function(text) {
    this.text = text;
    return this.renderer = null;
  },
  setFont: function(font) {
    this.font = font;
    return this.renderer = null;
  },
  setPosition: function(x, y) {
    this.x = x;
    return this.y = y;
  },
  setSize: function(forcedWidth, forcedHeight) {
    this.forcedWidth = Math.max(forcedWidth, 0);
    this.forcedHeight = Math.max(forcedHeight, 0);
    return this.renderer = null;
  },
  enforceMaxBoundingRect: function(lc) {
    var br, dx, lcBoundingRect;
    br = this.getBoundingRect(lc.ctx);
    lcBoundingRect = {
      x: -lc.position.x / lc.scale,
      y: -lc.position.y / lc.scale,
      width: lc.canvas.width / lc.scale,
      height: lc.canvas.height / lc.scale
    };
    if (br.x + br.width > lcBoundingRect.x + lcBoundingRect.width) {
      dx = br.x - lcBoundingRect.x;
      this.forcedWidth = lcBoundingRect.width - dx - 10;
      return this.renderer = null;
    }
  },
  getBoundingRect: function(ctx, isEditing) {
    if (isEditing == null) {
      isEditing = false;
    }
    if (!this.renderer) {
      if (ctx) {
        this._makeRenderer(ctx);
      } else {
        throw "Must pass ctx if text hasn't been rendered yet";
      }
    }
    return {
      x: this.x,
      y: this.y,
      width: this.renderer.getWidth(true),
      height: this.renderer.getHeight()
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      text: this.text,
      color: this.color,
      font: this.font,
      forcedWidth: this.forcedWidth,
      forcedHeight: this.forcedHeight,
      v: this.v
    };
  },
  fromJSON: function(data) {
    return createShape('Text', data);
  },
  toSVG: function() {
    var heightString, textSplitOnLines, widthString;
    widthString = this.forcedWidth ? "width='" + this.forcedWidth + "px'" : "";
    heightString = this.forcedHeight ? "height='" + this.forcedHeight + "px'" : "";
    textSplitOnLines = this.text.split(/\r\n|\r|\n/g);
    if (this.renderer) {
      textSplitOnLines = this.renderer.lines;
    }
    return "<text x='" + this.x + "' y='" + this.y + "' " + widthString + " " + heightString + " fill='" + this.color + "' style='font: " + this.font + ";'> " + (textSplitOnLines.map((function(_this) {
      return function(line, i) {
        var dy;
        dy = i === 0 ? 0 : '1.2em';
        return "<tspan x='" + _this.x + "' dy='" + dy + "' alignment-baseline='text-before-edge'>" + line + "</tspan>";
      };
    })(this)).join('')) + " </text>";
  }
});

HANDLE_SIZE = 10;

MARGIN = 4;

defineShape('SelectionBox', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.shape = args.shape;
    this.backgroundColor = args.backgroundColor || null;
    return this._br = this.shape.getBoundingRect(args.ctx);
  },
  draw: function(ctx) {
    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(this._br.x - MARGIN, this._br.y - MARGIN, this._br.width + MARGIN * 2, this._br.height + MARGIN * 2);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(this._br.x - MARGIN, this._br.y - MARGIN, this._br.width + MARGIN * 2, this._br.height + MARGIN * 2);
    ctx.setLineDash([]);
    this._drawHandle(ctx, this.getTopLeftHandleRect());
    this._drawHandle(ctx, this.getTopRightHandleRect());
    this._drawHandle(ctx, this.getBottomLeftHandleRect());
    return this._drawHandle(ctx, this.getBottomRightHandleRect());
  },
  _drawHandle: function(ctx, _arg) {
    var x, y;
    x = _arg.x, y = _arg.y;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeStyle = '#000';
    return ctx.strokeRect(x, y, HANDLE_SIZE, HANDLE_SIZE);
  },
  getTopLeftHandleRect: function() {
    return {
      x: this._br.x - HANDLE_SIZE - MARGIN,
      y: this._br.y - HANDLE_SIZE - MARGIN,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE
    };
  },
  getBottomLeftHandleRect: function() {
    return {
      x: this._br.x - HANDLE_SIZE - MARGIN,
      y: this._br.y + this._br.height + MARGIN,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE
    };
  },
  getTopRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + MARGIN,
      y: this._br.y - HANDLE_SIZE - MARGIN,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE
    };
  },
  getBottomRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + MARGIN,
      y: this._br.y + this._br.height + MARGIN,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE
    };
  },
  getBoundingRect: function() {
    return {
      x: this._br.x - MARGIN,
      y: this._br.y - MARGIN,
      width: this._br.width + MARGIN * 2,
      height: this._br.height + MARGIN * 2
    };
  },
  toSVG: function() {
    return "";
  }
});

module.exports = {
  defineShape: defineShape,
  createShape: createShape,
  JSONToShape: JSONToShape,
  shapeToJSON: shapeToJSON
};


},{"../core/lineEndCapShapes.coffee":7,"./TextRenderer":3,"./util":11}],11:[function(_dereq_,module,exports){
var slice, util,
  __slice = [].slice;

slice = Array.prototype.slice;

util = {
  last: function(array, n) {
    if (n == null) {
      n = null;
    }
    if (n) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  },
  matchElementSize: function(elementToMatch, elementsToResize, scale, callback) {
    var resize;
    if (callback == null) {
      callback = function() {};
    }
    resize = (function(_this) {
      return function() {
        var el, _i, _len;
        for (_i = 0, _len = elementsToResize.length; _i < _len; _i++) {
          el = elementsToResize[_i];
          el.style.width = "" + elementToMatch.offsetWidth + "px";
          el.style.height = "" + elementToMatch.offsetHeight + "px";
          if (el.width != null) {
            el.setAttribute('width', el.offsetWidth * scale);
            el.setAttribute('height', el.offsetHeight * scale);
          }
        }
        return callback();
      };
    })(this);
    elementToMatch.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return resize();
  },
  combineCanvases: function() {
    var c, canvas, canvases, ctx, _i, _j, _len, _len1;
    canvases = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    c = document.createElement('canvas');
    c.width = canvases[0].width;
    c.height = canvases[0].height;
    for (_i = 0, _len = canvases.length; _i < _len; _i++) {
      canvas = canvases[_i];
      c.width = Math.max(canvas.width, c.width);
      c.height = Math.max(canvas.height, c.height);
    }
    ctx = c.getContext('2d');
    for (_j = 0, _len1 = canvases.length; _j < _len1; _j++) {
      canvas = canvases[_j];
      ctx.drawImage(canvas, 0, 0);
      ctx.drawImage(canvas, 0, 0);
    }
    return c;
  },
  renderShapes: function(shapes, bounds, scale, canvas) {
    var ctx, shape, _i, _len;
    if (scale == null) {
      scale = 1;
    }
    if (canvas == null) {
      canvas = null;
    }
    canvas = canvas || document.createElement('canvas');
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    ctx = canvas.getContext('2d');
    ctx.translate(-bounds.x * scale, -bounds.y * scale);
    ctx.scale(scale, scale);
    for (_i = 0, _len = shapes.length; _i < _len; _i++) {
      shape = shapes[_i];
      shape.draw(ctx);
    }
    return canvas;
  },
  getBoundingRect: function(rects, width, height) {
    var maxX, maxY, minX, minY, rect, _i, _len;
    if (!rects.length) {
      return {
        x: 0,
        y: 0,
        width: 0 || width,
        height: 0 || height
      };
    }
    minX = rects[0].x;
    minY = rects[0].y;
    maxX = rects[0].x + rects[0].width;
    maxY = rects[0].y + rects[0].height;
    for (_i = 0, _len = rects.length; _i < _len; _i++) {
      rect = rects[_i];
      minX = Math.floor(Math.min(rect.x, minX));
      minY = Math.floor(Math.min(rect.y, minY));
      maxX = Math.ceil(Math.max(maxX, rect.x + rect.width));
      maxY = Math.ceil(Math.max(maxY, rect.y + rect.height));
    }
    minX = width ? 0 : minX;
    minY = height ? 0 : minY;
    maxX = width || maxX;
    maxY = height || maxY;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  getBackingScale: function(context) {
    if (window.devicePixelRatio == null) {
      return 1;
    }
    if (!(window.devicePixelRatio > 1)) {
      return 1;
    }
    return window.devicePixelRatio;
  },
  requestAnimationFrame: (window.requestAnimationFrame || window.setTimeout).bind(window),
  getGUID: (function() {
    var s4;
    s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return function() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
  })()
};

module.exports = util;


},{}],12:[function(_dereq_,module,exports){
(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   };

  CustomEvent.prototype = window.CustomEvent.prototype;

  window.CustomEvent = CustomEvent;
})();
},{}],13:[function(_dereq_,module,exports){
var hasWarned = false;
if (!CanvasRenderingContext2D.prototype.setLineDash) {
  CanvasRenderingContext2D.prototype.setLineDash = function() {
    // no-op
    if (!hasWarned) {
      console.warn("context2D.setLineDash is a no-op in this browser.");
      hasWarned = true;
    }
  }
}
module.exports = null;
},{}],14:[function(_dereq_,module,exports){
var LiterallyCanvas, baseTools, defaultImageURLPrefix, defineOptionsStyle, init, initReact, localize, registerJQueryPlugin, setDefaultImageURLPrefix, shapes, tools, util;

_dereq_('./ie_customevent');

_dereq_('./ie_setLineDash');

LiterallyCanvas = _dereq_('./core/LiterallyCanvas');

initReact = _dereq_('./reactGUI/init');

shapes = _dereq_('./core/shapes');

util = _dereq_('./core/util');

localize = _dereq_('./core/localization').localize;

_dereq_('./optionsStyles/font');

_dereq_('./optionsStyles/stroke-width');

_dereq_('./optionsStyles/line-options-and-stroke-width');

_dereq_('./optionsStyles/null');

defineOptionsStyle = _dereq_('./optionsStyles/optionsStyles').defineOptionsStyle;

baseTools = _dereq_('./tools/base');

tools = {
  Pencil: _dereq_('./tools/Pencil'),
  Eraser: _dereq_('./tools/Eraser'),
  Line: _dereq_('./tools/Line'),
  Rectangle: _dereq_('./tools/Rectangle'),
  Ellipse: _dereq_('./tools/Ellipse'),
  Text: _dereq_('./tools/Text'),
  Pan: _dereq_('./tools/Pan'),
  Eyedropper: _dereq_('./tools/Eyedropper'),
  Tool: baseTools.Tool,
  ToolWithStroke: baseTools.ToolWithStroke
};

defaultImageURLPrefix = 'lib/img';

setDefaultImageURLPrefix = function(newDefault) {
  return defaultImageURLPrefix = newDefault;
};

init = function(el, opts) {
  var child, drawingViewElement, lc, optionsElement, pickerElement, _i, _len, _ref;
  if (opts == null) {
    opts = {};
  }
  if (opts.imageURLPrefix == null) {
    opts.imageURLPrefix = defaultImageURLPrefix;
  }
  if (opts.primaryColor == null) {
    opts.primaryColor = '#000';
  }
  if (opts.secondaryColor == null) {
    opts.secondaryColor = '#fff';
  }
  if (opts.backgroundColor == null) {
    opts.backgroundColor = 'transparent';
  }
  if (opts.keyboardShortcuts == null) {
    opts.keyboardShortcuts = true;
  }
  if (opts.imageSize == null) {
    opts.imageSize = {
      width: 'infinite',
      height: 'infinite'
    };
  }
  if (opts.backgroundShapes == null) {
    opts.backgroundShapes = [];
  }
  if (opts.watermarkImage == null) {
    opts.watermarkImage = null;
  }
  if (opts.watermarkScale == null) {
    opts.watermarkScale = 1;
  }
  if (!('tools' in opts)) {
    opts.tools = [tools.Pencil, tools.Eraser, tools.Line, tools.Rectangle, tools.Ellipse, tools.Text, tools.Pan, tools.Eyedropper];
  }

  /* henceforth, all pre-existing DOM children shall be destroyed */
  _ref = el.children;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    child = _ref[_i];
    el.removeChild(child);
  }

  /* and now we rebuild the city */
  if ([' ', ' '].join(el.className).indexOf(' literally ') === -1) {
    el.className = el.className + ' literally';
  }
  pickerElement = document.createElement('div');
  pickerElement.className = 'lc-picker';
  drawingViewElement = document.createElement('div');
  drawingViewElement.className = 'lc-drawing';
  optionsElement = document.createElement('div');
  optionsElement.className = 'lc-options';
  el.appendChild(pickerElement);
  el.appendChild(drawingViewElement);
  el.appendChild(optionsElement);

  /* and get to work */
  lc = new LiterallyCanvas(drawingViewElement, opts);
  initReact(pickerElement, optionsElement, lc, opts.tools, opts.imageURLPrefix);
  if ('onInit' in opts) {
    opts.onInit(lc);
  }
  return lc;
};

registerJQueryPlugin = function(_$) {
  return _$.fn.literallycanvas = function(opts) {
    if (opts == null) {
      opts = {};
    }
    this.each((function(_this) {
      return function(ix, el) {
        return el.literallycanvas = init(el, opts);
      };
    })(this));
    return this;
  };
};

window.LC = {
  init: init
};

if (window.$) {
  registerJQueryPlugin(window.$);
}

module.exports = {
  init: init,
  registerJQueryPlugin: registerJQueryPlugin,
  util: util,
  tools: tools,
  defineOptionsStyle: defineOptionsStyle,
  setDefaultImageURLPrefix: setDefaultImageURLPrefix,
  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,
  localize: localize
};


},{"./core/LiterallyCanvas":2,"./core/localization":8,"./core/shapes":10,"./core/util":11,"./ie_customevent":12,"./ie_setLineDash":13,"./optionsStyles/font":15,"./optionsStyles/line-options-and-stroke-width":16,"./optionsStyles/null":17,"./optionsStyles/optionsStyles":18,"./optionsStyles/stroke-width":19,"./reactGUI/init":30,"./tools/Ellipse":31,"./tools/Eraser":32,"./tools/Eyedropper":33,"./tools/Line":34,"./tools/Pan":35,"./tools/Pencil":36,"./tools/Rectangle":37,"./tools/Text":38,"./tools/base":39}],15:[function(_dereq_,module,exports){
var defineOptionsStyle, _;

defineOptionsStyle = _dereq_('./optionsStyles').defineOptionsStyle;

_ = _dereq_('../core/localization')._;

defineOptionsStyle('font', React.createClass({
  displayName: 'FontOptions',
  getInitialState: function() {
    return {
      isItalic: false,
      isBold: false,
      fontFamilyIndex: 0,
      fontSizeIndex: 4
    };
  },
  getFontSizes: function() {
    return [9, 10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288];
  },
  getFamilies: function() {
    var lc;
    lc = this.props.lc;
    return [
      {
        name: _('Sans-serif'),
        value: '"Helvetica Neue",Helvetica,Arial,sans-serif'
      }, {
        name: _('Serif'),
        value: ('Garamond,Baskerville,"Baskerville Old Face",', '"Hoefler Text","Times New Roman",serif')
      }, {
        name: _('Typewriter'),
        value: ('"Courier New",Courier,"Lucida Sans Typewriter",', '"Lucida Typewriter",monospace')
      }
    ];
  },
  updateTool: function(newState) {
    var fontSize, items, k;
    if (newState == null) {
      newState = {};
    }
    for (k in this.state) {
      if (!(k in newState)) {
        newState[k] = this.state[k];
      }
    }
    fontSize = this.getFontSizes()[newState.fontSizeIndex];
    items = [];
    if (newState.isItalic) {
      items.push('italic');
    }
    if (newState.isBold) {
      items.push('bold');
    }
    items.push("" + fontSize + "px");
    items.push(this.getFamilies()[newState.fontFamilyIndex].value);
    this.props.lc.tool.font = items.join(' ');
    return this.props.lc.trigger('setFont', items.join(' '));
  },
  handleFontSize: function(event) {
    var newState;
    newState = {
      fontSizeIndex: event.target.value
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleFontFamily: function(event) {
    var newState;
    newState = {
      fontFamilyIndex: event.target.value
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleItalic: function(event) {
    var newState;
    newState = {
      isItalic: !this.state.isItalic
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  handleBold: function(event) {
    var newState;
    newState = {
      isBold: !this.state.isBold
    };
    this.setState(newState);
    return this.updateTool(newState);
  },
  componentDidMount: function() {
    return this.updateTool();
  },
  render: function() {
    var br, div, input, label, lc, option, select, span, _ref;
    lc = this.props.lc;
    _ref = React.DOM, div = _ref.div, input = _ref.input, select = _ref.select, option = _ref.option, br = _ref.br, label = _ref.label, span = _ref.span;
    return div({
      className: 'lc-font-settings'
    }, _("Size: "), select({
      value: this.state.fontSizeIndex,
      onChange: this.handleFontSize
    }, this.getFontSizes().map((function(_this) {
      return function(size, ix) {
        return option({
          value: ix,
          key: ix
        }, size);
      };
    })(this))), select({
      value: this.state.fontFamilyIndex,
      onChange: this.handleFontFamily
    }, this.getFamilies().map((function(_this) {
      return function(family, ix) {
        return option({
          value: ix,
          key: ix
        }, family.name);
      };
    })(this))), label({
      htmlFor: 'italic'
    }, input({
      type: 'checkbox',
      id: 'italic',
      checked: this.state.isItalic,
      onChange: this.handleItalic
    }, _("italic"))), label({
      htmlFor: 'bold'
    }, input({
      type: 'checkbox',
      id: 'bold',
      checked: this.state.isBold,
      onChange: this.handleBold
    }, _("bold"))));
  }
}));

module.exports = {};


},{"../core/localization":8,"./optionsStyles":18}],16:[function(_dereq_,module,exports){
var StrokeWidthPicker, createSetStateOnEventMixin, defineOptionsStyle;

defineOptionsStyle = _dereq_('./optionsStyles').defineOptionsStyle;

StrokeWidthPicker = _dereq_('../reactGUI/StrokeWidthPicker');

createSetStateOnEventMixin = _dereq_('../reactGUI/createSetStateOnEventMixin');

defineOptionsStyle('line-options-and-stroke-width', React.createClass({
  displayName: 'LineOptionsAndStrokeWidth',
  getState: function() {
    return {
      strokeWidth: this.props.tool.strokeWidth,
      isDashed: this.props.tool.isDashed,
      hasEndArrow: this.props.tool.hasEndArrow
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  render: function() {
    var arrowButtonClass, dashButtonClass, div, img, li, toggleIsDashed, togglehasEndArrow, ul, _ref;
    _ref = React.DOM, div = _ref.div, ul = _ref.ul, li = _ref.li, img = _ref.img;
    toggleIsDashed = (function(_this) {
      return function() {
        _this.props.tool.isDashed = !_this.props.tool.isDashed;
        return _this.setState(_this.getState());
      };
    })(this);
    togglehasEndArrow = (function(_this) {
      return function() {
        _this.props.tool.hasEndArrow = !_this.props.tool.hasEndArrow;
        return _this.setState(_this.getState());
      };
    })(this);
    dashButtonClass = React.addons.classSet({
      'basic-button square-button': true,
      'selected': this.state.isDashed
    });
    arrowButtonClass = React.addons.classSet({
      'basic-button square-button': true,
      'selected': this.state.hasEndArrow
    });
    return div({}, ul({
      className: 'button-row',
      style: {
        float: 'left',
        marginRight: 20
      }
    }, li({}, div({
      className: dashButtonClass,
      onClick: toggleIsDashed
    }, img({
      src: "" + this.props.imageURLPrefix + "/dashed-line.png"
    }))), li({}, div({
      className: arrowButtonClass,
      onClick: togglehasEndArrow
    }, img({
      src: "" + this.props.imageURLPrefix + "/line-with-arrow.png"
    })))), StrokeWidthPicker({
      tool: this.props.tool,
      lc: this.props.lc
    }));
  }
}));

module.exports = {};


},{"../reactGUI/StrokeWidthPicker":25,"../reactGUI/createSetStateOnEventMixin":28,"./optionsStyles":18}],17:[function(_dereq_,module,exports){
var defineOptionsStyle;

defineOptionsStyle = _dereq_('./optionsStyles').defineOptionsStyle;

defineOptionsStyle('null', React.createClass({
  displayName: 'NoOptions',
  render: function() {
    return React.DOM.div();
  }
}));

module.exports = {};


},{"./optionsStyles":18}],18:[function(_dereq_,module,exports){
var defineOptionsStyle, optionsStyles;

optionsStyles = {};

defineOptionsStyle = function(name, style) {
  return optionsStyles[name] = style;
};

module.exports = {
  optionsStyles: optionsStyles,
  defineOptionsStyle: defineOptionsStyle
};


},{}],19:[function(_dereq_,module,exports){
var StrokeWidthPicker, defineOptionsStyle;

defineOptionsStyle = _dereq_('./optionsStyles').defineOptionsStyle;

StrokeWidthPicker = _dereq_('../reactGUI/StrokeWidthPicker');

defineOptionsStyle('stroke-width', StrokeWidthPicker);

module.exports = {};


},{"../reactGUI/StrokeWidthPicker":25,"./optionsStyles":18}],20:[function(_dereq_,module,exports){
var ClearButton, React, createSetStateOnEventMixin, _;

React = _dereq_('./React-shim');

createSetStateOnEventMixin = _dereq_('./createSetStateOnEventMixin');

_ = _dereq_('../core/localization')._;

ClearButton = React.createClass({
  displayName: 'ClearButton',
  getState: function() {
    return {
      isEnabled: this.props.lc.canUndo()
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('drawingChange')],
  render: function() {
    var className, div, lc, onClick;
    div = React.DOM.div;
    lc = this.props.lc;
    className = React.addons.classSet({
      'lc-clear': true,
      'toolbar-button': true,
      'fat-button': true,
      'disabled': !this.state.isEnabled
    });
    onClick = lc.canUndo() ? ((function(_this) {
      return function() {
        return lc.clear();
      };
    })(this)) : function() {};
    return div({
      className: className,
      onClick: onClick
    }, _('Clear'));
  }
});

module.exports = ClearButton;


},{"../core/localization":8,"./React-shim":24,"./createSetStateOnEventMixin":28}],21:[function(_dereq_,module,exports){
var ColorWell, React;

React = _dereq_('./React-shim');

ColorWell = React.createClass({
  displayName: 'ColorWell',
  getState: function() {
    return {
      color: this.props.lc.colors[this.props.colorName],
      isPickerVisible: false
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  componentDidMount: function() {
    return this.unsubscribe = this.props.lc.on("" + this.props.colorName + "ColorChange", (function(_this) {
      return function() {
        return _this.setState({
          color: _this.props.lc.colors[_this.props.colorName]
        });
      };
    })(this));
  },
  componentWillUnmount: function() {
    return this.unsubscribe();
  },
  togglePicker: function() {
    return this.setState({
      isPickerVisible: !this.state.isPickerVisible
    });
  },
  closePicker: function() {
    return this.setState({
      isPickerVisible: false
    });
  },
  setColor: function(c) {
    return this.props.lc.setColor(this.props.colorName, c);
  },
  render: function() {
    var div, label, _ref;
    _ref = React.DOM, div = _ref.div, label = _ref.label;
    return div({
      className: 'toolbar-button color-well-label fat-button',
      onMouseLeave: this.closePicker,
      onClick: this.togglePicker
    }, label({
      style: {
        display: 'block',
        clear: 'both'
      }
    }, this.props.label), div({
      className: React.addons.classSet({
        'color-well-container': true,
        'selected': this.state.isPickerVisible
      }),
      style: {
        backgroundColor: 'white'
      }
    }, div({
      className: 'color-well-checker'
    }), div({
      className: 'color-well-checker',
      style: {
        left: '50%',
        top: '50%'
      }
    }), div({
      className: 'color-well-color',
      style: {
        backgroundColor: this.state.color
      }
    }, " "), this.renderPicker()));
  },
  renderPicker: function() {
    var div, hue, i, renderTransparentCell, rows, _i, _len, _ref;
    div = React.DOM.div;
    if (!this.state.isPickerVisible) {
      return null;
    }
    renderTransparentCell = (function(_this) {
      return function() {
        return div({
          className: 'color-row',
          key: 0,
          style: {
            height: 20
          }
        }, div({
          className: React.addons.classSet({
            'color-cell transparent-cell': true,
            'selected': _this.state.color === 'transparent'
          }),
          onClick: function() {
            return _this.setColor('transparent');
          }
        }, 'transparent'));
      };
    })(this);
    rows = [];
    rows.push('transparent');
    rows.push((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; _i <= 100; i = _i += 10) {
        _results.push("hsl(0, 0%, " + i + "%)");
      }
      return _results;
    })());
    _ref = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      hue = _ref[_i];
      rows.push((function() {
        var _j, _results;
        _results = [];
        for (i = _j = 10; _j <= 90; i = _j += 8) {
          _results.push("hsl(" + hue + ", 100%, " + i + "%)");
        }
        return _results;
      })());
    }
    return div({
      className: 'color-picker-popup'
    }, rows.map((function(_this) {
      return function(row, ix) {
        if (row === 'transparent') {
          return renderTransparentCell();
        }
        return div({
          className: 'color-row',
          key: ix,
          style: {
            width: 20 * row.length
          }
        }, row.map(function(cellColor, ix2) {
          var className;
          className = React.addons.classSet({
            'color-cell': true,
            'selected': _this.state.color === cellColor
          });
          return div({
            className: className,
            onClick: function() {
              return _this.setColor(cellColor);
            },
            style: {
              backgroundColor: cellColor
            },
            key: ix2
          });
        }));
      };
    })(this)));
  }
});

module.exports = ColorWell;


},{"./React-shim":24}],22:[function(_dereq_,module,exports){
var Options, React, createSetStateOnEventMixin, optionsStyles;

React = _dereq_('./React-shim');

createSetStateOnEventMixin = _dereq_('./createSetStateOnEventMixin');

optionsStyles = _dereq_('../optionsStyles/optionsStyles').optionsStyles;

Options = React.createClass({
  displayName: 'Options',
  getState: function() {
    var _ref;
    return {
      style: (_ref = this.props.lc.tool) != null ? _ref.optionsStyle : void 0,
      tool: this.props.lc.tool
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  render: function() {
    var style;
    style = "" + this.state.style;
    return optionsStyles[style]({
      lc: this.props.lc,
      tool: this.state.tool,
      imageURLPrefix: this.props.imageURLPrefix
    });
  }
});

module.exports = Options;


},{"../optionsStyles/optionsStyles":18,"./React-shim":24,"./createSetStateOnEventMixin":28}],23:[function(_dereq_,module,exports){
var ClearButton, ColorPickers, ColorWell, Picker, React, UndoRedoButtons, ZoomButtons, _;

React = _dereq_('./React-shim');

ClearButton = _dereq_('./ClearButton');

ColorWell = _dereq_('./ColorWell');

UndoRedoButtons = _dereq_('./UndoRedoButtons');

ZoomButtons = _dereq_('./ZoomButtons');

_ = _dereq_('../core/localization')._;

ColorPickers = React.createClass({
  displayName: 'ColorPickers',
  render: function() {
    var div, lc;
    lc = this.props.lc;
    div = React.DOM.div;
    return div({
      className: 'lc-color-pickers'
    }, ColorWell({
      lc: lc,
      colorName: 'background',
      label: _('background')
    }), ColorWell({
      lc: lc,
      colorName: 'primary',
      label: _('stroke')
    }), ColorWell({
      lc: lc,
      colorName: 'secondary',
      label: _('fill')
    }));
  }
});

Picker = React.createClass({
  displayName: 'Picker',
  getInitialState: function() {
    return {
      selectedToolIndex: 0
    };
  },
  render: function() {
    var div, imageURLPrefix, lc, toolButtonComponents, _ref;
    div = React.DOM.div;
    _ref = this.props, toolButtonComponents = _ref.toolButtonComponents, lc = _ref.lc, imageURLPrefix = _ref.imageURLPrefix;
    return div({
      className: 'lc-picker-contents'
    }, toolButtonComponents.map((function(_this) {
      return function(component, ix) {
        return component({
          lc: lc,
          imageURLPrefix: imageURLPrefix,
          key: ix,
          isSelected: ix === _this.state.selectedToolIndex,
          onSelect: function(tool) {
            lc.setTool(tool);
            return _this.setState({
              selectedToolIndex: ix
            });
          }
        });
      };
    })(this)), toolButtonComponents.length % 2 !== 0 ? div({
      className: 'toolbar-button thin-button disabled'
    }) : void 0, UndoRedoButtons({
      lc: lc,
      imageURLPrefix: imageURLPrefix
    }), ZoomButtons({
      lc: lc,
      imageURLPrefix: imageURLPrefix
    }), ClearButton({
      lc: lc
    }), ColorPickers({
      lc: lc
    }));
  }
});

module.exports = Picker;


},{"../core/localization":8,"./ClearButton":20,"./ColorWell":21,"./React-shim":24,"./UndoRedoButtons":26,"./ZoomButtons":27}],24:[function(_dereq_,module,exports){
var React;

try {
  React = _dereq_('React/addons');
} catch (_error) {
  React = window.React;
}

if ((React != null ? React.addons : void 0) == null) {
  throw "Can't find React (you need the version with addons)";
}

module.exports = React;


},{}],25:[function(_dereq_,module,exports){
var createSetStateOnEventMixin;

createSetStateOnEventMixin = _dereq_('../reactGUI/createSetStateOnEventMixin');

module.exports = React.createClass({
  displayName: 'StrokeWidthPicker',
  getState: function() {
    return {
      strokeWidth: this.props.tool.strokeWidth
    };
  },
  getInitialState: function() {
    return this.getState();
  },
  mixins: [createSetStateOnEventMixin('toolChange')],
  render: function() {
    var circle, div, getItem, li, strokeWidths, svg, ul, _ref;
    _ref = React.DOM, ul = _ref.ul, li = _ref.li, svg = _ref.svg, circle = _ref.circle, div = _ref.div;
    strokeWidths = [1, 2, 5, 10, 20, 30];
    getItem = (function(_this) {
      return function(strokeWidth) {};
    })(this);
    return ul({
      className: 'button-row'
    }, strokeWidths.map((function(_this) {
      return function(strokeWidth, ix) {
        var buttonClassName, buttonSize;
        buttonClassName = React.addons.classSet({
          'basic-button': true,
          'selected': strokeWidth === _this.state.strokeWidth
        });
        buttonSize = 30;
        return li({
          className: 'lc-stroke-width',
          key: strokeWidth
        }, div({
          className: buttonClassName,
          onClick: function() {
            _this.props.tool.strokeWidth = strokeWidth;
            return _this.setState(_this.getState());
          }
        }, svg({
          width: buttonSize,
          height: buttonSize,
          viewPort: "0 0 " + strokeWidth + " " + strokeWidth,
          version: "1.1",
          xmlns: "http://www.w3.org/2000/svg"
        }, circle({
          cx: Math.ceil(buttonSize / 2),
          cy: Math.ceil(buttonSize / 2),
          r: strokeWidth / 2
        }))));
      };
    })(this)));
  }
});


},{"../reactGUI/createSetStateOnEventMixin":28}],26:[function(_dereq_,module,exports){
var React, RedoButton, UndoButton, UndoRedoButtons, createSetStateOnEventMixin, createUndoRedoButtonComponent;

React = _dereq_('./React-shim');

createSetStateOnEventMixin = _dereq_('./createSetStateOnEventMixin');

createUndoRedoButtonComponent = function(undoOrRedo) {
  return React.createClass({
    displayName: undoOrRedo === 'undo' ? 'UndoButton' : 'RedoButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case undoOrRedo !== 'undo':
              return this.props.lc.canUndo();
            case undoOrRedo !== 'redo':
              return this.props.lc.canRedo();
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('drawingChange')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, src, style, title, _ref, _ref1;
      _ref = React.DOM, div = _ref.div, img = _ref.img;
      _ref1 = this.props, lc = _ref1.lc, imageURLPrefix = _ref1.imageURLPrefix;
      title = undoOrRedo === 'undo' ? 'Undo' : 'Redo';
      className = ("lc-" + undoOrRedo + " ") + React.addons.classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case undoOrRedo !== 'undo':
            return function() {
              return lc.undo();
            };
          case undoOrRedo !== 'redo':
            return function() {
              return lc.redo();
            };
        }
      }).call(this);
      src = "" + imageURLPrefix + "/" + undoOrRedo + ".png";
      style = {
        backgroundImage: "url(" + src + ")"
      };
      return div({
        className: className,
        onClick: onClick,
        title: title,
        style: style
      });
    }
  });
};

UndoButton = createUndoRedoButtonComponent('undo');

RedoButton = createUndoRedoButtonComponent('redo');

UndoRedoButtons = React.createClass({
  displayName: 'UndoRedoButtons',
  render: function() {
    var div;
    div = React.DOM.div;
    return div({
      className: 'lc-undo-redo'
    }, UndoButton(this.props), RedoButton(this.props));
  }
});

module.exports = UndoRedoButtons;


},{"./React-shim":24,"./createSetStateOnEventMixin":28}],27:[function(_dereq_,module,exports){
var React, ZoomButtons, ZoomInButton, ZoomOutButton, createSetStateOnEventMixin, createZoomButtonComponent;

React = _dereq_('./React-shim');

createSetStateOnEventMixin = _dereq_('./createSetStateOnEventMixin');

createZoomButtonComponent = function(inOrOut) {
  return React.createClass({
    displayName: inOrOut === 'in' ? 'ZoomInButton' : 'ZoomOutButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case inOrOut !== 'in':
              return this.props.lc.scale < 4.0;
            case inOrOut !== 'out':
              return this.props.lc.scale > 0.6;
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('zoom')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, src, style, title, _ref, _ref1;
      _ref = React.DOM, div = _ref.div, img = _ref.img;
      _ref1 = this.props, lc = _ref1.lc, imageURLPrefix = _ref1.imageURLPrefix;
      title = inOrOut === 'in' ? 'Zoom in' : 'Zoom out';
      className = ("lc-zoom-" + inOrOut + " ") + React.addons.classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case inOrOut !== 'in':
            return function() {
              return lc.zoom(0.2);
            };
          case inOrOut !== 'out':
            return function() {
              return lc.zoom(-0.2);
            };
        }
      }).call(this);
      src = "" + imageURLPrefix + "/zoom-" + inOrOut + ".png";
      style = {
        backgroundImage: "url(" + src + ")"
      };
      return div({
        className: className,
        onClick: onClick,
        title: title,
        style: style
      });
    }
  });
};

ZoomOutButton = createZoomButtonComponent('out');

ZoomInButton = createZoomButtonComponent('in');

ZoomButtons = React.createClass({
  displayName: 'ZoomButtons',
  render: function() {
    var div;
    div = React.DOM.div;
    return div({
      className: 'lc-zoom'
    }, ZoomOutButton(this.props), ZoomInButton(this.props));
  }
});

module.exports = ZoomButtons;


},{"./React-shim":24,"./createSetStateOnEventMixin":28}],28:[function(_dereq_,module,exports){
var React, createSetStateOnEventMixin;

React = _dereq_('./React-shim');

module.exports = createSetStateOnEventMixin = function(eventName) {
  return {
    componentDidMount: function() {
      return this.unsubscribe = this.props.lc.on(eventName, (function(_this) {
        return function() {
          return _this.setState(_this.getState());
        };
      })(this));
    },
    componentWillUnmount: function() {
      return this.unsubscribe();
    }
  };
};


},{"./React-shim":24}],29:[function(_dereq_,module,exports){
var React, createToolButton;

React = _dereq_('./React-shim');

createToolButton = function(_arg) {
  var displayName, getTool, imageName, tool;
  displayName = _arg.displayName, getTool = _arg.getTool, imageName = _arg.imageName;
  tool = getTool();
  return React.createClass({
    displayName: displayName,
    getDefaultProps: function() {
      return {
        isSelected: false,
        lc: null
      };
    },
    componentWillMount: function() {
      if (this.props.isSelected) {
        return this.props.lc.setTool(tool);
      }
    },
    render: function() {
      var className, div, imageURLPrefix, img, isSelected, onSelect, src, _ref, _ref1;
      _ref = React.DOM, div = _ref.div, img = _ref.img;
      _ref1 = this.props, imageURLPrefix = _ref1.imageURLPrefix, isSelected = _ref1.isSelected, onSelect = _ref1.onSelect;
      className = React.addons.classSet({
        'lc-pick-tool': true,
        'toolbar-button': true,
        'thin-button': true,
        'selected': isSelected
      });
      src = "" + imageURLPrefix + "/" + imageName + ".png";
      return div({
        className: className,
        style: {
          'backgroundImage': "url(" + src + ")"
        },
        onClick: (function() {
          return onSelect(tool);
        }),
        title: displayName
      });
    }
  });
};

module.exports = createToolButton;


},{"./React-shim":24}],30:[function(_dereq_,module,exports){
var Options, Picker, React, createToolButton, init;

React = _dereq_('./React-shim');

createToolButton = _dereq_('./createToolButton');

Options = _dereq_('./Options');

Picker = _dereq_('./Picker');

init = function(pickerElement, optionsElement, lc, tools, imageURLPrefix) {
  var toolButtonComponents;
  toolButtonComponents = tools.map(function(ToolClass) {
    var toolInstance;
    toolInstance = new ToolClass();
    return createToolButton({
      displayName: toolInstance.name,
      imageName: toolInstance.iconName,
      getTool: function() {
        return toolInstance;
      }
    });
  });
  React.renderComponent(Picker({
    lc: lc,
    toolButtonComponents: toolButtonComponents,
    imageURLPrefix: imageURLPrefix
  }), pickerElement);
  return React.renderComponent(Options({
    lc: lc,
    imageURLPrefix: imageURLPrefix
  }), optionsElement);
};

module.exports = init;


},{"./Options":22,"./Picker":23,"./React-shim":24,"./createToolButton":29}],31:[function(_dereq_,module,exports){
var Ellipse, ToolWithStroke, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ToolWithStroke = _dereq_('./base').ToolWithStroke;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Ellipse = (function(_super) {
  __extends(Ellipse, _super);

  function Ellipse() {
    return Ellipse.__super__.constructor.apply(this, arguments);
  }

  Ellipse.prototype.name = 'Ellipse';

  Ellipse.prototype.iconName = 'ellipse';

  Ellipse.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Ellipse', {
      x: x,
      y: y,
      strokeWidth: this.strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')
    });
  };

  Ellipse.prototype["continue"] = function(x, y, lc) {
    this.currentShape.width = x - this.currentShape.x;
    this.currentShape.height = y - this.currentShape.y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Ellipse.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Ellipse;

})(ToolWithStroke);


},{"../core/shapes":10,"./base":39}],32:[function(_dereq_,module,exports){
var Eraser, Pencil, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Pencil = _dereq_('./Pencil');

createShape = _dereq_('../core/shapes').createShape;

module.exports = Eraser = (function(_super) {
  __extends(Eraser, _super);

  Eraser.prototype.name = 'Eraser';

  Eraser.prototype.iconName = 'eraser';

  function Eraser() {
    this.strokeWidth = 10;
  }

  Eraser.prototype.makePoint = function(x, y, lc) {
    return createShape('Point', {
      x: x,
      y: y,
      size: this.strokeWidth,
      color: '#000'
    });
  };

  Eraser.prototype.makeShape = function() {
    return createShape('ErasedLinePath');
  };

  return Eraser;

})(Pencil);


},{"../core/shapes":10,"./Pencil":36}],33:[function(_dereq_,module,exports){
var Eyedropper, Tool, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tool = _dereq_('./base').Tool;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Eyedropper = (function(_super) {
  __extends(Eyedropper, _super);

  function Eyedropper() {
    return Eyedropper.__super__.constructor.apply(this, arguments);
  }

  Eyedropper.prototype.name = 'Eyedropper';

  Eyedropper.prototype.iconName = 'eyedropper';

  Eyedropper.prototype.readColor = function(x, y, lc) {
    var newColor;
    newColor = lc.getPixel(x, y);
    return lc.setColor('primary', newColor || lc.getColor('background'));
  };

  Eyedropper.prototype.begin = function(x, y, lc) {
    return this.readColor(x, y, lc);
  };

  Eyedropper.prototype["continue"] = function(x, y, lc) {
    return this.readColor(x, y, lc);
  };

  return Eyedropper;

})(Tool);


},{"../core/shapes":10,"./base":39}],34:[function(_dereq_,module,exports){
var Line, Tool, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tool = _dereq_('./base').Tool;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Line = (function(_super) {
  __extends(Line, _super);

  Line.prototype.name = 'Line';

  Line.prototype.iconName = 'line';

  function Line() {
    this.strokeWidth = 5;
  }

  Line.prototype.optionsStyle = 'line-options-and-stroke-width';

  Line.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Line', {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      strokeWidth: this.strokeWidth,
      dash: (function() {
        switch (false) {
          case !this.isDashed:
            return [this.strokeWidth * 2, this.strokeWidth * 4];
          default:
            return null;
        }
      }).call(this),
      endCapShapes: this.hasEndArrow ? [null, 'arrow'] : null,
      color: lc.getColor('primary')
    });
  };

  Line.prototype["continue"] = function(x, y, lc) {
    this.currentShape.x2 = x;
    this.currentShape.y2 = y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Line.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Line;

})(Tool);


},{"../core/shapes":10,"./base":39}],35:[function(_dereq_,module,exports){
var Pan, Tool, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tool = _dereq_('./base').Tool;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Pan = (function(_super) {
  __extends(Pan, _super);

  function Pan() {
    return Pan.__super__.constructor.apply(this, arguments);
  }

  Pan.prototype.name = 'Pan';

  Pan.prototype.iconName = 'pan';

  Pan.prototype.begin = function(x, y, lc) {
    return this.start = {
      x: x,
      y: y
    };
  };

  Pan.prototype["continue"] = function(x, y, lc) {
    lc.pan(this.start.x - x, this.start.y - y);
    return lc.repaintAllLayers();
  };

  Pan.prototype.end = function(x, y, lc) {
    return lc.repaintAllLayers();
  };

  return Pan;

})(Tool);


},{"../core/shapes":10,"./base":39}],36:[function(_dereq_,module,exports){
var Pencil, ToolWithStroke, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ToolWithStroke = _dereq_('./base').ToolWithStroke;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Pencil = (function(_super) {
  __extends(Pencil, _super);

  function Pencil() {
    return Pencil.__super__.constructor.apply(this, arguments);
  }

  Pencil.prototype.name = 'Pencil';

  Pencil.prototype.iconName = 'pencil';

  Pencil.prototype.eventTimeThreshold = 10;

  Pencil.prototype.begin = function(x, y, lc) {
    this.color = lc.getColor('primary');
    this.currentShape = this.makeShape();
    this.currentShape.addPoint(this.makePoint(x, y, lc));
    return this.lastEventTime = Date.now();
  };

  Pencil.prototype["continue"] = function(x, y, lc) {
    var timeDiff;
    timeDiff = Date.now() - this.lastEventTime;
    if (timeDiff > this.eventTimeThreshold) {
      this.lastEventTime += timeDiff;
      this.currentShape.addPoint(this.makePoint(x, y, lc));
      return lc.drawShapeInProgress(this.currentShape);
    }
  };

  Pencil.prototype.end = function(x, y, lc) {
    lc.saveShape(this.currentShape);
    return this.currentShape = void 0;
  };

  Pencil.prototype.makePoint = function(x, y, lc) {
    return createShape('Point', {
      x: x,
      y: y,
      size: this.strokeWidth,
      color: this.color
    });
  };

  Pencil.prototype.makeShape = function() {
    return createShape('LinePath');
  };

  return Pencil;

})(ToolWithStroke);


},{"../core/shapes":10,"./base":39}],37:[function(_dereq_,module,exports){
var Rectangle, ToolWithStroke, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ToolWithStroke = _dereq_('./base').ToolWithStroke;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Rectangle = (function(_super) {
  __extends(Rectangle, _super);

  function Rectangle() {
    return Rectangle.__super__.constructor.apply(this, arguments);
  }

  Rectangle.prototype.name = 'Rectangle';

  Rectangle.prototype.iconName = 'rectangle';

  Rectangle.prototype.begin = function(x, y, lc) {
    return this.currentShape = createShape('Rectangle', {
      x: x,
      y: y,
      strokeWidth: this.strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')
    });
  };

  Rectangle.prototype["continue"] = function(x, y, lc) {
    this.currentShape.width = x - this.currentShape.x;
    this.currentShape.height = y - this.currentShape.y;
    return lc.drawShapeInProgress(this.currentShape);
  };

  Rectangle.prototype.end = function(x, y, lc) {
    return lc.saveShape(this.currentShape);
  };

  return Rectangle;

})(ToolWithStroke);


},{"../core/shapes":10,"./base":39}],38:[function(_dereq_,module,exports){
var Text, Tool, createShape, getIsPointInBox,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tool = _dereq_('./base').Tool;

createShape = _dereq_('../core/shapes').createShape;

getIsPointInBox = function(point, box) {
  if (point.x < box.x) {
    return false;
  }
  if (point.y < box.y) {
    return false;
  }
  if (point.x > box.x + box.width) {
    return false;
  }
  if (point.y > box.y + box.height) {
    return false;
  }
  return true;
};

module.exports = Text = (function(_super) {
  __extends(Text, _super);

  Text.prototype.name = 'Text';

  Text.prototype.iconName = 'text';

  function Text(text, font) {
    this.text = text != null ? text : '';
    this.font = font != null ? font : 'bold 18px sans-serif';
    this.currentShape = null;
    this.currentShapeState = null;
    this.initialShapeBoundingRect = null;
    this.dragAction = null;
    this.didDrag = false;
  }

  Text.prototype.didBecomeActive = function(lc) {
    var switchAway, unsubscribeFuncs, updateInputEl;
    unsubscribeFuncs = [];
    this.unsubscribe = (function(_this) {
      return function() {
        var func, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = unsubscribeFuncs.length; _i < _len; _i++) {
          func = unsubscribeFuncs[_i];
          _results.push(func());
        }
        return _results;
      };
    })(this);
    switchAway = (function(_this) {
      return function() {
        _this._ensureNotEditing(lc);
        _this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      };
    })(this);
    updateInputEl = (function(_this) {
      return function() {
        return _this._updateInputEl(lc);
      };
    })(this);
    unsubscribeFuncs.push(lc.on('undo', switchAway));
    unsubscribeFuncs.push(lc.on('redo', switchAway));
    unsubscribeFuncs.push(lc.on('zoom', updateInputEl));
    unsubscribeFuncs.push(lc.on('imageSizeChange', updateInputEl));
    unsubscribeFuncs.push(lc.on('snapshotLoad', (function(_this) {
      return function() {
        _this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
    unsubscribeFuncs.push(lc.on('primaryColorChange', (function(_this) {
      return function(newColor) {
        if (!_this.currentShape) {
          return;
        }
        _this.currentShape.color = newColor;
        _this._updateInputEl(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
    return unsubscribeFuncs.push(lc.on('setFont', (function(_this) {
      return function(font) {
        if (!_this.currentShape) {
          return;
        }
        _this.font = font;
        _this.currentShape.setFont(font);
        _this._setShapesInProgress(lc);
        _this._updateInputEl(lc);
        return lc.repaintLayer('main');
      };
    })(this)));
  };

  Text.prototype.willBecomeInactive = function(lc) {
    if (this.currentShape) {
      this._ensureNotEditing(lc);
      this.commit(lc);
    }
    return this.unsubscribe();
  };

  Text.prototype.setText = function(text) {
    return this.text = text;
  };

  Text.prototype._ensureNotEditing = function(lc) {
    if (this.currentShapeState === 'editing') {
      return this._exitEditingState(lc);
    }
  };

  Text.prototype._clearCurrentShape = function(lc) {
    this.currentShape = null;
    this.initialShapeBoundingRect = null;
    this.currentShapeState = null;
    return lc.setShapesInProgress([]);
  };

  Text.prototype.commit = function(lc) {
    if (this.currentShape.text) {
      lc.saveShape(this.currentShape);
    }
    this._clearCurrentShape(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype._getSelectionShape = function(ctx, backgroundColor) {
    if (backgroundColor == null) {
      backgroundColor = null;
    }
    return createShape('SelectionBox', {
      shape: this.currentShape,
      ctx: lc.ctx,
      backgroundColor: backgroundColor
    });
  };

  Text.prototype._setShapesInProgress = function(lc) {
    switch (this.currentShapeState) {
      case 'selected':
        return lc.setShapesInProgress([this._getSelectionShape(lc.ctx), this.currentShape]);
      case 'editing':
        return lc.setShapesInProgress([this._getSelectionShape(lc.ctx, '#fff')]);
      default:
        return lc.setShapesInProgress([this.currentShape]);
    }
  };

  Text.prototype.begin = function(x, y, lc) {
    var br, point, selectionBox, selectionShape;
    this.dragAction = 'none';
    this.didDrag = false;
    if (this.currentShapeState === 'selected' || this.currentShapeState === 'editing') {
      br = this.currentShape.getBoundingRect(lc.ctx);
      selectionShape = this._getSelectionShape(lc.ctx);
      selectionBox = selectionShape.getBoundingRect();
      point = {
        x: x,
        y: y
      };
      if (getIsPointInBox(point, br)) {
        this.dragAction = 'move';
      }
      if (getIsPointInBox(point, selectionShape.getBottomRightHandleRect())) {
        this.dragAction = 'resizeBottomRight';
      }
      if (getIsPointInBox(point, selectionShape.getTopLeftHandleRect())) {
        this.dragAction = 'resizeTopLeft';
      }
      if (getIsPointInBox(point, selectionShape.getBottomLeftHandleRect())) {
        this.dragAction = 'resizeBottomLeft';
      }
      if (getIsPointInBox(point, selectionShape.getTopRightHandleRect())) {
        this.dragAction = 'resizeTopRight';
      }
      if (this.dragAction === 'none' && this.currentShapeState === 'editing') {
        this.dragAction = 'stop-editing';
        this._exitEditingState(lc);
      }
    } else {
      this.color = lc.getColor('primary');
      this.currentShape = createShape('Text', {
        x: x,
        y: y,
        text: this.text,
        color: this.color,
        font: this.font,
        v: 1
      });
      this.dragAction = 'place';
      this.currentShapeState = 'selected';
    }
    if (this.dragAction === 'none') {
      this.commit(lc);
      return;
    }
    this.initialShapeBoundingRect = this.currentShape.getBoundingRect(lc.ctx);
    this.dragOffset = {
      x: x - this.initialShapeBoundingRect.x,
      y: y - this.initialShapeBoundingRect.y
    };
    this._setShapesInProgress(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype["continue"] = function(x, y, lc) {
    var br, brBottom, brRight;
    if (this.dragAction === 'none') {
      return;
    }
    br = this.initialShapeBoundingRect;
    brRight = br.x + br.width;
    brBottom = br.y + br.height;
    switch (this.dragAction) {
      case 'place':
        this.currentShape.x = x;
        this.currentShape.y = y;
        this.didDrag = true;
        break;
      case 'move':
        this.currentShape.x = x - this.dragOffset.x;
        this.currentShape.y = y - this.dragOffset.y;
        this.didDrag = true;
        break;
      case 'resizeBottomRight':
        this.currentShape.setSize(x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x, y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
        break;
      case 'resizeTopLeft':
        this.currentShape.setSize(brRight - x + this.dragOffset.x, brBottom - y + this.dragOffset.y);
        this.currentShape.setPosition(x - this.dragOffset.x, y - this.dragOffset.y);
        break;
      case 'resizeBottomLeft':
        this.currentShape.setSize(brRight - x + this.dragOffset.x, y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
        this.currentShape.setPosition(x - this.dragOffset.x, this.currentShape.y);
        break;
      case 'resizeTopRight':
        this.currentShape.setSize(x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x, brBottom - y + this.dragOffset.y);
        this.currentShape.setPosition(this.currentShape.x, y - this.dragOffset.y);
    }
    this._setShapesInProgress(lc);
    lc.repaintLayer('main');
    return this._updateInputEl(lc);
  };

  Text.prototype.end = function(x, y, lc) {
    if (!this.currentShape) {
      return;
    }
    this.currentShape.setSize(this.currentShape.forcedWidth, 0);
    if (this.currentShapeState === 'selected') {
      if (this.dragAction === 'place' || (this.dragAction === 'move' && !this.didDrag)) {
        this._enterEditingState(lc);
      }
    }
    this._setShapesInProgress(lc);
    lc.repaintLayer('main');
    return this._updateInputEl(lc);
  };

  Text.prototype._enterEditingState = function(lc) {
    var onChange;
    this.currentShapeState = 'editing';
    if (this.inputEl) {
      throw "State error";
    }
    this.inputEl = document.createElement('textarea');
    this.inputEl.className = 'text-tool-input';
    this.inputEl.style.position = 'absolute';
    this.inputEl.style.transformOrigin = '0px 0px';
    this.inputEl.style.backgroundColor = 'transparent';
    this.inputEl.style.border = 'none';
    this.inputEl.style.outline = 'none';
    this.inputEl.style.margin = '0';
    this.inputEl.style.padding = '4px';
    this.inputEl.style.zIndex = '1000';
    this.inputEl.style.overflow = 'hidden';
    this.inputEl.style.resize = 'none';
    this.inputEl.value = this.currentShape.text;
    this.inputEl.addEventListener('mousedown', function(e) {
      return e.stopPropagation();
    });
    this.inputEl.addEventListener('touchstart', function(e) {
      return e.stopPropagation();
    });
    onChange = (function(_this) {
      return function(e) {
        _this.currentShape.setText(e.target.value);
        _this.currentShape.enforceMaxBoundingRect(lc);
        _this._setShapesInProgress(lc);
        lc.repaintLayer('main');
        _this._updateInputEl(lc);
        return e.stopPropagation();
      };
    })(this);
    this.inputEl.addEventListener('keydown', (function(_this) {
      return function() {
        return _this._updateInputEl(lc, true);
      };
    })(this));
    this.inputEl.addEventListener('keyup', onChange);
    this.inputEl.addEventListener('change', onChange);
    this._updateInputEl(lc);
    lc.containerEl.appendChild(this.inputEl);
    this.inputEl.focus();
    return this._setShapesInProgress(lc);
  };

  Text.prototype._exitEditingState = function(lc) {
    this.currentShapeState = 'selected';
    lc.containerEl.removeChild(this.inputEl);
    this.inputEl = null;
    this._setShapesInProgress(lc);
    return lc.repaintLayer('main');
  };

  Text.prototype._updateInputEl = function(lc, withMargin) {
    var br, transformString;
    if (withMargin == null) {
      withMargin = false;
    }
    if (!this.inputEl) {
      return;
    }
    br = this.currentShape.getBoundingRect(lc.ctx, true);
    this.inputEl.style.font = this.currentShape.font;
    this.inputEl.style.color = this.currentShape.color;
    this.inputEl.style.left = "" + (lc.position.x / lc.backingScale + br.x * lc.scale - 4) + "px";
    this.inputEl.style.top = "" + (lc.position.y / lc.backingScale + br.y * lc.scale - 4) + "px";
    if (withMargin && !this.currentShape.forcedWidth) {
      this.inputEl.style.width = "" + (br.width + 10 + this.currentShape.renderer.emDashWidth) + "px";
    } else {
      this.inputEl.style.width = "" + (br.width + 12) + "px";
    }
    if (withMargin) {
      this.inputEl.style.height = "" + (br.height + 10 + this.currentShape.renderer.metrics.leading) + "px";
    } else {
      this.inputEl.style.height = "" + (br.height + 10) + "px";
    }
    transformString = "scale(" + lc.scale + ")";
    this.inputEl.style.transform = transformString;
    this.inputEl.style.webkitTransform = transformString;
    this.inputEl.style.MozTransform = transformString;
    this.inputEl.style.msTransform = transformString;
    return this.inputEl.style.OTransform = transformString;
  };

  Text.prototype.optionsStyle = 'font';

  return Text;

})(Tool);


},{"../core/shapes":10,"./base":39}],39:[function(_dereq_,module,exports){
var Tool, ToolWithStroke, tools,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

tools = {};

tools.Tool = Tool = (function() {
  function Tool() {}

  Tool.prototype.name = null;

  Tool.prototype.iconName = null;

  Tool.prototype.begin = function(x, y, lc) {};

  Tool.prototype["continue"] = function(x, y, lc) {};

  Tool.prototype.end = function(x, y, lc) {};

  Tool.prototype.optionsStyle = null;

  Tool.prototype.didBecomeActive = function(lc) {};

  Tool.prototype.willBecomeInactive = function(lc) {};

  return Tool;

})();

tools.ToolWithStroke = ToolWithStroke = (function(_super) {
  __extends(ToolWithStroke, _super);

  function ToolWithStroke() {
    this.strokeWidth = 5;
  }

  ToolWithStroke.prototype.optionsStyle = 'stroke-width';

  return ToolWithStroke;

})(Tool);

module.exports = tools;


},{}]},{},[14])
(14)
});
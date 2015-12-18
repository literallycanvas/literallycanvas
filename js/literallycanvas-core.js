!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.LC=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var INFINITE, JSONToShape, LiterallyCanvas, Pencil, actions, bindEvents, createShape, math, renderShapeToContext, renderShapeToSVG, renderSnapshotToImage, renderSnapshotToSVG, shapeToJSON, util, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

actions = _dereq_('./actions');

bindEvents = _dereq_('./bindEvents');

math = _dereq_('./math');

_ref = _dereq_('./shapes'), createShape = _ref.createShape, shapeToJSON = _ref.shapeToJSON, JSONToShape = _ref.JSONToShape;

renderShapeToContext = _dereq_('./canvasRenderer').renderShapeToContext;

renderShapeToSVG = _dereq_('./svgRenderer').renderShapeToSVG;

renderSnapshotToImage = _dereq_('./renderSnapshotToImage');

renderSnapshotToSVG = _dereq_('./renderSnapshotToSVG');

Pencil = _dereq_('../tools/Pencil');

util = _dereq_('./util');

INFINITE = 'infinite';

module.exports = LiterallyCanvas = (function() {
  function LiterallyCanvas(containerEl, opts) {
    this.containerEl = containerEl;
    this.setImageSize = __bind(this.setImageSize, this);
    this._unsubscribeEvents = bindEvents(this, this.containerEl, opts.keyboardShortcuts);
    this.opts = opts;
    this.config = {
      zoomMin: opts.zoomMin || 0.2,
      zoomMax: opts.zoomMax || 4.0,
      zoomStep: opts.zoomStep || 0.2
    };
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
    this.setTool(new this.opts.tools[0](this));
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
    if (opts.snapshot) {
      this.loadSnapshot(opts.snapshot);
    }
  }

  LiterallyCanvas.prototype._teardown = function() {
    this.tool.willBecomeInactive(this);
    this.tool = null;
    return this._unsubscribeEvents();
  };

  LiterallyCanvas.prototype.trigger = function(name, data) {
    this.canvas.dispatchEvent(new CustomEvent(name, {
      detail: data
    }));
    return null;
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
    var _ref1;
    if ((_ref1 = this.tool) != null) {
      _ref1.willBecomeInactive(this);
    }
    this.tool = tool;
    this.trigger('toolChange', {
      tool: tool
    });
    return tool.didBecomeActive(this);
  };

  LiterallyCanvas.prototype.setShapesInProgress = function(newVal) {
    return this._shapesInProgress = newVal;
  };

  LiterallyCanvas.prototype.pointerDown = function(x, y) {
    var p;
    p = this.clientCoordsToDrawingCoords(x, y);
    if (this.tool.usesSimpleAPI) {
      this.tool.begin(p.x, p.y, this);
      this.isDragging = true;
      return this.trigger("drawStart", {
        tool: this.tool
      });
    } else {
      this.isDragging = true;
      return this.trigger("lc-pointerdown", {
        tool: this.tool,
        x: p.x,
        y: p.y,
        rawX: x,
        rawY: y
      });
    }
  };

  LiterallyCanvas.prototype.pointerMove = function(x, y) {
    return util.requestAnimationFrame((function(_this) {
      return function() {
        var p;
        p = _this.clientCoordsToDrawingCoords(x, y);
        if (_this.tool.usesSimpleAPI) {
          if (_this.isDragging) {
            _this.tool["continue"](p.x, p.y, _this);
            return _this.trigger("drawContinue", {
              tool: _this.tool
            });
          }
        } else {
          if (_this.isDragging) {
            return _this.trigger("lc-pointerdrag", {
              tool: _this.tool,
              x: p.x,
              y: p.y,
              rawX: x,
              rawY: y
            });
          } else {
            return _this.trigger("lc-pointermove", {
              tool: _this.tool,
              x: p.x,
              y: p.y,
              rawX: x,
              rawY: y
            });
          }
        }
      };
    })(this));
  };

  LiterallyCanvas.prototype.pointerUp = function(x, y) {
    var p;
    p = this.clientCoordsToDrawingCoords(x, y);
    if (this.tool.usesSimpleAPI) {
      if (this.isDragging) {
        this.tool.end(p.x, p.y, this);
        this.isDragging = false;
        return this.trigger("drawEnd", {
          tool: this.tool
        });
      }
    } else {
      this.isDragging = false;
      return this.trigger("lc-pointerup", {
        tool: this.tool,
        x: p.x,
        y: p.y,
        rawX: x,
        rawY: y
      });
    }
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
    newScale = Math.max(newScale, this.config.zoomMin);
    newScale = Math.min(newScale, this.config.zoomMax);
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

  LiterallyCanvas.prototype.setWatermarkImage = function(newImage) {
    this.watermarkImage = newImage;
    util.addImageOnload(newImage, (function(_this) {
      return function() {
        return _this.repaintLayer('background');
      };
    })(this));
    if (newImage.width) {
      return this.repaintLayer('background');
    }
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
                  _results.push(renderShapeToContext(_this.ctx, shape, {
                    bufferCtx: _this.bufferCtx,
                    shouldOnlyDrawLatest: true
                  }));
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
          return renderShapeToContext(_this.ctx, shape, {
            bufferCtx: _this.bufferCtx,
            shouldOnlyDrawLatest: true
          });
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
          _results.push(renderShapeToContext(ctx, shape, {
            retryCallback: retryCallback
          }));
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
      ctx.translate(Math.floor(this.position.x), Math.floor(this.position.y));
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
    if (opts == null) {
      opts = {};
    }
    if (opts.includeWatermark == null) {
      opts.includeWatermark = true;
    }
    if (opts.scaleDownRetina == null) {
      opts.scaleDownRetina = true;
    }
    if (opts.scale == null) {
      opts.scale = 1;
    }
    if (!opts.scaleDownRetina) {
      opts.scale *= this.backingScale;
    }
    if (opts.includeWatermark) {
      opts.watermarkImage = this.watermarkImage;
      opts.watermarkScale = this.watermarkScale;
      if (!opts.scaleDownRetina) {
        opts.watermarkScale *= this.backingScale;
      }
    }
    return renderSnapshotToImage(this.getSnapshot(), opts);
  };

  LiterallyCanvas.prototype.canvasForExport = function() {
    this.repaintAllLayers();
    return util.combineCanvases(this.backgroundCanvas, this.canvas);
  };

  LiterallyCanvas.prototype.canvasWithBackground = function(backgroundImageOrCanvas) {
    return util.combineCanvases(backgroundImageOrCanvas, this.canvasForExport());
  };

  LiterallyCanvas.prototype.getSnapshot = function(keys) {
    var k, shape, snapshot, _i, _len, _ref1;
    if (keys == null) {
      keys = null;
    }
    if (keys == null) {
      keys = ['shapes', 'imageSize', 'colors', 'position', 'scale', 'backgroundShapes'];
    }
    snapshot = {};
    _ref1 = ['colors', 'position', 'scale'];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      k = _ref1[_i];
      if (__indexOf.call(keys, k) >= 0) {
        snapshot[k] = this[k];
      }
    }
    if (__indexOf.call(keys, 'shapes') >= 0) {
      snapshot.shapes = (function() {
        var _j, _len1, _ref2, _results;
        _ref2 = this.shapes;
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          shape = _ref2[_j];
          _results.push(shapeToJSON(shape));
        }
        return _results;
      }).call(this);
    }
    if (__indexOf.call(keys, 'backgroundShapes') >= 0) {
      snapshot.backgroundShapes = (function() {
        var _j, _len1, _ref2, _results;
        _ref2 = this.backgroundShapes;
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          shape = _ref2[_j];
          _results.push(shapeToJSON(shape));
        }
        return _results;
      }).call(this);
    }
    if (__indexOf.call(keys, 'imageSize') >= 0) {
      snapshot.imageSize = {
        width: this.width,
        height: this.height
      };
    }
    return snapshot;
  };

  LiterallyCanvas.prototype.getSnapshotJSON = function() {
    console.warn("lc.getSnapshotJSON() is deprecated. use JSON.stringify(lc.getSnapshot()) instead.");
    return JSON.stringify(this.getSnapshot());
  };

  LiterallyCanvas.prototype.getSVGString = function(opts) {
    if (opts == null) {
      opts = {};
    }
    return renderSnapshotToSVG(this.getSnapshot(), opts);
  };

  LiterallyCanvas.prototype.loadSnapshot = function(snapshot) {
    var k, s, shape, shapeRepr, _i, _j, _len, _len1, _ref1, _ref2;
    if (!snapshot) {
      return;
    }
    if (snapshot.colors) {
      _ref1 = ['primary', 'secondary', 'background'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        k = _ref1[_i];
        this.setColor(k, snapshot.colors[k]);
      }
    }
    if (snapshot.shapes) {
      this.shapes = [];
      _ref2 = snapshot.shapes;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        shapeRepr = _ref2[_j];
        shape = JSONToShape(shapeRepr);
        if (shape) {
          this.execute(new actions.AddShapeAction(this, shape));
        }
      }
    }
    if (snapshot.backgroundShapes) {
      this.backgroundShapes = (function() {
        var _k, _len2, _ref3, _results;
        _ref3 = snapshot.backgroundShapes;
        _results = [];
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          s = _ref3[_k];
          _results.push(JSONToShape(s));
        }
        return _results;
      })();
    }
    if (snapshot.imageSize) {
      this.width = snapshot.imageSize.width;
      this.height = snapshot.imageSize.height;
    }
    if (snapshot.position) {
      this.position = snapshot.position;
    }
    if (snapshot.scale) {
      this.scale = snapshot.scale;
    }
    this.repaintAllLayers();
    this.trigger('snapshotLoad');
    return this.trigger('drawingChange', {});
  };

  LiterallyCanvas.prototype.loadSnapshotJSON = function(str) {
    console.warn("lc.loadSnapshotJSON() is deprecated. use lc.loadSnapshot(JSON.parse(snapshot)) instead.");
    return this.loadSnapshot(JSON.parse(str));
  };

  return LiterallyCanvas;

})();


},{"../tools/Pencil":23,"./actions":3,"./bindEvents":4,"./canvasRenderer":5,"./math":9,"./renderSnapshotToImage":10,"./renderSnapshotToSVG":11,"./shapes":12,"./svgRenderer":13,"./util":14}],2:[function(_dereq_,module,exports){
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


},{"./fontmetrics.js":6}],3:[function(_dereq_,module,exports){
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


},{}],4:[function(_dereq_,module,exports){
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
  var listener, mouseMoveListener, mouseUpListener, touchEndListener, touchMoveListener, unsubs;
  if (panWithKeyboard == null) {
    panWithKeyboard = false;
  }
  unsubs = [];
  mouseMoveListener = (function(_this) {
    return function(e) {
      var p;
      e.preventDefault();
      p = position(canvas, e);
      return lc.pointerMove(p.left, p.top);
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
      lc.pointerUp(p.left, p.top);
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
      return canvas.addEventListener('mousemove', mouseMoveListener);
    };
  })(this);
  canvas.addEventListener('mousedown', (function(_this) {
    return function(e) {
      var down, p;
      if (e.target.tagName.toLowerCase() !== 'canvas') {
        return;
      }
      down = true;
      e.preventDefault();
      canvas.onselectstart = function() {
        return false;
      };
      p = position(canvas, e);
      lc.pointerDown(p.left, p.top);
      canvas.removeEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mousemove', mouseMoveListener);
      return document.addEventListener('mouseup', mouseUpListener);
    };
  })(this));
  touchMoveListener = function(e) {
    e.preventDefault();
    return lc.pointerMove.apply(lc, coordsForTouchEvent(canvas, e));
  };
  touchEndListener = function(e) {
    e.preventDefault();
    lc.pointerUp.apply(lc, coordsForTouchEvent(canvas, e));
    document.removeEventListener('touchmove', touchMoveListener);
    document.removeEventListener('touchend', touchEndListener);
    return document.removeEventListener('touchcancel', touchEndListener);
  };
  canvas.addEventListener('touchstart', function(e) {
    if (e.target.tagName.toLowerCase() !== 'canvas') {
      return;
    }
    e.preventDefault();
    if (e.touches.length === 1) {
      lc.pointerDown.apply(lc, coordsForTouchEvent(canvas, e));
      document.addEventListener('touchmove', touchMoveListener);
      document.addEventListener('touchend', touchEndListener);
      return document.addEventListener('touchcancel', touchEndListener);
    } else {
      return lc.pointerMove.apply(lc, coordsForTouchEvent(canvas, e));
    }
  });
  if (panWithKeyboard) {
    console.warn("Keyboard panning is deprecated.");
    listener = function(e) {
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
    };
    document.addEventListener('keydown', listener);
    unsubs.push(function() {
      return document.removeEventListener(listener);
    });
  }
  return function() {
    var f, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = unsubs.length; _i < _len; _i++) {
      f = unsubs[_i];
      _results.push(f());
    }
    return _results;
  };
};


},{}],5:[function(_dereq_,module,exports){
var defineCanvasRenderer, drawErasedLinePath, drawErasedLinePathLatest, drawLinePath, drawLinePathLatest, lineEndCapShapes, noop, renderShapeToCanvas, renderShapeToContext, renderers, _drawRawLinePath;

lineEndCapShapes = _dereq_('./lineEndCapShapes.coffee');

renderers = {};

defineCanvasRenderer = function(shapeName, drawFunc, drawLatestFunc) {
  return renderers[shapeName] = {
    drawFunc: drawFunc,
    drawLatestFunc: drawLatestFunc
  };
};

noop = function() {};

renderShapeToContext = function(ctx, shape, opts) {
  var bufferCtx;
  if (opts == null) {
    opts = {};
  }
  if (opts.shouldIgnoreUnsupportedShapes == null) {
    opts.shouldIgnoreUnsupportedShapes = false;
  }
  if (opts.retryCallback == null) {
    opts.retryCallback = noop;
  }
  if (opts.shouldOnlyDrawLatest == null) {
    opts.shouldOnlyDrawLatest = false;
  }
  if (opts.bufferCtx == null) {
    opts.bufferCtx = null;
  }
  bufferCtx = opts.bufferCtx;
  if (renderers[shape.className]) {
    if (opts.shouldOnlyDrawLatest && renderers[shape.className].drawLatestFunc) {
      return renderers[shape.className].drawLatestFunc(ctx, bufferCtx, shape, opts.retryCallback);
    } else {
      return renderers[shape.className].drawFunc(ctx, shape, opts.retryCallback);
    }
  } else if (opts.shouldIgnoreUnsupportedShapes) {
    return console.warn("Can't render shape of type " + shape.className + " to canvas");
  } else {
    throw "Can't render shape of type " + shape.className + " to canvas";
  }
};

renderShapeToCanvas = function(canvas, shape, opts) {
  return renderShapeToContext(canvas.getContext('2d'), shape, opts);
};

defineCanvasRenderer('Rectangle', function(ctx, shape) {
  var x, y;
  x = shape.x;
  y = shape.y;
  if (shape.strokeWidth % 2 !== 0) {
    x += 0.5;
    y += 0.5;
  }
  ctx.fillStyle = shape.fillColor;
  ctx.fillRect(x, y, shape.width, shape.height);
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.strokeColor;
  return ctx.strokeRect(x, y, shape.width, shape.height);
});

defineCanvasRenderer('Ellipse', function(ctx, shape) {
  var centerX, centerY, halfHeight, halfWidth;
  ctx.save();
  halfWidth = Math.floor(shape.width / 2);
  halfHeight = Math.floor(shape.height / 2);
  centerX = shape.x + halfWidth;
  centerY = shape.y + halfHeight;
  ctx.translate(centerX, centerY);
  ctx.scale(1, Math.abs(shape.height / shape.width));
  ctx.beginPath();
  ctx.arc(0, 0, Math.abs(halfWidth), 0, Math.PI * 2);
  ctx.closePath();
  ctx.restore();
  ctx.fillStyle = shape.fillColor;
  ctx.fill();
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.strokeColor;
  return ctx.stroke();
});

defineCanvasRenderer('SelectionBox', (function() {
  var _drawHandle;
  _drawHandle = function(ctx, _arg, handleSize) {
    var x, y;
    x = _arg.x, y = _arg.y;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, handleSize, handleSize);
    ctx.strokeStyle = '#000';
    return ctx.strokeRect(x, y, handleSize, handleSize);
  };
  return function(ctx, shape) {
    _drawHandle(ctx, shape.getTopLeftHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getTopRightHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getBottomLeftHandleRect(), shape.handleSize);
    _drawHandle(ctx, shape.getBottomRightHandleRect(), shape.handleSize);
    if (shape.backgroundColor) {
      ctx.fillStyle = shape.backgroundColor;
      ctx.fillRect(shape._br.x - shape.margin, shape._br.y - shape.margin, shape._br.width + shape.margin * 2, shape._br.height + shape.margin * 2);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.setLineDash([2, 4]);
    ctx.strokeRect(shape._br.x - shape.margin, shape._br.y - shape.margin, shape._br.width + shape.margin * 2, shape._br.height + shape.margin * 2);
    return ctx.setLineDash([]);
  };
})());

defineCanvasRenderer('Image', function(ctx, shape, retryCallback) {
  if (shape.image.width) {
    if (shape.scale === 1) {
      return ctx.drawImage(shape.image, shape.x, shape.y);
    } else {
      return ctx.drawImage(shape.image, shape.x, shape.y, shape.image.width * shape.scale, shape.image.height * shape.scale);
    }
  } else if (retryCallback) {
    return shape.image.onload = retryCallback;
  }
});

defineCanvasRenderer('Line', function(ctx, shape) {
  var arrowWidth, x1, x2, y1, y2;
  if (shape.x1 === shape.x2 && shape.y1 === shape.y2) {
    return;
  }
  x1 = shape.x1;
  x2 = shape.x2;
  y1 = shape.y1;
  y2 = shape.y2;
  if (shape.strokeWidth % 2 !== 0) {
    x1 += 0.5;
    x2 += 0.5;
    y1 += 0.5;
    y2 += 0.5;
  }
  ctx.lineWidth = shape.strokeWidth;
  ctx.strokeStyle = shape.color;
  ctx.lineCap = shape.capStyle;
  if (shape.dash) {
    ctx.setLineDash(shape.dash);
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (shape.dash) {
    ctx.setLineDash([]);
  }
  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
  if (shape.endCapShapes[0]) {
    lineEndCapShapes[shape.endCapShapes[0]].drawToCanvas(ctx, x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
  }
  if (shape.endCapShapes[1]) {
    return lineEndCapShapes[shape.endCapShapes[1]].drawToCanvas(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
  }
});

_drawRawLinePath = function(ctx, points, close, lineCap) {
  var point, _i, _len, _ref;
  if (close == null) {
    close = false;
  }
  if (lineCap == null) {
    lineCap = 'round';
  }
  if (!points.length) {
    return;
  }
  ctx.lineCap = lineCap;
  ctx.strokeStyle = points[0].color;
  ctx.lineWidth = points[0].size;
  ctx.beginPath();
  if (points[0].size % 2 === 0) {
    ctx.moveTo(points[0].x, points[0].y);
  } else {
    ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5);
  }
  _ref = points.slice(1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    point = _ref[_i];
    if (points[0].size % 2 === 0) {
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x + 0.5, point.y + 0.5);
    }
  }
  if (close) {
    return ctx.closePath();
  }
};

drawLinePath = function(ctx, shape) {
  _drawRawLinePath(ctx, shape.smoothedPoints);
  return ctx.stroke();
};

drawLinePathLatest = function(ctx, bufferCtx, shape) {
  var drawEnd, drawStart, segmentStart;
  if (shape.tail) {
    segmentStart = shape.smoothedPoints.length - shape.segmentSize * shape.tailSize;
    drawStart = segmentStart < shape.segmentSize * 2 ? 0 : segmentStart;
    drawEnd = segmentStart + shape.segmentSize + 1;
    _drawRawLinePath(bufferCtx, shape.smoothedPoints.slice(drawStart, drawEnd));
    return bufferCtx.stroke();
  } else {
    _drawRawLinePath(bufferCtx, shape.smoothedPoints);
    return bufferCtx.stroke();
  }
};

defineCanvasRenderer('LinePath', drawLinePath, drawLinePathLatest);

drawErasedLinePath = function(ctx, shape) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  drawLinePath(ctx, shape);
  return ctx.restore();
};

drawErasedLinePathLatest = function(ctx, bufferCtx, shape) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  bufferCtx.save();
  bufferCtx.globalCompositeOperation = "destination-out";
  drawLinePathLatest(ctx, bufferCtx, shape);
  ctx.restore();
  return bufferCtx.restore();
};

defineCanvasRenderer('ErasedLinePath', drawErasedLinePath, drawErasedLinePathLatest);

defineCanvasRenderer('Text', function(ctx, shape) {
  if (!shape.renderer) {
    shape._makeRenderer(ctx);
  }
  ctx.fillStyle = shape.color;
  return shape.renderer.draw(ctx, shape.x, shape.y);
});

defineCanvasRenderer('Polygon', function(ctx, shape) {
  ctx.fillStyle = shape.fillColor;
  _drawRawLinePath(ctx, shape.points, shape.isClosed, 'butt');
  ctx.fill();
  return ctx.stroke();
});

module.exports = {
  defineCanvasRenderer: defineCanvasRenderer,
  renderShapeToCanvas: renderShapeToCanvas,
  renderShapeToContext: renderShapeToContext
};


},{"./lineEndCapShapes.coffee":7}],6:[function(_dereq_,module,exports){
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


},{"./shapes":12,"./util":14}],10:[function(_dereq_,module,exports){
var INFINITE, JSONToShape, renderWatermark, util;

util = _dereq_('./util');

JSONToShape = _dereq_('./shapes').JSONToShape;

INFINITE = 'infinite';

renderWatermark = function(ctx, image, scale) {
  if (!image.width) {
    return;
  }
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  return ctx.restore();
};

module.exports = function(snapshot, opts) {
  var allShapes, backgroundShapes, colors, height, imageSize, s, shapes, watermarkCanvas, watermarkCtx, width;
  if (opts == null) {
    opts = {};
  }
  if (opts.scale == null) {
    opts.scale = 1;
  }
  shapes = (function() {
    var _i, _len, _ref, _results;
    _ref = snapshot.shapes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i];
      _results.push(JSONToShape(s));
    }
    return _results;
  })();
  backgroundShapes = [];
  if (snapshot.backgroundShapes) {
    backgroundShapes = (function() {
      var _i, _len, _ref, _results;
      _ref = snapshot.backgroundShapes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        _results.push(JSONToShape(s));
      }
      return _results;
    })();
  }
  imageSize = snapshot.imageSize || {
    width: INFINITE,
    height: INFINITE
  };
  width = imageSize.width, height = imageSize.height;
  colors = snapshot.colors || {
    background: 'transparent'
  };
  allShapes = shapes.concat(backgroundShapes);
  watermarkCanvas = document.createElement('canvas');
  watermarkCtx = watermarkCanvas.getContext('2d');
  if (opts.margin == null) {
    opts.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  if (!opts.rect) {
    opts.rect = util.getBoundingRect((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = allShapes.length; _i < _len; _i++) {
        s = allShapes[_i];
        _results.push(s.getBoundingRect(watermarkCtx));
      }
      return _results;
    })(), width === INFINITE ? 0 : width, height === INFINITE ? 0 : height);
  }
  opts.rect.x -= opts.margin.left;
  opts.rect.y -= opts.margin.top;
  opts.rect.width += opts.margin.left + opts.margin.right;
  opts.rect.height += opts.margin.top + opts.margin.bottom;
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
  return util.combineCanvases(watermarkCanvas, util.renderShapes(backgroundShapes, opts.rect, opts.scale), util.renderShapes(shapes, opts.rect, opts.scale));
};


},{"./shapes":12,"./util":14}],11:[function(_dereq_,module,exports){
var INFINITE, JSONToShape, util;

util = _dereq_('./util');

JSONToShape = _dereq_('./shapes').JSONToShape;

INFINITE = 'infinite';

module.exports = function(snapshot, opts) {
  var allShapes, backgroundShapes, colors, ctx, dummyCanvas, height, imageSize, s, shapes, width;
  if (opts == null) {
    opts = {};
  }
  shapes = (function() {
    var _i, _len, _ref, _results;
    _ref = snapshot.shapes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i];
      _results.push(JSONToShape(s));
    }
    return _results;
  })();
  backgroundShapes = [];
  if (snapshot.backgroundShapes) {
    backgroundShapes = (function() {
      var _i, _len, _ref, _results;
      _ref = snapshot.backgroundShapes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        _results.push(JSONToShape(s));
      }
      return _results;
    })();
  }
  imageSize = snapshot.imageSize || {
    width: INFINITE,
    height: INFINITE
  };
  width = imageSize.width, height = imageSize.height;
  colors = snapshot.colors || {
    background: 'transparent'
  };
  allShapes = shapes.concat(backgroundShapes);
  dummyCanvas = document.createElement('canvas');
  ctx = dummyCanvas.getContext('2d');
  if (opts.margin == null) {
    opts.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  if (!opts.rect) {
    opts.rect = util.getBoundingRect((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = allShapes.length; _i < _len; _i++) {
        s = allShapes[_i];
        _results.push(s.getBoundingRect(ctx));
      }
      return _results;
    })(), width === INFINITE ? 0 : width, height === INFINITE ? 0 : height);
  }
  opts.rect.x -= opts.margin.left;
  opts.rect.y -= opts.margin.top;
  opts.rect.width += opts.margin.left + opts.margin.right;
  opts.rect.height += opts.margin.top + opts.margin.bottom;
  return LC.renderShapesToSVG(backgroundShapes.concat(shapes), opts.rect, colors.background);
};


},{"./shapes":12,"./util":14}],12:[function(_dereq_,module,exports){
var JSONToShape, LinePath, TextRenderer, bspline, createShape, defineCanvasRenderer, defineSVGRenderer, defineShape, lineEndCapShapes, linePathFuncs, renderShapeToContext, renderShapeToSVG, shapeToJSON, shapes, util, _createLinePathFromData, _doAllPointsShareStyle, _dual, _mid, _ref, _ref1, _refine;

util = _dereq_('./util');

TextRenderer = _dereq_('./TextRenderer');

lineEndCapShapes = _dereq_('./lineEndCapShapes.coffee');

_ref = _dereq_('./canvasRenderer'), defineCanvasRenderer = _ref.defineCanvasRenderer, renderShapeToContext = _ref.renderShapeToContext;

_ref1 = _dereq_('./svgRenderer'), defineSVGRenderer = _ref1.defineSVGRenderer, renderShapeToSVG = _ref1.renderShapeToSVG;

shapes = {};

defineShape = function(name, props) {
  var Shape, drawFunc, drawLatestFunc, k, legacyDrawFunc, legacyDrawLatestFunc, legacySVGFunc, svgFunc;
  Shape = function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    props.constructor.call(this, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
    return this;
  };
  Shape.prototype.className = name;
  Shape.fromJSON = props.fromJSON;
  if (props.draw) {
    legacyDrawFunc = props.draw;
    legacyDrawLatestFunc = props.draw || function(ctx, bufferCtx, retryCallback) {
      return this.draw(ctx, bufferCtx, retryCallback);
    };
    drawFunc = function(ctx, shape, retryCallback) {
      return legacyDrawFunc.call(shape, ctx, retryCallback);
    };
    drawLatestFunc = function(ctx, bufferCtx, shape, retryCallback) {
      return legacyDrawLatestFunc.call(shape, ctx, bufferCtx, retryCallback);
    };
    delete props.draw;
    if (props.drawLatest) {
      delete props.drawLatest;
    }
    defineCanvasRenderer(name, drawFunc, drawLatestFunc);
  }
  if (props.toSVG) {
    legacySVGFunc = props.toSVG;
    svgFunc = function(shape) {
      return legacySVGFunc.call(shape);
    };
    delete props.toSVG;
    defineSVGRenderer(name, svgFunc);
  }
  Shape.prototype.draw = function(ctx, retryCallback) {
    return renderShapeToContext(ctx, this, {
      retryCallback: retryCallback
    });
  };
  Shape.prototype.drawLatest = function(ctx, bufferCtx, retryCallback) {
    return renderShapeToContext(ctx, this, {
      retryCallback: retryCallback,
      bufferCtx: bufferCtx,
      shouldOnlyDrawLatest: true
    });
  };
  Shape.prototype.toSVG = function() {
    return renderShapeToSVG(this);
  };
  for (k in props) {
    if (k !== 'fromJSON') {
      Shape.prototype[k] = props[k];
    }
  }
  shapes[name] = Shape;
  return Shape;
};

createShape = function(name, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
  var s;
  s = new shapes[name](a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
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
    this.scale = args.scale || 1;
    return this.image = args.image || null;
  },
  getBoundingRect: function() {
    return {
      x: this.x,
      y: this.y,
      width: this.image.width,
      height: this.image.height,
      scale: this.scale
    };
  },
  toJSON: function() {
    return {
      x: this.x,
      y: this.y,
      imageSrc: this.image.src,
      imageObject: this.image,
      scale: this.scale
    };
  },
  fromJSON: function(data) {
    var img, _ref2;
    img = null;
    if ((_ref2 = data.imageObject) != null ? _ref2.width : void 0) {
      img = data.imageObject;
    } else {
      img = new Image();
      img.src = data.imageSrc;
    }
    return createShape('Image', {
      x: data.x,
      y: data.y,
      image: img,
      scale: data.scale
    });
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
    this.color = args.color || 'black';
    this.capStyle = args.capStyle || 'round';
    this.endCapShapes = args.endCapShapes || [null, null];
    return this.dash = args.dash || null;
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
      var _i, _len, _ref2, _results;
      _ref2 = data.points;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pointData = _ref2[_i];
        _results.push(JSONToShape(pointData));
      }
      return _results;
    })();
  } else if (data.pointCoordinatePairs) {
    points = (function() {
      var _i, _len, _ref2, _ref3, _results;
      _ref2 = data.pointCoordinatePairs;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], x = _ref3[0], y = _ref3[1];
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
      var _i, _len, _ref2, _ref3, _results;
      _ref2 = data.smoothedPointCoordinatePairs;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], x = _ref3[0], y = _ref3[1];
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
          var _i, _len, _ref2, _results;
          _ref2 = this.points;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            point = _ref2[_i];
            _results.push([point.x, point.y]);
          }
          return _results;
        }).call(this),
        smoothedPointCoordinatePairs: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.smoothedPoints;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            point = _ref2[_i];
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
          var _i, _len, _ref2, _results;
          _ref2 = this.points;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            p = _ref2[_i];
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
  }
};

LinePath = defineShape('LinePath', linePathFuncs);

defineShape('ErasedLinePath', {
  constructor: linePathFuncs.constructor,
  toJSON: linePathFuncs.toJSON,
  addPoint: linePathFuncs.addPoint,
  getBoundingRect: linePathFuncs.getBoundingRect,
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
  getBoundingRect: function() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
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

defineShape('Polygon', {
  constructor: function(args) {
    var point, _i, _len, _ref2, _results;
    if (args == null) {
      args = {};
    }
    this.points = args.points;
    this.fillColor = args.fillColor || 'white';
    this.strokeColor = args.strokeColor || 'black';
    this.strokeWidth = args.strokeWidth;
    this.dash = args.dash || null;
    if (args.isClosed == null) {
      args.isClosed = true;
    }
    this.isClosed = args.isClosed;
    _ref2 = this.points;
    _results = [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      point = _ref2[_i];
      point.color = this.strokeColor;
      _results.push(point.size = this.strokeWidth);
    }
    return _results;
  },
  addPoint: function(x, y) {
    return this.points.push(LC.createShape('Point', {
      x: x,
      y: y
    }));
  },
  getBoundingRect: function() {
    return util.getBoundingRect(this.points.map(function(p) {
      return p.getBoundingRect();
    }));
  },
  toJSON: function() {
    return {
      strokeWidth: this.strokeWidth,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      dash: this.dash,
      isClosed: this.isClosed,
      pointCoordinatePairs: this.points.map(function(p) {
        return [p.x, p.y];
      })
    };
  },
  fromJSON: function(data) {
    data.points = data.pointCoordinatePairs.map(function(_arg) {
      var x, y;
      x = _arg[0], y = _arg[1];
      return createShape('Point', {
        x: x,
        y: y,
        size: data.strokeWidth,
        color: data.strokeColor
      });
    });
    return createShape('Polygon', data);
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
      x: Math.floor(this.x),
      y: Math.floor(this.y),
      width: Math.ceil(this.renderer.getWidth(true)),
      height: Math.ceil(this.renderer.getHeight())
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
  }
});

defineShape('SelectionBox', {
  constructor: function(args) {
    if (args == null) {
      args = {};
    }
    this.shape = args.shape;
    this.handleSize = 10;
    this.margin = 4;
    this.backgroundColor = args.backgroundColor || null;
    return this._br = this.shape.getBoundingRect(args.ctx);
  },
  toJSON: function() {
    return {
      shape: shapeToJSON(this.shape),
      backgroundColor: this.backgroundColor
    };
  },
  fromJSON: function(_arg) {
    var backgroundColor, handleSize, margin, shape;
    shape = _arg.shape, handleSize = _arg.handleSize, margin = _arg.margin, backgroundColor = _arg.backgroundColor;
    return createShape('SelectionBox', {
      shape: JSONToShape(shape),
      backgroundColor: backgroundColor
    });
  },
  getTopLeftHandleRect: function() {
    return {
      x: this._br.x - this.handleSize - this.margin,
      y: this._br.y - this.handleSize - this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBottomLeftHandleRect: function() {
    return {
      x: this._br.x - this.handleSize - this.margin,
      y: this._br.y + this._br.height + this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getTopRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + this.margin,
      y: this._br.y - this.handleSize - this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBottomRightHandleRect: function() {
    return {
      x: this._br.x + this._br.width + this.margin,
      y: this._br.y + this._br.height + this.margin,
      width: this.handleSize,
      height: this.handleSize
    };
  },
  getBoundingRect: function() {
    return {
      x: this._br.x - this.margin,
      y: this._br.y - this.margin,
      width: this._br.width + this.margin * 2,
      height: this._br.height + this.margin * 2
    };
  }
});

module.exports = {
  defineShape: defineShape,
  createShape: createShape,
  JSONToShape: JSONToShape,
  shapeToJSON: shapeToJSON
};


},{"./TextRenderer":2,"./canvasRenderer":5,"./lineEndCapShapes.coffee":7,"./svgRenderer":13,"./util":14}],13:[function(_dereq_,module,exports){
var defineSVGRenderer, lineEndCapShapes, renderShapeToSVG, renderers;

lineEndCapShapes = _dereq_('./lineEndCapShapes.coffee');

renderers = {};

defineSVGRenderer = function(shapeName, shapeToSVGFunc) {
  return renderers[shapeName] = shapeToSVGFunc;
};

renderShapeToSVG = function(shape, opts) {
  if (opts == null) {
    opts = {};
  }
  if (opts.shouldIgnoreUnsupportedShapes == null) {
    opts.shouldIgnoreUnsupportedShapes = false;
  }
  if (renderers[shape.className]) {
    return renderers[shape.className](shape);
  } else if (opts.shouldIgnoreUnsupportedShapes) {
    console.warn("Can't render shape of type " + shape.className + " to SVG");
    return "";
  } else {
    throw "Can't render shape of type " + shape.className + " to SVG";
  }
};

defineSVGRenderer('Rectangle', function(shape) {
  var height, width, x, x1, x2, y, y1, y2;
  x1 = shape.x;
  y1 = shape.y;
  x2 = shape.x + shape.width;
  y2 = shape.y + shape.height;
  x = Math.min(x1, x2);
  y = Math.min(y1, y2);
  width = Math.max(x1, x2) - x;
  height = Math.max(y1, y2) - y;
  if (shape.strokeWidth % 2 !== 0) {
    x += 0.5;
    y += 0.5;
  }
  return "<rect x='" + x + "' y='" + y + "' width='" + width + "' height='" + height + "' stroke='" + shape.strokeColor + "' fill='" + shape.fillColor + "' stroke-width='" + shape.strokeWidth + "' />";
});

defineSVGRenderer('SelectionBox', function(shape) {
  return "";
});

defineSVGRenderer('Ellipse', function(shape) {
  var centerX, centerY, halfHeight, halfWidth;
  halfWidth = Math.floor(shape.width / 2);
  halfHeight = Math.floor(shape.height / 2);
  centerX = shape.x + halfWidth;
  centerY = shape.y + halfHeight;
  return "<ellipse cx='" + centerX + "' cy='" + centerY + "' rx='" + (Math.abs(halfWidth)) + "' ry='" + (Math.abs(halfHeight)) + "' stroke='" + shape.strokeColor + "' fill='" + shape.fillColor + "' stroke-width='" + shape.strokeWidth + "' />";
});

defineSVGRenderer('Image', function(shape) {
  return "<image x='" + shape.x + "' y='" + shape.y + "' width='" + (shape.image.naturalWidth * shape.scale) + "' height='" + (shape.image.naturalHeight * shape.scale) + "' xlink:href='" + shape.image.src + "' />";
});

defineSVGRenderer('Line', function(shape) {
  var arrowWidth, capString, dashString, x1, x2, y1, y2;
  dashString = shape.dash ? "stroke-dasharray='" + (shape.dash.join(', ')) + "'" : '';
  capString = '';
  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
  x1 = shape.x1;
  x2 = shape.x2;
  y1 = shape.y1;
  y2 = shape.y2;
  if (shape.strokeWidth % 2 !== 0) {
    x1 += 0.5;
    x2 += 0.5;
    y1 += 0.5;
    y2 += 0.5;
  }
  if (shape.endCapShapes[0]) {
    capString += lineEndCapShapes[shape.endCapShapes[0]].svg(x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
  }
  if (shape.endCapShapes[1]) {
    capString += lineEndCapShapes[shape.endCapShapes[1]].svg(x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
  }
  return "<g> <line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' " + dashString + " stroke-linecap='" + shape.capStyle + "' stroke='" + shape.color + " 'stroke-width='" + shape.strokeWidth + "' /> " + capString + " </g>";
});

defineSVGRenderer('LinePath', function(shape) {
  return "<polyline fill='none' points='" + (shape.smoothedPoints.map(function(p) {
    var offset;
    offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
    return "" + (p.x + offset) + "," + (p.y + offset);
  }).join(' ')) + "' stroke='" + shape.points[0].color + "' stroke-linecap='round' stroke-width='" + shape.points[0].size + "' />";
});

defineSVGRenderer('ErasedLinePath', function(shape) {
  return "";
});

defineSVGRenderer('Polygon', function(shape) {
  if (shape.isClosed) {
    return "<polygon fill='" + shape.fillColor + "' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return "" + (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='" + shape.strokeColor + "' stroke-width='" + shape.strokeWidth + "' />";
  } else {
    return "<polyline fill='" + shape.fillColor + "' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return "" + (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='none' /> <polyline fill='none' points='" + (shape.points.map(function(p) {
      var offset;
      offset = p.strokeWidth % 2 === 0 ? 0.0 : 0.5;
      return "" + (p.x + offset) + "," + (p.y + offset);
    }).join(' ')) + "' stroke='" + shape.strokeColor + "' stroke-width='" + shape.strokeWidth + "' />";
  }
});

defineSVGRenderer('Text', function(shape) {
  var heightString, textSplitOnLines, widthString;
  widthString = shape.forcedWidth ? "width='" + shape.forcedWidth + "px'" : "";
  heightString = shape.forcedHeight ? "height='" + shape.forcedHeight + "px'" : "";
  textSplitOnLines = shape.text.split(/\r\n|\r|\n/g);
  if (shape.renderer) {
    textSplitOnLines = shape.renderer.lines;
  }
  return "<text x='" + shape.x + "' y='" + shape.y + "' " + widthString + " " + heightString + " fill='" + shape.color + "' style='font: " + shape.font + ";'> " + (textSplitOnLines.map((function(_this) {
    return function(line, i) {
      var dy;
      dy = i === 0 ? 0 : '1.2em';
      return "<tspan x='" + shape.x + "' dy='" + dy + "' alignment-baseline='text-before-edge'> " + line + " </tspan>";
    };
  })(this)).join('')) + " </text>";
});

module.exports = {
  defineSVGRenderer: defineSVGRenderer,
  renderShapeToSVG: renderShapeToSVG
};


},{"./lineEndCapShapes.coffee":7}],14:[function(_dereq_,module,exports){
var renderShapeToContext, renderShapeToSVG, slice, util,
  __slice = [].slice;

slice = Array.prototype.slice;

renderShapeToContext = _dereq_('./canvasRenderer').renderShapeToContext;

renderShapeToSVG = _dereq_('./svgRenderer').renderShapeToSVG;

util = {
  addImageOnload: function(img, fn) {
    var oldOnload;
    oldOnload = img.onload;
    img.onload = function() {
      if (typeof oldOnload === "function") {
        oldOnload();
      }
      return fn();
    };
    return img;
  },
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
  classSet: function(classNameToIsPresent) {
    var classNames, key;
    classNames = [];
    for (key in classNameToIsPresent) {
      if (classNameToIsPresent[key]) {
        classNames.push(key);
      }
    }
    return classNames.join(' ');
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
      renderShapeToContext(ctx, shape);
    }
    return canvas;
  },
  renderShapesToSVG: function(shapes, _arg, backgroundColor) {
    var height, width, x, y;
    x = _arg.x, y = _arg.y, width = _arg.width, height = _arg.height;
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='" + width + "' height='" + height + "' viewBox='0 0 " + width + " " + height + "'> <rect width='" + width + "' height='" + height + "' x='0' y='0' fill='" + backgroundColor + "' /> <g transform='translate(" + (-x) + ", " + (-y) + ")'> " + (shapes.map(renderShapeToSVG).join('')) + " </g> </svg>").replace(/(\r\n|\n|\r)/gm, "");
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
  })(),
  requestAnimationFrame: function(f) {
    if (window.webkitRequestAnimationFrame) {
      return window.webkitRequestAnimationFrame(f);
    }
    if (window.requestAnimationFrame) {
      return window.requestAnimationFrame(f);
    }
    if (window.mozRequestAnimationFrame) {
      return window.mozRequestAnimationFrame(f);
    }
    return setTimeout(f, 0);
  },
  cancelAnimationFrame: function(f) {
    if (window.webkitCancelRequestAnimationFrame) {
      return window.webkitCancelRequestAnimationFrame(f);
    }
    if (window.webkitCancelAnimationFrame) {
      return window.webkitCancelAnimationFrame(f);
    }
    if (window.cancelAnimationFrame) {
      return window.cancelAnimationFrame(f);
    }
    if (window.mozCancelAnimationFrame) {
      return window.mozCancelAnimationFrame(f);
    }
    return clearTimeout(f);
  }
};

module.exports = util;


},{"./canvasRenderer":5,"./svgRenderer":13}],15:[function(_dereq_,module,exports){
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
},{}],16:[function(_dereq_,module,exports){
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
},{}],17:[function(_dereq_,module,exports){
var LiterallyCanvas, baseTools, canvasRenderer, conversion, defaultImageURLPrefix, defaultTools, init, localize, registerJQueryPlugin, renderSnapshotToImage, renderSnapshotToSVG, setDefaultImageURLPrefix, shapes, svgRenderer, tools, util;

_dereq_('./ie_customevent');

_dereq_('./ie_setLineDash');

LiterallyCanvas = _dereq_('./core/LiterallyCanvas');

canvasRenderer = _dereq_('./core/canvasRenderer');

svgRenderer = _dereq_('./core/svgRenderer');

shapes = _dereq_('./core/shapes');

util = _dereq_('./core/util');

renderSnapshotToImage = _dereq_('./core/renderSnapshotToImage');

renderSnapshotToSVG = _dereq_('./core/renderSnapshotToSVG');

localize = _dereq_('./core/localization').localize;

conversion = {
  snapshotToShapes: function(snapshot) {
    var shape, _i, _len, _ref, _results;
    _ref = snapshot.shapes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shape = _ref[_i];
      _results.push(shapes.JSONToShape(shape));
    }
    return _results;
  },
  snapshotJSONToShapes: function(json) {
    return conversion.snapshotToShapes(JSON.parse(json));
  }
};

baseTools = _dereq_('./tools/base');

tools = {
  Pencil: _dereq_('./tools/Pencil'),
  Eraser: _dereq_('./tools/Eraser'),
  Line: _dereq_('./tools/Line'),
  Rectangle: _dereq_('./tools/Rectangle'),
  Ellipse: _dereq_('./tools/Ellipse'),
  Text: _dereq_('./tools/Text'),
  Polygon: _dereq_('./tools/Polygon'),
  Pan: _dereq_('./tools/Pan'),
  Eyedropper: _dereq_('./tools/Eyedropper'),
  Tool: baseTools.Tool,
  ToolWithStroke: baseTools.ToolWithStroke
};

defaultTools = [tools.Pencil, tools.Eraser, tools.Line, tools.Rectangle, tools.Ellipse, tools.Text, tools.Polygon, tools.Pan, tools.Eyedropper];

defaultImageURLPrefix = 'lib/img';

setDefaultImageURLPrefix = function(newDefault) {
  return defaultImageURLPrefix = newDefault;
};

init = function(el, opts) {
  var child, drawingViewElement, lc, teardown, topOrBottomClassName, _i, _len, _ref;
  if (opts == null) {
    opts = {};
  }
  if (opts.imageURLPrefix == null) {
    opts.imageURLPrefix = defaultImageURLPrefix;
  }
  if (opts.primaryColor == null) {
    opts.primaryColor = 'hsla(0, 0%, 0%, 1)';
  }
  if (opts.secondaryColor == null) {
    opts.secondaryColor = 'hsla(0, 0%, 100%, 1)';
  }
  if (opts.backgroundColor == null) {
    opts.backgroundColor = 'transparent';
  }
  if (opts.strokeWidths == null) {
    opts.strokeWidths = [1, 2, 5, 10, 20, 30];
  }
  if (opts.defaultStrokeWidth == null) {
    opts.defaultStrokeWidth = 5;
  }
  if (opts.toolbarPosition == null) {
    opts.toolbarPosition = 'top';
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
  if (opts.zoomMin == null) {
    opts.zoomMin = 0.2;
  }
  if (opts.zoomMax == null) {
    opts.zoomMax = 4.0;
  }
  if (opts.zoomStep == null) {
    opts.zoomStep = 0.2;
  }
  if (opts.snapshot == null) {
    opts.snapshot = null;
  }
  if (!('tools' in opts)) {
    opts.tools = defaultTools;
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
  topOrBottomClassName = 'toolbar-hidden';
  el.className = el.className + ' ' + topOrBottomClassName;
  drawingViewElement = document.createElement('div');
  drawingViewElement.className = 'lc-drawing';
  el.appendChild(drawingViewElement);

  /* and get to work */
  lc = new LiterallyCanvas(drawingViewElement, opts);
  if ('onInit' in opts) {
    opts.onInit(lc);
  }
  teardown = function() {
    lc._teardown();
    return drawingViewElement.remove();
  };
  lc.teardown = teardown;
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
  setDefaultImageURLPrefix: setDefaultImageURLPrefix,
  defaultTools: defaultTools,
  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,
  defineCanvasRenderer: canvasRenderer.defineCanvasRenderer,
  renderShapeToContext: canvasRenderer.renderShapeToContext,
  renderShapeToCanvas: canvasRenderer.renderShapeToCanvas,
  renderShapesToCanvas: util.renderShapes,
  defineSVGRenderer: svgRenderer.defineSVGRenderer,
  renderShapeToSVG: svgRenderer.renderShapeToSVG,
  renderShapesToSVG: util.renderShapesToSVG,
  snapshotToShapes: conversion.snapshotToShapes,
  snapshotJSONToShapes: conversion.snapshotJSONToShapes,
  renderSnapshotToImage: renderSnapshotToImage,
  renderSnapshotToSVG: renderSnapshotToSVG,
  localize: localize
};


},{"./core/LiterallyCanvas":1,"./core/canvasRenderer":5,"./core/localization":8,"./core/renderSnapshotToImage":10,"./core/renderSnapshotToSVG":11,"./core/shapes":12,"./core/svgRenderer":13,"./core/util":14,"./ie_customevent":15,"./ie_setLineDash":16,"./tools/Ellipse":18,"./tools/Eraser":19,"./tools/Eyedropper":20,"./tools/Line":21,"./tools/Pan":22,"./tools/Pencil":23,"./tools/Polygon":24,"./tools/Rectangle":25,"./tools/Text":26,"./tools/base":27}],18:[function(_dereq_,module,exports){
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


},{"../core/shapes":12,"./base":27}],19:[function(_dereq_,module,exports){
var Eraser, Pencil, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Pencil = _dereq_('./Pencil');

createShape = _dereq_('../core/shapes').createShape;

module.exports = Eraser = (function(_super) {
  __extends(Eraser, _super);

  function Eraser() {
    return Eraser.__super__.constructor.apply(this, arguments);
  }

  Eraser.prototype.name = 'Eraser';

  Eraser.prototype.iconName = 'eraser';

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


},{"../core/shapes":12,"./Pencil":23}],20:[function(_dereq_,module,exports){
var Eyedropper, Tool,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Tool = _dereq_('./base').Tool;

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


},{"./base":27}],21:[function(_dereq_,module,exports){
var Line, ToolWithStroke, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ToolWithStroke = _dereq_('./base').ToolWithStroke;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Line = (function(_super) {
  __extends(Line, _super);

  function Line() {
    return Line.__super__.constructor.apply(this, arguments);
  }

  Line.prototype.name = 'Line';

  Line.prototype.iconName = 'line';

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

})(ToolWithStroke);


},{"../core/shapes":12,"./base":27}],22:[function(_dereq_,module,exports){
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

  Pan.prototype.usesSimpleAPI = false;

  Pan.prototype.didBecomeActive = function(lc) {
    var unsubscribeFuncs;
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
    unsubscribeFuncs.push(lc.on('lc-pointerdown', (function(_this) {
      return function(_arg) {
        var rawX, rawY;
        rawX = _arg.rawX, rawY = _arg.rawY;
        _this.oldPosition = lc.position;
        return _this.pointerStart = {
          x: rawX,
          y: rawY
        };
      };
    })(this)));
    return unsubscribeFuncs.push(lc.on('lc-pointerdrag', (function(_this) {
      return function(_arg) {
        var dp, rawX, rawY;
        rawX = _arg.rawX, rawY = _arg.rawY;
        dp = {
          x: (rawX - _this.pointerStart.x) * lc.backingScale,
          y: (rawY - _this.pointerStart.y) * lc.backingScale
        };
        return lc.setPan(_this.oldPosition.x + dp.x, _this.oldPosition.y + dp.y);
      };
    })(this)));
  };

  Pan.prototype.willBecomeInactive = function(lc) {
    return this.unsubscribe();
  };

  return Pan;

})(Tool);


},{"../core/shapes":12,"./base":27}],23:[function(_dereq_,module,exports){
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


},{"../core/shapes":12,"./base":27}],24:[function(_dereq_,module,exports){
var Polygon, ToolWithStroke, createShape,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ToolWithStroke = _dereq_('./base').ToolWithStroke;

createShape = _dereq_('../core/shapes').createShape;

module.exports = Polygon = (function(_super) {
  __extends(Polygon, _super);

  function Polygon() {
    return Polygon.__super__.constructor.apply(this, arguments);
  }

  Polygon.prototype.name = 'Polygon';

  Polygon.prototype.iconName = 'polygon';

  Polygon.prototype.usesSimpleAPI = false;

  Polygon.prototype.didBecomeActive = function(lc) {
    var onDown, onMove, onUp, polygonCancel, polygonFinishClosed, polygonFinishOpen, polygonUnsubscribeFuncs;
    Polygon.__super__.didBecomeActive.call(this, lc);
    polygonUnsubscribeFuncs = [];
    this.polygonUnsubscribe = (function(_this) {
      return function() {
        var func, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = polygonUnsubscribeFuncs.length; _i < _len; _i++) {
          func = polygonUnsubscribeFuncs[_i];
          _results.push(func());
        }
        return _results;
      };
    })(this);
    this.points = null;
    this.maybePoint = null;
    onUp = (function(_this) {
      return function() {
        if (_this._getWillFinish()) {
          return _this._close(lc);
        }
        lc.trigger('lc-polygon-started');
        if (_this.points) {
          _this.points.push(_this.maybePoint);
        } else {
          _this.points = [_this.maybePoint];
        }
        _this.maybePoint = {
          x: _this.maybePoint.x,
          y: _this.maybePoint.y
        };
        lc.setShapesInProgress(_this._getShapes(lc));
        return lc.repaintLayer('main');
      };
    })(this);
    onMove = (function(_this) {
      return function(_arg) {
        var x, y;
        x = _arg.x, y = _arg.y;
        if (_this.maybePoint) {
          _this.maybePoint.x = x;
          _this.maybePoint.y = y;
          lc.setShapesInProgress(_this._getShapes(lc));
          return lc.repaintLayer('main');
        }
      };
    })(this);
    onDown = (function(_this) {
      return function(_arg) {
        var x, y;
        x = _arg.x, y = _arg.y;
        _this.maybePoint = {
          x: x,
          y: y
        };
        lc.setShapesInProgress(_this._getShapes(lc));
        return lc.repaintLayer('main');
      };
    })(this);
    polygonFinishOpen = (function(_this) {
      return function() {
        _this.maybePoint = {
          x: Infinity,
          y: Infinity
        };
        return _this._close(lc);
      };
    })(this);
    polygonFinishClosed = (function(_this) {
      return function() {
        _this.maybePoint = _this.points[0];
        return _this._close(lc);
      };
    })(this);
    polygonCancel = (function(_this) {
      return function() {
        return _this._cancel(lc);
      };
    })(this);
    polygonUnsubscribeFuncs.push(lc.on('drawingChange', (function(_this) {
      return function() {
        return _this._cancel(lc);
      };
    })(this)));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerdown', onDown));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerdrag', onMove));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointermove', onMove));
    polygonUnsubscribeFuncs.push(lc.on('lc-pointerup', onUp));
    polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishopen', polygonFinishOpen));
    polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishclosed', polygonFinishClosed));
    return polygonUnsubscribeFuncs.push(lc.on('lc-polygon-cancel', polygonCancel));
  };

  Polygon.prototype.willBecomeInactive = function(lc) {
    Polygon.__super__.willBecomeInactive.call(this, lc);
    if (this.points || this.maybePoint) {
      this._cancel(lc);
    }
    return this.polygonUnsubscribe();
  };

  Polygon.prototype._getArePointsClose = function(a, b) {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) < 10;
  };

  Polygon.prototype._getWillClose = function() {
    if (!(this.points && this.points.length > 1)) {
      return false;
    }
    if (!this.maybePoint) {
      return false;
    }
    return this._getArePointsClose(this.points[0], this.maybePoint);
  };

  Polygon.prototype._getWillFinish = function() {
    if (!(this.points && this.points.length > 1)) {
      return false;
    }
    if (!this.maybePoint) {
      return false;
    }
    return this._getArePointsClose(this.points[0], this.maybePoint) || this._getArePointsClose(this.points[this.points.length - 1], this.maybePoint);
  };

  Polygon.prototype._cancel = function(lc) {
    lc.trigger('lc-polygon-stopped');
    this.maybePoint = null;
    this.points = null;
    lc.setShapesInProgress([]);
    return lc.repaintLayer('main');
  };

  Polygon.prototype._close = function(lc) {
    lc.trigger('lc-polygon-stopped');
    lc.setShapesInProgress([]);
    if (this.points.length > 2) {
      lc.saveShape(this._getShape(lc, false));
    }
    this.maybePoint = null;
    return this.points = null;
  };

  Polygon.prototype._getShapes = function(lc, isInProgress) {
    var shape;
    if (isInProgress == null) {
      isInProgress = true;
    }
    shape = this._getShape(lc, isInProgress);
    if (shape) {
      return [shape];
    } else {
      return [];
    }
  };

  Polygon.prototype._getShape = function(lc, isInProgress) {
    var points;
    if (isInProgress == null) {
      isInProgress = true;
    }
    points = [];
    if (this.points) {
      points = points.concat(this.points);
    }
    if ((!isInProgress) && points.length < 3) {
      return null;
    }
    if (isInProgress && this.maybePoint) {
      points.push(this.maybePoint);
    }
    if (points.length > 1) {
      return createShape('Polygon', {
        isClosed: this._getWillClose(),
        strokeColor: lc.getColor('primary'),
        fillColor: lc.getColor('secondary'),
        strokeWidth: this.strokeWidth,
        points: points.map(function(xy) {
          return createShape('Point', xy);
        })
      });
    } else {
      return null;
    }
  };

  Polygon.prototype.optionsStyle = 'polygon-and-stroke-width';

  return Polygon;

})(ToolWithStroke);


},{"../core/shapes":12,"./base":27}],25:[function(_dereq_,module,exports){
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


},{"../core/shapes":12,"./base":27}],26:[function(_dereq_,module,exports){
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

  function Text() {
    this.text = '';
    this.font = 'bold 18px sans-serif';
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
    unsubscribeFuncs.push(lc.on('drawingChange', switchAway));
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
      ctx: ctx,
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


},{"../core/shapes":12,"./base":27}],27:[function(_dereq_,module,exports){
var Tool, ToolWithStroke, tools,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

tools = {};

tools.Tool = Tool = (function() {
  function Tool() {}

  Tool.prototype.name = null;

  Tool.prototype.iconName = null;

  Tool.prototype.usesSimpleAPI = true;

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

  function ToolWithStroke(lc) {
    this.strokeWidth = lc.opts.defaultStrokeWidth;
  }

  ToolWithStroke.prototype.optionsStyle = 'stroke-width';

  ToolWithStroke.prototype.didBecomeActive = function(lc) {
    var unsubscribeFuncs;
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
    return unsubscribeFuncs.push(lc.on('setStrokeWidth', (function(_this) {
      return function(strokeWidth) {
        return _this.strokeWidth = strokeWidth;
      };
    })(this)));
  };

  ToolWithStroke.prototype.willBecomeInactive = function(lc) {
    return this.unsubscribe();
  };

  return ToolWithStroke;

})(Tool);

module.exports = tools;


},{}]},{},[17])
(17)
});
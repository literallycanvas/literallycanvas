import actions from "./actions";
import bindEvents from "./bindEvents";
import { JSONToShape, shapeToJSON } from "./shapes";
import { renderShapeToContext } from "./canvasRenderer";
import renderSnapshotToImage from "./renderSnapshotToImage";
import renderSnapshotToSVG from "./renderSnapshotToSVG";
import {
    getBackingScale,
    matchElementSize,
    requestAnimationFrame,
    addImageOnload,
    getBoundingRect,
    getDefaultImageRect,
    combineCanvases
} from "./util";


const INFINITE = "infinite";


class LiterallyCanvas {

    constructor(arg1, arg2) {
        this.setImageSize = this.setImageSize.bind(this);
        let opts = null;
        let containerEl = null;
        if (arg1 instanceof HTMLElement) {
            containerEl = arg1;
            opts = arg2;
        } else {
            opts = arg1;
        }

        this.opts = opts || {};

        this.config = {
            zoomMin: opts.zoomMin || 0.2,
            zoomMax: opts.zoomMax || 4.0,
            zoomStep: opts.zoomStep || 0.2
        };

        this.colors = {
            primary: opts.primaryColor || "#000",
            secondary: opts.secondaryColor || "#fff",
            background: opts.backgroundColor || "transparent"
        };

        this.watermarkImage = opts.watermarkImage;
        this.watermarkScale = opts.watermarkScale || 1;

        this.backgroundCanvas = document.createElement("canvas");
        this.backgroundCtx = this.backgroundCanvas.getContext("2d");

        this.canvas = document.createElement("canvas");
        this.canvas.style["background-color"] = "transparent";

        this.buffer = document.createElement("canvas");
        this.buffer.style["background-color"] = "transparent";
        this.ctx = this.canvas.getContext("2d");
        this.bufferCtx = this.buffer.getContext("2d");

        this.backingScale = getBackingScale(this.ctx);

        this.backgroundShapes = opts.backgroundShapes || [];
        this._shapesInProgress = [];
        this.shapes = [];
        this.undoStack = [];
        this.redoStack = [];

        this.isDragging = false;
        this.position = {x: 0, y: 0};
        this.scale = 1.0;
        // GUI immediately replaces this value, but it's initialized so you can have
        // something really simple
        this.setTool(new (this.opts.tools[0])(this));

        this.width = opts.imageSize.width || INFINITE;
        this.height = opts.imageSize.height || INFINITE;

        // This will ensure that we are zoomed to @scale, panned to @position, and
        // that all layers are repainted.
        this.setZoom(this.scale);

        if (opts.snapshot) { this.loadSnapshot(opts.snapshot) }

        this.isBound = false;
        if (containerEl) { this.bindToElement(containerEl) }

        this.respondToSizeChange = function() {};
    }

    bindToElement(containerEl) {
        if (this.containerEl) {
            console.warn("Trying to bind Literally Canvas to a DOM element more than once is unsupported.");
            return;
        }

        this.containerEl = containerEl;
        this._unsubscribeEvents = bindEvents(this, this.containerEl, this.opts.keyboardShortcuts);
        this.containerEl.style["background-color"] = this.colors.background;
        this.containerEl.appendChild(this.backgroundCanvas);
        this.containerEl.appendChild(this.canvas);

        this.isBound = true;

        const repaintAll = () => {
            this.keepPanInImageBounds();
            this.repaintAllLayers();
        };

        this.respondToSizeChange = matchElementSize(
            this.containerEl, [this.backgroundCanvas, this.canvas], this.backingScale, repaintAll);

        if (this.watermarkImage) {
            this.watermarkImage.onload = () => this.repaintLayer("background");
        }

        if (this.tool != null) {
            this.tool.didBecomeActive(this);
        }

        repaintAll();
    }

    _teardown() {
        if (this.tool != null) {
            this.tool.willBecomeInactive(this);
        }
        if (typeof this._unsubscribeEvents === "function") {
            this._unsubscribeEvents();
        }
        this.tool = null;
        this.containerEl = null;
        this.isBound = false;
    }

    trigger(name, data) {
        this.canvas.dispatchEvent(new CustomEvent(name, {detail: data}));
        // dispatchEvent has a boolean value that doesn't mean anything to us, so
        // don't let CoffeeScript send it back
        return null;
    }

    on(name, fn) {
        const wrapper = e => fn(e.detail);
        this.canvas.addEventListener(name, wrapper);
        return () => {
            this.canvas.removeEventListener(name, wrapper);
        };
    }

    // actual ratio of drawing-space pixels to perceived pixels, accounting for
    // both zoom and displayPixelWidth. use this when converting between
    // drawing-space and screen-space.
    getRenderScale() { return this.scale * this.backingScale }

    clientCoordsToDrawingCoords(x, y) {
        return {
            x: ((x * this.backingScale) - this.position.x) / this.getRenderScale(),
            y: ((y * this.backingScale) - this.position.y) / this.getRenderScale(),
        };
    }

    drawingCoordsToClientCoords(x, y) {
        return {
            x: (x * this.getRenderScale()) + this.position.x,
            y: (y * this.getRenderScale()) + this.position.y
        };
    }

    setImageSize(width, height) {
        this.width = width || INFINITE;
        this.height = height || INFINITE;
        this.keepPanInImageBounds();
        this.repaintAllLayers();
        this.trigger("imageSizeChange", {width: this.width, height: this.height});
    }

    setTool(tool) {
        if (this.isBound) {
            if (this.tool != null) {
                this.tool.willBecomeInactive(this);
            }
        }
        this.tool = tool;
        this.trigger("toolChange", {tool});
        if (this.isBound) {
            this.tool.didBecomeActive(this);
        }
    }

    setShapesInProgress(newVal) { this._shapesInProgress = newVal }

    pointerDown(x, y) {
        const p = this.clientCoordsToDrawingCoords(x, y);
        if (this.tool.usesSimpleAPI) {
            this.tool.begin(p.x, p.y, this);
            this.isDragging = true;
            this.trigger("drawStart", {tool: this.tool});
        } else {
            this.isDragging = true;
            this.trigger("lc-pointerdown", {tool: this.tool, x: p.x, y: p.y, rawX: x, rawY: y});
        }
    }

    pointerMove(x, y) {
        // FIXME: requestAnimationFrame returns a value to be used in order to
        // cancel animationFrame when it is no longer required...
        requestAnimationFrame(() => {
            const p = this.clientCoordsToDrawingCoords(x, y);
            if (this.tool != null ? this.tool.usesSimpleAPI : undefined) {
                if (this.isDragging) {
                    this.tool.continue(p.x, p.y, this);
                    this.trigger("drawContinue", {tool: this.tool});
                }
            } else {
                if (this.isDragging) {
                    this.trigger("lc-pointerdrag", {tool: this.tool, x: p.x, y: p.y, rawX: x, rawY: y});
                } else {
                    this.trigger("lc-pointermove", {tool: this.tool, x: p.x, y: p.y, rawX: x, rawY: y});
                }
            }
        });
    }

    pointerUp(x, y) {
        const p = this.clientCoordsToDrawingCoords(x, y);
        if (this.tool.usesSimpleAPI) {
            if (this.isDragging) {
                this.tool.end(p.x, p.y, this);
                this.isDragging = false;
                this.trigger("drawEnd", {tool: this.tool});
            }
        } else {
            this.isDragging = false;
            this.trigger("lc-pointerup", {tool: this.tool, x: p.x, y: p.y, rawX: x, rawY: y});
        }
    }

    setColor(name, color) {
        this.colors[name] = color;
        if (!this.isBound) { return }
        switch (name) {
        case "background":
            this.containerEl.style.backgroundColor = this.colors.background;
            this.repaintLayer("background");
            break;
        case "primary":
            this.repaintLayer("main");
            break;
        case "secondary":
            this.repaintLayer("main");
            break;
        }
        this.trigger(`${name}ColorChange`, this.colors[name]);
        if (name === "background") { this.trigger("drawingChange") }
    }

    getColor(name) { return this.colors[name] }

    saveShape(shape, triggerShapeSaveEvent, previousShapeId=null) {
        if (triggerShapeSaveEvent == null) { triggerShapeSaveEvent = true }
        if (!previousShapeId) {
            previousShapeId = this.shapes.length
                ? this.shapes[this.shapes.length-1].id
                : null;
        }
        this.execute(new actions.AddShapeAction(this, shape, previousShapeId));
        if (triggerShapeSaveEvent) {
            this.trigger("shapeSave", {shape, previousShapeId});
        }
        this.trigger("drawingChange");
    }

    pan(x, y) {
    // Subtract because we are moving the viewport
        this.setPan(this.position.x - x, this.position.y - y);
    }

    keepPanInImageBounds() {
        const renderScale = this.getRenderScale();
        let {x, y} = this.position;

        if (this.width !== INFINITE) {
            if (this.canvas.width > (this.width * renderScale)) {
                x = (this.canvas.width - (this.width * renderScale)) / 2;
            } else {
                x = Math.max(Math.min(0, x), this.canvas.width - (this.width * renderScale));
            }
        }

        if (this.height !== INFINITE) {
            if (this.canvas.height > (this.height * renderScale)) {
                y = (this.canvas.height - (this.height * renderScale)) / 2;
            } else {
                y = Math.max(Math.min(0, y), this.canvas.height - (this.height * renderScale));
            }
        }

        this.position = {x, y};
    }

    setPan(x, y) {
        this.position = {x, y};
        this.keepPanInImageBounds();
        this.repaintAllLayers();
        this.trigger("pan", {x: this.position.x, y: this.position.y});
    }

    zoom(factor) {
        let newScale = this.scale + factor;
        newScale = Math.max(newScale, this.config.zoomMin);
        newScale = Math.min(newScale, this.config.zoomMax);
        newScale = Math.round(newScale * 100) / 100;
        this.setZoom(newScale);
    }

    setZoom(scale) {
        const center = this.clientCoordsToDrawingCoords(this.canvas.width / 2, this.canvas.height / 2);
        const oldScale = this.scale;
        this.scale = scale;

        this.position.x = ((this.canvas.width / 2) * this.backingScale) - (center.x * this.getRenderScale());
        this.position.y = ((this.canvas.height / 2) * this.backingScale) - (center.y * this.getRenderScale());

        this.keepPanInImageBounds();

        this.repaintAllLayers();
        this.trigger("zoom", {oldScale, newScale: this.scale});
    }

    setWatermarkImage(newImage) {
        this.watermarkImage = newImage;
        addImageOnload(newImage, () => this.repaintLayer("background"));
        if (newImage.width) { this.repaintLayer("background") }
    }

    repaintAllLayers() {
        for (let key of ["background", "main"]) {
            this.repaintLayer(key);
        }
        return null;
    }

    // Repaints the canvas.
    // If dirty is true then all saved shapes are completely redrawn,
    // otherwise the back buffer is simply copied to the screen as is.
    repaintLayer(repaintLayerKey, dirty) {
        if (dirty == null) { dirty = repaintLayerKey === "main" }
        if (!this.isBound) { return }
        switch (repaintLayerKey) {
        case "background":
            this.backgroundCtx.clearRect(
                0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            var retryCallback = () => this.repaintLayer("background");
            if (this.watermarkImage) {
                this._renderWatermark(this.backgroundCtx, true, retryCallback);
            }
            this.draw(this.backgroundShapes, this.backgroundCtx, retryCallback);
            break;
        case "main":
            retryCallback = () => this.repaintLayer("main", true);
            if (dirty) {
                this.buffer.width = this.canvas.width;
                this.buffer.height = this.canvas.height;
                this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
                this.draw(this.shapes, this.bufferCtx, retryCallback);
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if ((this.canvas.width > 0) && (this.canvas.height > 0)) {
                this.ctx.fillStyle = "#ccc";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.clipped((() => {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(this.buffer, 0, 0);
                }
                ), this.ctx);

                this.clipped((() => {
                    this.transformed((() => {
                        this._shapesInProgress.map((shape) =>
                            renderShapeToContext(
                                this.ctx, shape, {bufferCtx: this.bufferCtx, shouldOnlyDrawLatest: true}));
                    }
                    ), this.ctx, this.bufferCtx);
                }
                ), this.ctx, this.bufferCtx);
            }
            break;
        }

        this.trigger("repaint", {layerKey: repaintLayerKey});
    }

    _renderWatermark(ctx, worryAboutRetina, retryCallback) {
        if (worryAboutRetina == null) { worryAboutRetina = true }
        if (!this.watermarkImage.width) {
            this.watermarkImage.onload = retryCallback;
            return;
        }

        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(this.watermarkScale, this.watermarkScale);
        if (worryAboutRetina) { ctx.scale(this.backingScale, this.backingScale) }
        ctx.drawImage(
            this.watermarkImage, -this.watermarkImage.width / 2, -this.watermarkImage.height / 2);
        ctx.restore();
    }

    // Redraws the back buffer to the screen in its current state
    // then draws the given shape translated and scaled on top of that.
    // This is used for updating a shape while it is being drawn
    // without doing a full repaint.
    // The context is restored to its original state before returning.
    drawShapeInProgress(shape) {
        this.repaintLayer("main", false);
        this.clipped((() => {
            this.transformed((() => {
                renderShapeToContext(
                    this.ctx, shape, {bufferCtx: this.bufferCtx, shouldOnlyDrawLatest: true});
            }
            ), this.ctx, this.bufferCtx);
        }
        ), this.ctx, this.bufferCtx);
    }

    // Draws the given shapes translated and scaled to the given context.
    // The context is restored to its original state before returning.
    draw(shapes, ctx, retryCallback) {
        if (!shapes.length) { return }
        const drawShapes = () => {
            shapes.map((shape) =>
                renderShapeToContext(ctx, shape, {retryCallback}));
        };
        this.clipped((() => this.transformed(drawShapes, ctx)), ctx);
    }

    // Executes the given function after clipping the canvas to the image size.
    // The context is restored to its original state before returning.
    // This should not be called inside an @transformed block.
    clipped(fn, ...contexts) {
        const x = this.width === INFINITE ? 0 : this.position.x;
        const y = this.height === INFINITE ? 0 : this.position.y;
        const width = (this.width === INFINITE) ? this.canvas.width : this.width * this.getRenderScale();
        const height = (this.height === INFINITE) ? this.canvas.height : this.height * this.getRenderScale();

        for (var ctx of contexts) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();
        }

        fn();

        for (ctx of contexts) {
            ctx.restore();
        }
    }

    // Executes the given function after translating and scaling the context.
    // The context is restored to its original state before returning.
    transformed(fn, ...contexts) {
        for (var ctx of contexts) {
            ctx.save();
            ctx.translate(Math.floor(this.position.x), Math.floor(this.position.y));
            const scale = this.getRenderScale();
            ctx.scale(scale, scale);
        }

        fn();

        for (ctx of contexts) {
            ctx.restore();
        }
    }

    clear(triggerClearEvent) {
        if (triggerClearEvent == null) { triggerClearEvent = true }
        const oldShapes = this.shapes;
        const newShapes = [];
        this.setShapesInProgress([]);
        this.execute(new actions.ClearAction(this, oldShapes, newShapes));
        this.repaintLayer("main");
        if (triggerClearEvent) {
            this.trigger("clear", null);
        }
        this.trigger("drawingChange", {});
    }

    execute(action) {
        this.undoStack.push(action);
        action.do();
        this.redoStack = [];
    }

    undo() {
        if (!this.undoStack.length) { return }
        const action = this.undoStack.pop();
        action.undo();
        this.redoStack.push(action);
        this.trigger("undo", {action});
        this.trigger("drawingChange", {});
    }

    redo() {
        if (!this.redoStack.length) { return }
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        action.do();
        this.trigger("redo", {action});
        this.trigger("drawingChange", {});
    }

    canUndo() { return !!this.undoStack.length }
    canRedo() { return !!this.redoStack.length }

    getPixel(x, y) {
        const p = this.drawingCoordsToClientCoords(x, y);
        const pixel = this.ctx.getImageData(p.x, p.y, 1, 1).data;
        if (pixel[3]) {
            return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        } else {
            return null;
        }
    }

    getContentBounds() {
        return getBoundingRect(
            (this.shapes.concat(this.backgroundShapes)).map(s => s.getBoundingRect()),
            this.width === INFINITE ? 0 : this.width,
            this.height === INFINITE ? 0 : this.height);
    }

    getDefaultImageRect(
        explicitSize,
        margin) {
        if (explicitSize == null) { explicitSize = {width: 0, height: 0} }
        if (margin == null) { margin = {top: 0, right: 0, bottom: 0, left: 0} }
        return getDefaultImageRect(
            (this.shapes.concat(this.backgroundShapes).map((s) => s.getBoundingRect(this.ctx))),
            explicitSize,
            margin );
    }

    getImage(opts) {
        if (opts == null) { opts = {} }
        if (opts.includeWatermark == null) { opts.includeWatermark = true }
        if (opts.scaleDownRetina == null) { opts.scaleDownRetina = true }
        if (opts.scale == null) { opts.scale = 1 }
        if (!opts.scaleDownRetina) { opts.scale *= this.backingScale }

        if (opts.includeWatermark) {
            opts.watermarkImage = this.watermarkImage;
            opts.watermarkScale = this.watermarkScale;
            if (!opts.scaleDownRetina) { opts.watermarkScale *= this.backingScale }
        }
        return renderSnapshotToImage(this.getSnapshot(), opts);
    }

    canvasForExport() {
        this.repaintAllLayers();
        return combineCanvases(this.backgroundCanvas, this.canvas);
    }

    canvasWithBackground(backgroundImageOrCanvas) {
        return combineCanvases(backgroundImageOrCanvas, this.canvasForExport());
    }

    getSnapshot(keys=null) {
        if (keys == null) { keys = ["shapes", "imageSize", "colors", "position", "scale", "backgroundShapes"] }
        const snapshot = {};
        for (let k of ["colors", "position", "scale"]) {
            if (keys.indexOf(k) >= 0) { snapshot[k] = this[k] }
        }
        if (keys.indexOf("shapes") >= 0) {
            snapshot.shapes = this.shapes.map( (shape) => shapeToJSON(shape) );
        }
        if (keys.indexOf("backgroundShapes") >= 0) {
            snapshot.backgroundShapes = this.backgroundShapes.map( (shape) => shapeToJSON(shape) );
        }
        if (keys.indexOf("imageSize") >= 0) {
            snapshot.imageSize = {width: this.width, height: this.height};
        }

        return snapshot;
    }
    getSnapshotJSON() {
        console.warn("lc.getSnapshotJSON() is deprecated. use JSON.stringify(lc.getSnapshot()) instead.");
        return JSON.stringify(this.getSnapshot());
    }

    getSVGString(opts) { if (opts == null) { opts = {} } return renderSnapshotToSVG(this.getSnapshot(), opts) }

    loadSnapshot(snapshot) {
        if (!snapshot) { return }

        if (snapshot.colors) {
            for (let k of ["primary", "secondary", "background"]) {
                this.setColor(k, snapshot.colors[k]);
            }
        }

        if (snapshot.shapes) {
            // reset shapes
            this.shapes = [];
            // reset undostack aswell when loading a snapshot
            this.undostack = [];

            for (let shapeRepr of snapshot.shapes) {
                const shape = JSONToShape(shapeRepr);
                if (shape) { this.execute(new actions.AddShapeAction(this, shape)) }
            }
        }

        if (snapshot.backgroundShapes) {
            this.backgroundShapes = (snapshot.backgroundShapes.map((s) => JSONToShape(s)));
        }

        if (snapshot.imageSize) {
            this.width = snapshot.imageSize.width;
            this.height = snapshot.imageSize.height;
        }

        if (snapshot.position) { this.position = snapshot.position }
        if (snapshot.scale) { this.scale = snapshot.scale }

        this.repaintAllLayers();
        this.trigger("snapshotLoad");
        this.trigger("drawingChange", {});
    }

    loadSnapshotJSON(str) {
        console.warn("lc.loadSnapshotJSON() is deprecated. use lc.loadSnapshot(JSON.parse(snapshot)) instead.");
        this.loadSnapshot(JSON.parse(str));
    }
}


export default LiterallyCanvas;
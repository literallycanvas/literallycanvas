/*
 * decaffeinate suggestions:
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {getGUID, last, getBoundingRect} from "./util";
import TextRenderer from "./TextRenderer";
import { defineCanvasRenderer, renderShapeToContext } from "./canvasRenderer";
import { defineSVGRenderer, renderShapeToSVG } from "./svgRenderer";


const shapes = {};

const defineShape = function(name, props) {
    // improve Chrome JIT perf by not using arguments object
    const Shape = function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
        props.constructor.call(this, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
        return this;
    };
    Shape.prototype.className = name;
    Shape.fromJSON = props.fromJSON;

    // support old style of defining canvas drawing methods on shapes
    if (props.draw) {
        const legacyDrawFunc = props.draw;
        const legacyDrawLatestFunc = props.draw || function(ctx, bufferCtx, retryCallback) {
            this.draw(ctx, bufferCtx, retryCallback);
        };
        const drawFunc = (ctx, shape, retryCallback) => legacyDrawFunc.call(shape, ctx, retryCallback);
        const drawLatestFunc = (ctx, bufferCtx, shape, retryCallback) => legacyDrawLatestFunc.call(shape, ctx, bufferCtx, retryCallback);
        delete props.draw;
        if (props.drawLatest) { delete props.drawLatest }

        defineCanvasRenderer(name, drawFunc, drawLatestFunc);
    }

    // support old style of defining SVG drawing methods on shapes
    if (props.toSVG) {
        const legacySVGFunc = props.toSVG;
        const svgFunc = shape => legacySVGFunc.call(shape);
        delete props.toSVG;
        defineSVGRenderer(name, svgFunc);
    }

    Shape.prototype.draw = function(ctx, retryCallback) {
        renderShapeToContext(ctx, this, {retryCallback});
    };
    Shape.prototype.drawLatest = function(ctx, bufferCtx, retryCallback) {
        renderShapeToContext(
            ctx, this, {retryCallback, bufferCtx, shouldOnlyDrawLatest: true});
    };
    Shape.prototype.toSVG = function() {
        renderShapeToSVG(this);
    };

    for (let k in props) {
        if (k !== "fromJSON") {
            Shape.prototype[k] = props[k];
        }
    }

    shapes[name] = Shape;
    return Shape;
};


// improve Chrome JIT perf by not using arguments object
const createShape = function(name, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    const s = new (shapes[name])(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
    s.id = getGUID();
    return s;
};


const JSONToShape = function({className, data, id}) {
    if (className in shapes) {
        const shape = shapes[className].fromJSON(data);
        if (shape) {
            if (id) { shape.id = id }
            return shape;
        } else {
            console.log("Unreadable shape:", className, data);
            return null;
        }
    } else {
        console.log("Unknown shape:", className, data);
        return null;
    }
};


const shapeToJSON = shape => ({className: shape.className, data: shape.toJSON(), id: shape.id});


// this fn depends on Point, but LinePathShape depends on it, so it can't be
// moved out of this file yet.
var bspline = function(points, order) {
    if (!order) {
        return points;
    }
    return bspline(_dual(_dual(_refine(points))), order - 1);
};

var _refine = function(points) {
    points = [points[0]].concat(points).concat(last(points));
    const refined = [];

    let index = 0;
    for (let point of points) {
        refined[index * 2] = point;
        if (points[index + 1]) { refined[(index * 2) + 1] = _mid(point, points[index + 1]) }
        index += 1;
    }

    return refined;
};

var _dual = function(points) {
    const dualed = [];

    let index = 0;
    for (let point of points) {
        if (points[index + 1]) { dualed[index] = _mid(point, points[index + 1]) }
        index += 1;
    }

    return dualed;
};

var _mid = (a, b) =>
    createShape("Point", {
        x: a.x + ((b.x - a.x) / 2),
        y: a.y + ((b.y - a.y) / 2),
        size: a.size + ((b.size - a.size) / 2),
        color: a.color
    })
;


defineShape("Image", {
    // TODO: allow resizing/filling
    constructor(args) {
        if (args == null) { args = {} }
        this.x = args.x || 0;
        this.y = args.y || 0;
        this.scale = args.scale || 1;
        this.image = args.image || null;
        this.crossOrigin = (args.image && args.image.crossOrigin) || null;
    },
    getBoundingRect() {
        return {x: this.x, y: this.y, width: this.image.width * this.scale, height: this.image.height * this.scale};
    },
    toJSON() {
        const toJSONData = {x: this.x, y: this.y, imageSrc: this.image.src, imageObject: this.image, scale: this.scale};
        if (this.crossOrigin) {
            toJSONData["crossOrigin"] = this.crossOrigin;
        }
        return toJSONData;
    },
    fromJSON(data) {
        let img = null;
        if (data.imageObject != null ? data.imageObject.width : undefined) {
            img = data.imageObject;
        } else {
            img = new Image();
            img.src = data.imageSrc;
            if (data.crossOrigin) {
                img.crossOrigin = data.crossOrigin;
            }
        }
        return createShape("Image", {x: data.x, y: data.y, image: img, scale: data.scale});
    },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x = this.x - moveInfo.xDiff;
        this.y = this.y - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        this.x = upperLeft.x;
        this.y = upperLeft.y;
    }
}
);


defineShape("Rectangle", {
    constructor(args) {
        if (args == null) { args = {} }
        this.x = args.x || 0;
        this.y = args.y || 0;
        this.width = args.width || 0;
        this.height = args.height || 0;
        this.strokeWidth = args.strokeWidth || 1;
        this.strokeColor = args.strokeColor || "black";
        this.fillColor = args.fillColor || "transparent";
    },

    getBoundingRect() { return {
        x: this.x - (this.strokeWidth / 2),
        y: this.y - (this.strokeWidth / 2),
        width: this.width + this.strokeWidth,
        height: this.height + this.strokeWidth,
    }; },
    toJSON() { return {x: this.x, y: this.y, width: this.width, height: this.height, strokeWidth: this.strokeWidth, strokeColor: this.strokeColor, fillColor: this.fillColor} },
    fromJSON(data) { return createShape("Rectangle", data) },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x = this.x - moveInfo.xDiff;
        this.y = this.y - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        this.x = upperLeft.x;
        this.y = upperLeft.y;
    }
}
);


// this is pretty similar to the Rectangle shape. maybe consolidate somehow.
defineShape("Ellipse", {
    constructor(args) {
        if (args == null) { args = {} }
        this.x = args.x || 0;
        this.y = args.y || 0;
        this.width = args.width || 0;
        this.height = args.height || 0;
        this.strokeWidth = args.strokeWidth || 1;
        this.strokeColor = args.strokeColor || "black";
        this.fillColor = args.fillColor || "transparent";
    },

    getBoundingRect() { return {
        x: this.x - (this.strokeWidth / 2),
        y: this.y - (this.strokeWidth / 2),
        width: this.width + this.strokeWidth,
        height: this.height + this.strokeWidth,
    }; },
    toJSON() { return {x: this.x, y: this.y, width: this.width, height: this.height, strokeWidth: this.strokeWidth, strokeColor: this.strokeColor, fillColor: this.fillColor} },
    fromJSON(data) { return createShape("Ellipse", data) },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x = this.x - moveInfo.xDiff;
        this.y = this.y - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        this.x = upperLeft.x;
        this.y = upperLeft.y;
    }
}
);


defineShape("Line", {
    constructor(args) {
        if (args == null) { args = {} }
        this.x1 = args.x1 || 0;
        this.y1 = args.y1 || 0;
        this.x2 = args.x2 || 0;
        this.y2 = args.y2 || 0;
        this.strokeWidth = args.strokeWidth || 1;
        this.color = args.color || "black";
        this.capStyle = args.capStyle || "round";
        this.endCapShapes = args.endCapShapes || [null, null];
        this.dash = args.dash || null;
    },

    getBoundingRect() { return {
        x: Math.min(this.x1, this.x2) - (this.strokeWidth / 2),
        y: Math.min(this.y1, this.y2) - (this.strokeWidth / 2),
        width: Math.abs(this.x2 - this.x1) + (this.strokeWidth / 2),
        height: Math.abs(this.y2 - this.y1) + (this.strokeWidth / 2),
    }; },
    toJSON() {
        return {x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2, strokeWidth: this.strokeWidth, color: this.color, capStyle: this.capStyle, dash: this.dash, endCapShapes: this.endCapShapes};
    },
    fromJSON(data) { return createShape("Line", data) },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x1 = this.x1 - moveInfo.xDiff;
        this.y1 = this.y1 - moveInfo.yDiff;
        this.x2 = this.x2 - moveInfo.xDiff;
        this.y2 = this.y2 - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        const br = this.getBoundingRect();
        const xDiff = br.x - upperLeft.x;
        const yDiff = br.y - upperLeft.y;
        this.move({ xDiff, yDiff });
    }
}
);


// returns false if no points because there are no points to share style
const _doAllPointsShareStyle = function(points) {
    if (!points.length) { return false }
    const { size } = points[0];
    const { color } = points[0];
    for (let point of points) {
        if ((point.size !== size) || (point.color !== color)) {
            console.log(size, color, point.size, point.color);
        }
        if ((point.size !== size) || (point.color !== color)) { return false }
    }
    return true;
};


const _createLinePathFromData = function(shapeName, data) {
    let x, y;
    let points = null;
    if (data.points) {
        points = (data.points.map((pointData) => JSONToShape(pointData)));
    } else if (data.pointCoordinatePairs) {
        points = data.pointCoordinatePairs.map(([x, y]) => JSONToShape({
            className: "Point",
            data: {
                x, y, size: data.pointSize, color: data.pointColor,
                smooth: data.smooth
            }
        }));
    }

    let smoothedPoints = null;
    if (data.smoothedPointCoordinatePairs) {
        smoothedPoints = data.smoothedPointCoordinatePairs.map(([x, y]) => JSONToShape({
            className: "Point",
            data: {
                x, y, size: data.pointSize, color: data.pointColor,
                smooth: data.smooth
            }
        }));
    }

    if (!points[0]) { return null }
    return createShape(shapeName, {
        points, smoothedPoints,
        order: data.order, tailSize: data.tailSize, smooth: data.smooth
    });
};


const linePathFuncs = {
    constructor(args) {
        if (args == null) { args = {} }
        const points = args.points || [];
        this.order = args.order || 3;
        this.tailSize = args.tailSize || 3;
        this.smooth = "smooth" in args ? args.smooth : true;

        // The number of smoothed points generated for each point added
        this.segmentSize = Math.pow(2, this.order);

        // The number of points used to calculate the bspline to the newest point
        this.sampleSize = this.tailSize + 1;

        if (args.smoothedPoints) {
            this.points = args.points;
            this.smoothedPoints = args.smoothedPoints;
        } else {
            this.points = [];
            points.map((point) => this.addPoint(point));
        }
    },

    getBoundingRect() {
        return getBoundingRect(this.points.map(p => ({
            x: p.x - (p.size / 2),
            y: p.y - (p.size / 2),
            width: p.size,
            height: p.size,
        }) ));
    },

    toJSON() {
        if (_doAllPointsShareStyle(this.points)) {
            return {
                order: this.order, tailSize: this.tailSize, smooth: this.smooth,
                pointCoordinatePairs: this.points.map((point) => [point.x, point.y]),
                smoothedPointCoordinatePairs: this.smoothedPoints.map((point) => [point.x, point.y]),
                pointSize: this.points[0].size,
                pointColor: this.points[0].color
            };
        } else {
            return {order: this.order, tailSize: this.tailSize, smooth: this.smooth, points: (this.points.map((p) => shapeToJSON(p)))};
        }
    },

    fromJSON(data) { return _createLinePathFromData("LinePath", data) },

    addPoint(point) {
        this.points.push(point);

        if (!this.smooth) {
            this.smoothedPoints = this.points;
            return;
        }

        if (!this.smoothedPoints || (this.points.length < this.sampleSize)) {
            this.smoothedPoints = bspline(this.points, this.order);
        } else {
            this.tail = last(
                bspline(last(this.points, this.sampleSize), this.order),
                this.segmentSize * this.tailSize);

            // Remove the last @tailSize - 1 segments from @smoothedPoints
            // then concat the tail. This is done because smoothed points
            // close to the end of the path will change as new points are
            // added.
            this.smoothedPoints = this.smoothedPoints.slice(
                0, this.smoothedPoints.length - (this.segmentSize * (this.tailSize - 1))
            ).concat(this.tail);
        }
    },

    move( moveInfo ) {
        let pts;
        if (moveInfo == null) { moveInfo = {} }
        if (!this.smooth) {
            pts = this.points;
        } else {
            pts = this.smoothedPoints;
        }

        for (let pt of pts) {
            pt.move(moveInfo);
        }

        this.points = this.smoothedPoints;
    },

    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        const br = this.getBoundingRect();
        const xDiff = br.x - upperLeft.x;
        const yDiff = br.y - upperLeft.y;
        this.move({ xDiff, yDiff });
    }
};

const LinePath = defineShape("LinePath", linePathFuncs);


defineShape("ErasedLinePath", {
    constructor: linePathFuncs.constructor,
    toJSON: linePathFuncs.toJSON,
    addPoint: linePathFuncs.addPoint,
    getBoundingRect: linePathFuncs.getBoundingRect,

    fromJSON(data) { return _createLinePathFromData("ErasedLinePath", data) }
}
);


// this is currently just used for LinePath/ErasedLinePath internal storage.
defineShape("Point", {
    constructor(args) {
        if (args == null) { args = {} }
        this.x = args.x || 0;
        this.y = args.y || 0;
        this.size = args.size || 0;
        this.color = args.color || "";
    },
    getBoundingRect() {
        return {x: this.x - (this.size / 2), y: this.y - (this.size / 2), width: this.size, height: this.size};
    },
    toJSON() { return {x: this.x, y: this.y, size: this.size, color: this.color} },
    fromJSON(data) { return createShape("Point", data) },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x = this.x - moveInfo.xDiff;
        this.y = this.y - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        this.x = upperLeft.x;
        this.y = upperLeft.y;
    }
}
);


defineShape("Polygon", {
    constructor(args) {
        if (args == null) { args = {} }
        this.points = args.points;
        this.fillColor = args.fillColor || "white";
        this.strokeColor = args.strokeColor || "black";
        this.strokeWidth = args.strokeWidth;
        this.dash = args.dash || null;

        if (args.isClosed == null) { args.isClosed = true }
        this.isClosed = args.isClosed;

        // ignore point values
        this.points.forEach( (point) => {
            point.color = this.strokeColor;
            point.size = this.strokeWidth;
        });
    },

    addPoint(x, y) {
        this.points.push(createShape("Point", {x, y}));
    },

    getBoundingRect() {
        return getBoundingRect(this.points.map(p => p.getBoundingRect()));
    },

    toJSON() {
        return {
            strokeWidth: this.strokeWidth, fillColor: this.fillColor, strokeColor: this.strokeColor, dash: this.dash, isClosed: this.isClosed,
            pointCoordinatePairs: this.points.map(p => [p.x, p.y])
        };
    },
    fromJSON(data) {
        data.points = data.pointCoordinatePairs.map(function(...args) {
            const [x, y] = args[0];
            return createShape("Point", {
                x, y, size: data.strokeWidth, color: data.strokeColor
            });
        });
        return createShape("Polygon", data);
    },

    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.points.map((pt) => pt.move(moveInfo));
    },

    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        const br = this.getBoundingRect();
        const xDiff = br.x - upperLeft.x;
        const yDiff = br.y - upperLeft.y;
        this.move({ xDiff, yDiff });
    }
}
);


defineShape("Text", {
    constructor(args) {
        if (args == null) { args = {} }
        this.x = args.x || 0;
        this.y = args.y || 0;
        this.v = args.v || 0;  // version (<1 needs position repaired)
        this.text = args.text || "";
        this.color = args.color || "black";
        this.font  = args.font || "18px sans-serif";
        this.forcedWidth = args.forcedWidth || null;
        this.forcedHeight = args.forcedHeight || null;
    },

    _makeRenderer(ctx) {
        ctx.lineHeight = 1.2;
        this.renderer = new TextRenderer(
            ctx, this.text, this.font, this.forcedWidth, this.forcedHeight);

        if (this.v < 1) {
            console.log("repairing baseline");
            this.v = 1;
            this.x -= this.renderer.metrics.bounds.minx;
            this.y -= this.renderer.metrics.leading - this.renderer.metrics.descent;
        }
    },

    setText(text) {
        this.text = text;
        this.renderer = null;
    },

    setFont(font) {
        this.font = font;
        this.renderer = null;
    },

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    },

    setSize(forcedWidth, forcedHeight) {
        this.forcedWidth = Math.max(forcedWidth, 0);
        this.forcedHeight = Math.max(forcedHeight, 0);
        this.renderer = null;
    },

    enforceMaxBoundingRect(lc) {
        const br = this.getBoundingRect(lc.ctx);
        const lcBoundingRect = {
            x: -lc.position.x / lc.scale,
            y: -lc.position.y / lc.scale,
            width: lc.canvas.width / lc.scale,
            height: lc.canvas.height / lc.scale
        };
        // really just enforce max width
        if ((br.x + br.width) > (lcBoundingRect.x + lcBoundingRect.width)) {
            const dx = br.x - lcBoundingRect.x;
            this.forcedWidth = lcBoundingRect.width - dx - 10;
            this.renderer = null;
        }
    },

    getBoundingRect(ctx, isEditing) {
    // if isEditing == true, add X padding to account for carat
        if (isEditing == null) { isEditing = false }
        if (!this.renderer) {
            if (ctx) {
                this._makeRenderer(ctx);
            } else {
                throw "Must pass ctx if text hasn't been rendered yet";
            }
        }
        return {
            x: Math.floor(this.x), y: Math.floor(this.y),
            width: Math.ceil(this.renderer.getWidth(true)),
            height: Math.ceil(this.renderer.getHeight())
        };
    },
    toJSON() { return {x: this.x, y: this.y, text: this.text, color: this.color, font: this.font, forcedWidth: this.forcedWidth, forcedHeight: this.forcedHeight, v: this.v} },
    fromJSON(data) { return createShape("Text", data) },
    move( moveInfo ) {
        if (moveInfo == null) { moveInfo = {} }
        this.x = this.x - moveInfo.xDiff;
        this.y = this.y - moveInfo.yDiff;
    },
    setUpperLeft(upperLeft) {
        if (upperLeft == null) { upperLeft = {} }
        this.x = upperLeft.x;
        this.y = upperLeft.y;
    }
}
);


defineShape("SelectionBox", {
    constructor(args) {
        if (args == null) { args = {} }
        this.shape = args.shape;
        if (args.handleSize != null) {
            this.handleSize = args.handleSize;
        } else {
            this.handleSize = 10;
        }
        this.margin = 4;
        this.backgroundColor = args.backgroundColor || null;
        this._br = this.shape.getBoundingRect(args.ctx);
    },

    toJSON() { return {shape: shapeToJSON(this.shape), backgroundColor: this.backgroundColor} },
    fromJSON({shape, handleSize, margin, backgroundColor}) {
        return createShape("SelectionBox", {shape: JSONToShape(shape), backgroundColor});
    },

    getTopLeftHandleRect() {
        return {
            x: this._br.x - this.handleSize - this.margin, y: this._br.y - this.handleSize - this.margin,
            width: this.handleSize, height: this.handleSize
        };
    },

    getBottomLeftHandleRect() {
        return {
            x: this._br.x - this.handleSize - this.margin, y: this._br.y + this._br.height + this.margin,
            width: this.handleSize, height: this.handleSize
        };
    },

    getTopRightHandleRect() {
        return {
            x: this._br.x + this._br.width + this.margin, y: this._br.y - this.handleSize - this.margin,
            width: this.handleSize, height: this.handleSize
        };
    },

    getBottomRightHandleRect() {
        return {
            x: this._br.x + this._br.width + this.margin, y: this._br.y + this._br.height + this.margin,
            width: this.handleSize, height: this.handleSize
        };
    },

    getBoundingRect() {
        return {
            x: this._br.x - this.margin, y: this._br.y - this.margin,
            width: this._br.width + (this.margin * 2), height: this._br.height + (this.margin * 2)
        };
    }
});


export {defineShape, createShape, JSONToShape, shapeToJSON};
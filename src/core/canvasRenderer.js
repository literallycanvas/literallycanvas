import lineEndCapShapes from "./lineEndCapShapes";


const renderers = {};

// drawFunc(ctx, shape, retryCallback)
// drawLatest(ctx, bufferCtx, shape, retryCallback)
const defineCanvasRenderer = (shapeName, drawFunc, drawLatestFunc) => renderers[shapeName] = {drawFunc, drawLatestFunc};


const noop = function() {};
const renderShapeToContext = function(ctx, shape, opts) {
    if (opts == null) { opts = {} }
    if (opts.shouldIgnoreUnsupportedShapes == null) { opts.shouldIgnoreUnsupportedShapes = false }
    if (opts.retryCallback == null) { opts.retryCallback = noop }
    if (opts.shouldOnlyDrawLatest == null) { opts.shouldOnlyDrawLatest = false }
    if (opts.bufferCtx == null) { opts.bufferCtx = null }
    const {bufferCtx} = opts;

    if (renderers[shape.className]) {
        if (opts.shouldOnlyDrawLatest && renderers[shape.className].drawLatestFunc) {
            renderers[shape.className].drawLatestFunc(
                ctx, bufferCtx, shape, opts.retryCallback);
        } else {
            renderers[shape.className].drawFunc(ctx, shape, opts.retryCallback);
        }
    } else if (opts.shouldIgnoreUnsupportedShapes) {
        console.warn(`Can't render shape of type ${shape.className} to canvas`);
    } else {
        throw `Can't render shape of type ${shape.className} to canvas`;
    }
};


const renderShapeToCanvas = (canvas, shape, opts) => renderShapeToContext(canvas.getContext("2d"), shape, opts);


defineCanvasRenderer("Rectangle", function(ctx, shape) {
    let { x } = shape;
    let { y } = shape;
    if ((shape.strokeWidth % 2) !== 0) {
        x += 0.5;
        y += 0.5;
    }

    ctx.fillStyle = shape.fillColor;
    ctx.fillRect(x, y, shape.width, shape.height);
    ctx.lineWidth = shape.strokeWidth;
    ctx.strokeStyle = shape.strokeColor;
    ctx.strokeRect(x, y, shape.width, shape.height);
});


defineCanvasRenderer("Ellipse", function(ctx, shape) {
    ctx.save();
    const halfWidth = Math.floor(shape.width / 2);
    const halfHeight = Math.floor(shape.height / 2);
    const centerX = shape.x + halfWidth;
    const centerY = shape.y + halfHeight;

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
    ctx.stroke();
});


defineCanvasRenderer("SelectionBox", (function() {
    const _drawHandle = function(ctx, {x, y}, handleSize) {
        if (handleSize === 0) { return }

        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, handleSize, handleSize);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(x, y, handleSize, handleSize);
    };

    return function(ctx, shape) {
        _drawHandle(ctx, shape.getTopLeftHandleRect(), shape.handleSize);
        _drawHandle(ctx, shape.getTopRightHandleRect(), shape.handleSize);
        _drawHandle(ctx, shape.getBottomLeftHandleRect(), shape.handleSize);
        _drawHandle(ctx, shape.getBottomRightHandleRect(), shape.handleSize);

        if (shape.backgroundColor) {
            ctx.fillStyle = shape.backgroundColor;
            ctx.fillRect(
                shape._br.x - shape.margin,
                shape._br.y - shape.margin,
                shape._br.width + (shape.margin * 2),
                shape._br.height + (shape.margin * 2));
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = shape.backgroundColor || "#000";
        ctx.setLineDash([2, 4]);
        ctx.strokeRect(
            shape._br.x - shape.margin, shape._br.y - shape.margin,
            shape._br.width + (shape.margin * 2), shape._br.height + (shape.margin * 2));

        ctx.setLineDash([]);
    };
})()
);


defineCanvasRenderer("Image", function(ctx, shape, retryCallback) {
    if (shape.image.width) {
        if (shape.scale === 1) {
            ctx.drawImage(shape.image, shape.x, shape.y);
        } else {
            return ctx.drawImage(
                shape.image, shape.x, shape.y,
                shape.image.width * shape.scale, shape.image.height * shape.scale);
        }
    } else if (retryCallback) {
        shape.image.onload = retryCallback;
    }
});


defineCanvasRenderer("Line", function(ctx, shape) {
    if ((shape.x1 === shape.x2) && (shape.y1 === shape.y2)) {
    // browser behavior is not consistent for this case.
        return;
    }

    let { x1 } = shape;
    let { x2 } = shape;
    let { y1 } = shape;
    let { y2 } = shape;
    if ((shape.strokeWidth % 2) !== 0) {
        x1 += 0.5;
        x2 += 0.5;
        y1 += 0.5;
        y2 += 0.5;
    }

    ctx.lineWidth = shape.strokeWidth;
    ctx.strokeStyle = shape.color;
    ctx.lineCap = shape.capStyle;
    if (shape.dash) { ctx.setLineDash(shape.dash) }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (shape.dash) { ctx.setLineDash([]) }

    const arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
    if (shape.endCapShapes[0]) {
        lineEndCapShapes[shape.endCapShapes[0]].drawToCanvas(
            ctx, x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
    }
    if (shape.endCapShapes[1]) {
        lineEndCapShapes[shape.endCapShapes[1]].drawToCanvas(
            ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
    }
});


const _drawRawLinePath = function(ctx, points, close, lineCap) {
    if (close == null) { close = false }
    if (lineCap == null) { lineCap = "round" }
    if (!points.length) { return }

    ctx.lineCap = lineCap;

    ctx.strokeStyle = points[0].color;
    ctx.lineWidth = points[0].size;

    ctx.beginPath();

    if ((points[0].size % 2) === 0) {
        ctx.moveTo(points[0].x, points[0].y);
    } else {
        ctx.moveTo(points[0].x+0.5, points[0].y+0.5);
    }

    for (let point of points.slice(1)) {
        if ((points[0].size % 2) === 0) {
            ctx.lineTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x+0.5, point.y+0.5);
        }
    }

    if (close) {
        ctx.closePath();
    }
};


const drawLinePath = function(ctx, shape) {
    _drawRawLinePath(ctx, shape.smoothedPoints);
    ctx.stroke();
};
const drawLinePathLatest = function(ctx, bufferCtx, shape) {
    if (shape.tail) {
        const segmentStart =
      shape.smoothedPoints.length - (shape.segmentSize * shape.tailSize);
        const drawStart =
      segmentStart < (shape.segmentSize * 2) ? 0 : segmentStart;

        const drawEnd = segmentStart + shape.segmentSize + 1;

        _drawRawLinePath(bufferCtx, shape.smoothedPoints.slice(drawStart, drawEnd));
        bufferCtx.stroke();
    } else {
        _drawRawLinePath(bufferCtx, shape.smoothedPoints);
        bufferCtx.stroke();
    }
};


defineCanvasRenderer("LinePath", drawLinePath, drawLinePathLatest);


// same as the line path funcs, but erase instead of draw
const drawErasedLinePath = function(ctx, shape) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    drawLinePath(ctx, shape);
    ctx.restore();
};
const drawErasedLinePathLatest = function(ctx, bufferCtx, shape) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    bufferCtx.save();
    bufferCtx.globalCompositeOperation = "destination-out";

    drawLinePathLatest(ctx, bufferCtx, shape);

    ctx.restore();
    bufferCtx.restore();
};


defineCanvasRenderer(
    "ErasedLinePath", drawErasedLinePath, drawErasedLinePathLatest);


defineCanvasRenderer("Text", function(ctx, shape) {
    if (!shape.renderer) { shape._makeRenderer(ctx) }
    ctx.fillStyle = shape.color;
    shape.renderer.draw(ctx, shape.x, shape.y);
});


defineCanvasRenderer("Polygon", function(ctx, shape) {
    ctx.fillStyle = shape.fillColor;
    _drawRawLinePath(ctx, shape.points, shape.isClosed, "butt");
    ctx.fill();
    ctx.stroke();
});


export {
    defineCanvasRenderer, renderShapeToCanvas, renderShapeToContext
};
import {renderShapes, combineCanvases, getDefaultImageRect} from "./util";
import { JSONToShape } from "./shapes";


// mostly copypasta from LiterallyCanvas.coffee
const INFINITE = "infinite";
const renderWatermark = function(ctx, image, scale) {
    if (!image.width) { return }

    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
};

const renderSnapshotToImage = function(snapshot, opts) {
    let s;
    if (opts == null) { opts = {} }
    if (opts.scale == null) { opts.scale = 1 }

    const shapes = snapshot.shapes.map((s) => JSONToShape(s));
    let backgroundShapes = snapshot.backgroundShapes.map((s) => JSONToShape(s));

    if (opts.margin == null) { opts.margin = {top: 0, right: 0, bottom: 0, left: 0} }
    const imageSize = snapshot.imageSize || {width: INFINITE, height: INFINITE};

    const colors = snapshot.colors || {background: "transparent"};
    const allShapes = shapes.concat(backgroundShapes);

    const watermarkCanvas = document.createElement("canvas");
    const watermarkCtx = watermarkCanvas.getContext("2d");

    if (opts.rect) {
        opts.rect.x -= opts.margin.left;
        opts.rect.y -= opts.margin.top;
        opts.rect.width += opts.margin.left + opts.margin.right;
        opts.rect.height += opts.margin.top + opts.margin.bottom;
    } else {
        opts.rect = getDefaultImageRect(
            allShapes.map((s) => s.getBoundingRect(watermarkCtx)),
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

    return combineCanvases(
        watermarkCanvas,
        renderShapes(backgroundShapes, opts.rect, opts.scale),
        renderShapes(shapes, opts.rect, opts.scale));
};


export default renderSnapshotToImage;
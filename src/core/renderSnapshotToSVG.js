import { getDefaultImageRect, renderShapesToSVG } from "./util";
import { JSONToShape } from "./shapes";


const INFINITE = "infinite";


const renderSnapshotToSVG = function(snapshot, opts) {
    if (opts == null) { opts = {} }
    const shapes = snapshot.shapes.map((s) => JSONToShape(s));
    const backgroundShapes = snapshot.backgroundShapes.map((s) => JSONToShape(s));

    if (opts.margin == null) { opts.margin = {top: 0, right: 0, bottom: 0, left: 0} }
    const imageSize = snapshot.imageSize || {width: INFINITE, height: INFINITE};

    const colors = snapshot.colors || {background: "transparent"};
    const allShapes = shapes.concat(backgroundShapes);

    const dummyCanvas = document.createElement("canvas");
    const ctx = dummyCanvas.getContext("2d");

    if (opts.rect) {
        opts.rect.x -= opts.margin.left;
        opts.rect.y -= opts.margin.top;
        opts.rect.width += opts.margin.left + opts.margin.right;
        opts.rect.height += opts.margin.top + opts.margin.bottom;
    } else {
        opts.rect = getDefaultImageRect(
            allShapes.map((s) => s.getBoundingRect(ctx)),
            imageSize,
            opts.margin
        );
    }

    return renderShapesToSVG(
        backgroundShapes.concat(shapes), opts.rect, colors.background);
};


export default renderSnapshotToSVG;
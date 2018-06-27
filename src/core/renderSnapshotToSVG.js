import util from "./util";
import { JSONToShape } from "./shapes";


const INFINITE = "infinite";


const renderSnapshotToSVG = function(snapshot, opts) {
    let s;
    if (opts == null) { opts = {} }
    const shapes = ((() => {
        // FIXME: Decaffeinate IIFE
        const result = [];
        for (s of snapshot.shapes) {
            result.push(JSONToShape(s));
        }
        return result;
    })());
    let backgroundShapes = [];
    if (snapshot.backgroundShapes) {
        backgroundShapes = ((() => {
            // FIXME: Decaffeinate IIFE
            const result1 = [];
            for (s of snapshot.backgroundShapes) {
                result1.push(JSONToShape(s));
            }
            return result1;
        })());
    }

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
        opts.rect = util.getDefaultImageRect(
            ((() => {
                // FIXME: Decaffeinate IIFE
                const result2 = [];
                for (s of allShapes) {
                    result2.push(s.getBoundingRect(ctx));
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


export default renderSnapshotToSVG;
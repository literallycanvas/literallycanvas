import { renderShapeToContext } from "./canvasRenderer";
import { renderShapeToSVG } from "./svgRenderer";


function addImageOnload(img, fn) {
    const oldOnload = img.onload;
    img.onload = function() {
        if (typeof oldOnload === "function") {
            oldOnload();
        }
        fn();
    };
    return img;
}

function last(array, n = null) {
    if (n) {
        return Array.prototype.slice.call(array, Math.max(array.length - n, 0));
    } else {
        return array[array.length - 1];
    }
}

function classSet(classNameToIsPresent) {
    const classNames = [];
    for (let key in classNameToIsPresent) {
        if (classNameToIsPresent[key]) {
            classNames.push(key);
        }
    }
    return classNames.join(" ");
}

function matchElementSize(elementToMatch, elementsToResize, scale, callback) {
    if (callback == null) { callback = function() {} }
    const resize = () => {
        for (let el of elementsToResize) {
            el.style.width = `${elementToMatch.offsetWidth}px`;
            el.style.height = `${elementToMatch.offsetHeight}px`;
            if (el.width != null) {
                el.setAttribute("width", el.offsetWidth * scale);
                el.setAttribute("height", el.offsetHeight * scale);
            }
        }
        callback();
    };

    elementToMatch.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    resize();
    return resize;
}

function combineCanvases(...canvases) {
    const c = document.createElement("canvas");
    c.width = canvases[0].width;
    c.height = canvases[0].height;
    for (var canvas of canvases) {
        c.width = Math.max(canvas.width, c.width);
        c.height = Math.max(canvas.height, c.height);
    }
    const ctx = c.getContext("2d");

    for (canvas of canvases) {
        ctx.drawImage(canvas, 0, 0);
    }
    return c;
}

function renderShapes(shapes, bounds, scale, canvas=null) {
    if (scale == null) { scale = 1 }
    canvas = canvas || document.createElement("canvas");
    canvas.width = bounds.width * scale;
    canvas.height = bounds.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.translate(-bounds.x * scale, -bounds.y * scale);
    ctx.scale(scale, scale);
    for (let shape of shapes) {
        renderShapeToContext(ctx, shape);
    }
    return canvas;
}

function renderShapesToSVG(shapes, {x, y, width, height}, backgroundColor) {
    return `\
<svg \
xmlns='http://www.w3.org/2000/svg' \
width='${width}' height='${height}' \
viewBox='0 0 ${width} ${height}'> \
<rect width='${width}' height='${height}' x='0' y='0' \
fill='${backgroundColor}' /> \
<g transform='translate(${-x}, ${-y})'> \
${shapes.map((shape) => renderShapeToSVG(shape)).join("")} \
</g> \
</svg>\
`.replace(/(\r\n|\n|\r)/gm,"");
}

// [{x, y, width, height}]
function getBoundingRect(rects, width, height) {
    if (!rects.length) { return {x: 0, y: 0, width: 0 || width, height: 0 || height} }

    // Calculate the bounds for infinite canvas
    let minX = rects[0].x;
    let minY = rects[0].y;
    let maxX = rects[0].x + rects[0].width;
    let maxY = rects[0].y + rects[0].height;
    for (let rect of rects) {
        minX = Math.floor(Math.min(rect.x, minX));
        minY = Math.floor(Math.min(rect.y, minY));
        maxX = Math.ceil(Math.max(maxX, rect.x + rect.width));
        maxY = Math.ceil(Math.max(maxY, rect.y + rect.height));
    }

    // Use the image size bounds if they exist
    minX = width ? 0 : minX;
    minY = height ? 0 : minY;
    maxX = width || maxX;
    maxY = height || maxY;

    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}

// Returns the rect LC will use for exporting images using the given params
function getDefaultImageRect(
    shapeBoundingRects,
    explicitSize,
    margin) {
    if (explicitSize == null) { explicitSize = {width: 0, height: 0} }
    if (margin == null) { margin = {top: 0, right: 0, bottom: 0, left: 0} }
    const {width, height} = explicitSize;

    const rect = getBoundingRect(
        shapeBoundingRects,
        width === "infinite" ? 0 : width,
        height === "infinite" ? 0 : height);

    rect.x -= margin.left;
    rect.y -= margin.top;
    rect.width += margin.left + margin.right;
    rect.height += margin.top + margin.bottom;

    return rect;
}

function getBackingScale(context) {
    if (window.devicePixelRatio == null) { return 1 }
    if (!(window.devicePixelRatio > 1)) { return 1 }
    return window.devicePixelRatio;
}

function getGUID() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + "-" +
    s4() + "-" +
    s4() + "-" +
    s4() + "-" +
    s4() + s4() + s4() ;
}

function requestAnimationFrame(f) {
    if (window.requestAnimationFrame) { return window.requestAnimationFrame(f) }
    if (window.webkitRequestAnimationFrame) { return window.webkitRequestAnimationFrame(f) }
    if (window.mozRequestAnimationFrame) { return window.mozRequestAnimationFrame(f) }
    return setTimeout(f, 0);
}

function cancelAnimationFrame(f) {
    if (window.cancelAnimationFrame) { window.cancelAnimationFrame(f) }
    if (window.webkitCancelRequestAnimationFrame) { window.webkitCancelRequestAnimationFrame(f) }
    if (window.webkitCancelAnimationFrame) { window.webkitCancelAnimationFrame(f) }
    if (window.mozCancelAnimationFrame) { window.mozCancelAnimationFrame(f) }
    clearTimeout(f);
}


export {
    addImageOnload,
    last,
    classSet,
    matchElementSize,
    combineCanvases,
    renderShapes,
    renderShapesToSVG,
    getBoundingRect,
    getDefaultImageRect,
    getBackingScale,
    getGUID,
    requestAnimationFrame,
    cancelAnimationFrame,
};
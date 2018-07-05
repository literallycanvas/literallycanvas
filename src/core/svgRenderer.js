import lineEndCapShapes from "./lineEndCapShapes";


const renderers = {};

// shapeToSVG(shape) -> string
const defineSVGRenderer = (shapeName, shapeToSVGFunc) => renderers[shapeName] = shapeToSVGFunc;


const renderShapeToSVG = function(shape, opts) {
    if (opts == null) { opts = {} }
    if (opts.shouldIgnoreUnsupportedShapes == null) { opts.shouldIgnoreUnsupportedShapes = false }

    if (renderers[shape.className]) {
        return renderers[shape.className](shape);
    } else if (opts.shouldIgnoreUnsupportedShapes) {
        console.warn(`Can't render shape of type ${shape.className} to SVG`);
        return "";
    } else {
        throw `Can't render shape of type ${shape.className} to SVG`;
    }
};

const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
};

const escapeHTML = string => String(string).replace(/[&<>"'`=/]/g, s => entityMap[s]);


defineSVGRenderer("Rectangle", function(shape) {
    const x1 = shape.x;
    const y1 = shape.y;
    const x2 = shape.x + shape.width;
    const y2 = shape.y + shape.height;

    let x = Math.min(x1, x2);
    let y = Math.min(y1, y2);
    const width = Math.max(x1, x2) - x;
    const height = Math.max(y1, y2) - y;

    if ((shape.strokeWidth % 2) !== 0) {
        x += 0.5;
        y += 0.5;
    }

    return `\
<rect x='${x}' y='${y}' \
width='${width}' height='${height}' \
stroke='${shape.strokeColor}' fill='${shape.fillColor}' \
stroke-width='${shape.strokeWidth}' />\
`;
});


defineSVGRenderer("SelectionBox", (() => {}));


defineSVGRenderer("Ellipse", function(shape) {
    const halfWidth = Math.floor(shape.width / 2);
    const halfHeight = Math.floor(shape.height / 2);
    const centerX = shape.x + halfWidth;
    const centerY = shape.y + halfHeight;
    return `\
<ellipse cx='${centerX}' cy='${centerY}' rx='${Math.abs(halfWidth)}' \
ry='${Math.abs(halfHeight)}' \
stroke='${shape.strokeColor}' fill='${shape.fillColor}' \
stroke-width='${shape.strokeWidth}' />\
`;
});


defineSVGRenderer("Image", shape =>
// This will only work when embedded in a web page.
    `\
<image x='${shape.x}' y='${shape.y}' \
width='${shape.image.naturalWidth * shape.scale}' \
height='${shape.image.naturalHeight * shape.scale}' \
xlink:href='${shape.image.src}' />\
`
);


defineSVGRenderer("Line", function(shape) {
    const dashString =
    shape.dash ? `stroke-dasharray='${shape.dash.join(", ")}'` : "";
    let capString = "";
    const arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);

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

    if (shape.endCapShapes[0]) {
        capString += lineEndCapShapes[shape.endCapShapes[0]].svg(
            x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color);
    }
    if (shape.endCapShapes[1]) {
        capString += lineEndCapShapes[shape.endCapShapes[1]].svg(
            x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color);
    }
    return `\
<g> \
<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' \
${dashString} \
stroke-linecap='${shape.capStyle}' \
stroke='${shape.color}' stroke-width='${shape.strokeWidth}' /> \
${capString} \
</g>\
`;
});


defineSVGRenderer("LinePath", shape =>
    `\
<polyline \
fill='none' \
points='${shape.smoothedPoints.map(function(p) {
        const offset = (p.strokeWidth % 2) === 0 ? 0.0 : 0.5;
        return `${p.x+offset},${p.y+offset}`;}).join(" ")
}' \
stroke='${shape.points[0].color}' \
stroke-linecap='round' \
stroke-width='${shape.points[0].size}' />\
`
);


// silently skip erasers
defineSVGRenderer("ErasedLinePath", (() => {}));


defineSVGRenderer("Polygon", function(shape) {
    if (shape.isClosed) {
        return `\
<polygon \
fill='${shape.fillColor}' \
points='${shape.points.map(function(p) {
        const offset = (p.strokeWidth % 2) === 0 ? 0.0 : 0.5;
        return `${p.x+offset},${p.y+offset}`;}).join(" ")
}' \
stroke='${shape.strokeColor}' \
stroke-width='${shape.strokeWidth}' />\
`;
    } else {
        return `\
<polyline \
fill='${shape.fillColor}' \
points='${shape.points.map(function(p) {
        const offset = (p.strokeWidth % 2) === 0 ? 0.0 : 0.5;
        return `${p.x+offset},${p.y+offset}`;}).join(" ")
}' \
stroke='none' /> \
<polyline \
fill='none' \
points='${shape.points.map(function(p) {
        const offset = (p.strokeWidth % 2) === 0 ? 0.0 : 0.5;
        return `${p.x+offset},${p.y+offset}`;}).join(" ")
}' \
stroke='${shape.strokeColor}' \
stroke-width='${shape.strokeWidth}' />\
`;
    }
});


defineSVGRenderer("Text", function(shape) {
    // fallback: don't worry about auto-wrapping
    const widthString =
    shape.forcedWidth ? `width='${shape.forcedWidth}px'` : "";
    const heightString =
    shape.forcedHeight ? `height='${shape.forcedHeight}px'` : "";
    let textSplitOnLines = shape.text.split(/\r\n|\r|\n/g);

    if (shape.renderer) {
        textSplitOnLines = shape.renderer.lines;
    }

    return `\
<text x='${shape.x}' y='${shape.y}' \
${widthString} ${heightString} \
fill='${shape.color}' \
style='font: ${shape.font};'> \
${textSplitOnLines.map((line, i) => {
        const dy = i === 0 ? 0 : "1.2em";
        return `\
<tspan x='${shape.x}' dy='${dy}' alignment-baseline='text-before-edge'> \
${escapeHTML(line)} \
</tspan>`;
    }).join("")} \
</text>\
`;
});


export {defineSVGRenderer, renderShapeToSVG};
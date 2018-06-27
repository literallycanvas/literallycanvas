const math = {};

math.toPoly = function(line) {
    let polyLeft = [];
    let polyRight = [];

    let index = 0;
    for (let point of line) {
        const n = normals(point, _slope(line, index));
        polyLeft = polyLeft.concat([n[0]]);
        polyRight = [n[1]].concat(polyRight);
        index += 1;
    }

    return polyLeft.concat(polyRight);
};

var _slope = function(line, index) {
    let point;
    if (line.length < 3) {
        point =  {x:0, y:0};
    }
    if (index === 0) {
        point = _slope(line, index + 1);
    } else if (index === (line.length - 1)) {
        point = _slope(line, index - 1);
    } else {
        point = math.diff(line[index - 1], line[index + 1]);
    }

    return point;
};

math.diff = (a, b) => ({x: b.x - a.x, y: b.y - a.y});

const unit = function(vector) {
    const length = math.len(vector);
    return {x: vector.x / length, y: vector.y / length};
};

var normals = function(p, slope) {
    slope = unit(slope);
    slope.x = (slope.x * p.size) / 2;
    slope.y = (slope.y * p.size) / 2;
    return [{x: p.x - slope.y, y: p.y + slope.x, color: p.color},
        {x: p.x + slope.y, y: p.y - slope.x, color: p.color}];
};

math.len = vector => Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));

math.scalePositionScalar = function(val, viewportSize, oldScale, newScale) {
    const oldSize = viewportSize * oldScale;
    const newSize = viewportSize * newScale;
    return val + ((oldSize - newSize) / 2);
};


export default math;
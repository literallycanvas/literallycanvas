/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
export default {
  arrow: (function() {
    const getPoints = (x, y, angle, width, length) => [
      {
        x: x + ((Math.cos(angle + (Math.PI / 2)) * width) / 2),
        y: y + ((Math.sin(angle + (Math.PI / 2)) * width) / 2),
      },
      {
        x: x + (Math.cos(angle) * length),
        y: y + (Math.sin(angle) * length),
      },
      {
        x: x + ((Math.cos(angle - (Math.PI / 2)) * width) / 2),
        y: y + ((Math.sin(angle - (Math.PI / 2)) * width) / 2),
      }
    ] ;

    return {
      drawToCanvas(ctx, x, y, angle, width, color, length) {
        if (length == null) { length = 0; }
        length = length || width;

        ctx.fillStyle = color;
        ctx.lineWidth = 0;
        ctx.strokeStyle = 'transparent';
        ctx.beginPath();
        const points = getPoints(x, y, angle, width, length);

        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        return ctx.fill();
      },

      svg(x, y, angle, width, color, length) {
        if (length == null) { length = 0; }
        length = length || width;
        const points = getPoints(x, y, angle, width, length);

        return `\
<polygon \
fill='${color}' stroke='none' \
points='${points.map(p => `${p.x},${p.y}`)}' />\
`;
      }
    };
  })()
};

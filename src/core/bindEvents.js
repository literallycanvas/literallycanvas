// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let bindEvents;
const coordsForTouchEvent = function(el, e) {
  const tx = e.changedTouches[0].clientX;
  const ty = e.changedTouches[0].clientY;
  const p = el.getBoundingClientRect();
  return [tx - p.left, ty - p.top];
};


const position = function(el, e) {
  const p = el.getBoundingClientRect();
  return {
    left: e.clientX - p.left,
    top: e.clientY - p.top,
  };
};


const buttonIsDown = function(e) {
  if (e.buttons != null) {
    return e.buttons === 1;
  } else {
    return e.which > 0;
  }
};


module.exports = (bindEvents = function(lc, canvas, panWithKeyboard) {
  if (panWithKeyboard == null) { panWithKeyboard = false; }
  const unsubs = [];

  const mouseMoveListener = e => {
    e.preventDefault();
    const p = position(canvas, e);
    return lc.pointerMove(p.left, p.top);
  };

  var mouseUpListener = e => {
    e.preventDefault();
    canvas.onselectstart = () => true; // enable selection while dragging
    const p = position(canvas, e);
    lc.pointerUp(p.left, p.top);
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mouseup', mouseUpListener);

    return canvas.addEventListener('mousemove', mouseMoveListener);
  };

  canvas.addEventListener('mousedown', e => {
    if (e.target.tagName.toLowerCase() !== 'canvas') { return; }

    const down = true;
    e.preventDefault();
    canvas.onselectstart = () => false; // disable selection while dragging
    const p = position(canvas, e);
    lc.pointerDown(p.left, p.top);

    canvas.removeEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mousemove', mouseMoveListener);
    return document.addEventListener('mouseup', mouseUpListener);
  });


  const touchMoveListener = function(e) {
    e.preventDefault();
    return lc.pointerMove(...Array.from(coordsForTouchEvent(canvas, e) || []));
  };

  var touchEndListener = function(e) {
    e.preventDefault();
    lc.pointerUp(...Array.from(coordsForTouchEvent(canvas, e) || []));
    document.removeEventListener('touchmove', touchMoveListener);
    document.removeEventListener('touchend', touchEndListener);
    return document.removeEventListener('touchcancel', touchEndListener);
  };

  canvas.addEventListener('touchstart', function(e) {
    if (e.target.tagName.toLowerCase() !== 'canvas') { return; }
    e.preventDefault();
    if (e.touches.length === 1) {
      lc.pointerDown(...Array.from(coordsForTouchEvent(canvas, e) || []));
      document.addEventListener('touchmove', touchMoveListener);
      document.addEventListener('touchend', touchEndListener);
      return document.addEventListener('touchcancel', touchEndListener);
    } else {
      return lc.pointerMove(...Array.from(coordsForTouchEvent(canvas, e) || []));
    }
  });

  if (panWithKeyboard) {
    console.warn("Keyboard panning is deprecated.");
    const listener = function(e) {
      switch (e.keyCode) {
        case 37: lc.pan(-10, 0); break;
        case 38: lc.pan(0, -10); break;
        case 39: lc.pan(10, 0); break;
        case 40: lc.pan(0, 10); break;
      }
      return lc.repaintAllLayers();
    };

    document.addEventListener('keydown', listener);
    unsubs.push(() => document.removeEventListener(listener));
  }

  return () => Array.from(unsubs).map((f) => f());
});

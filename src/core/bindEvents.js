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


const bindEvents = function(lc, canvas, panWithKeyboard) {
    if (panWithKeyboard == null) { panWithKeyboard = false }
    const unsubs = [];

    const mouseMoveListener = e => {
        e.preventDefault();
        const p = position(canvas, e);
        lc.pointerMove(p.left, p.top);
    };

    var mouseUpListener = e => {
        e.preventDefault();
        canvas.onselectstart = () => true; // enable selection while dragging
        const p = position(canvas, e);
        lc.pointerUp(p.left, p.top);
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);

        canvas.addEventListener("mousemove", mouseMoveListener);
    };

    canvas.addEventListener("mousedown", e => {
        if (e.target.tagName.toLowerCase() !== "canvas") { return }

        const down = true;
        e.preventDefault();
        canvas.onselectstart = () => false; // disable selection while dragging
        const p = position(canvas, e);
        lc.pointerDown(p.left, p.top);

        canvas.removeEventListener("mousemove", mouseMoveListener);
        document.addEventListener("mousemove", mouseMoveListener);
        document.addEventListener("mouseup", mouseUpListener);
    });


    const touchMoveListener = function(e) {
        e.preventDefault();
        lc.pointerMove(...coordsForTouchEvent(canvas, e));
    };

    var touchEndListener = function(e) {
        e.preventDefault();
        lc.pointerUp(...coordsForTouchEvent(canvas, e));
        document.removeEventListener("touchmove", touchMoveListener);
        document.removeEventListener("touchend", touchEndListener);
        document.removeEventListener("touchcancel", touchEndListener);
    };

    canvas.addEventListener("touchstart", function(e) {
        if (e.target.tagName.toLowerCase() !== "canvas") { return }
        e.preventDefault();
        if (e.touches.length === 1) {
            lc.pointerDown(...coordsForTouchEvent(canvas, e));
            document.addEventListener("touchmove", touchMoveListener);
            document.addEventListener("touchend", touchEndListener);
            document.addEventListener("touchcancel", touchEndListener);
        } else {
            lc.pointerMove(...coordsForTouchEvent(canvas, e));
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
            lc.repaintAllLayers();
        };

        document.addEventListener("keydown", listener);
        unsubs.push(() => document.removeEventListener(listener));
    }

    return () => unsubs.map((f) => f());
};


export default bindEvents;
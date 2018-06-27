import React from "react";
import ReactDOM from "react-dom";
import LiterallyCanvasModel from "../core/LiterallyCanvas";
import LiterallyCanvasReactComponent from "./LiterallyCanvas";

function init(el, opts) {
    const originalClassName = el.className;
    const lc = new LiterallyCanvasModel(opts);
    ReactDOM.render(<LiterallyCanvasReactComponent lc={lc} />, el);
    lc.teardown = function() {
        lc._teardown();
        for (var i=0; i<el.children.length; i++) {
            el.removeChild(el.children[i]);
        }
        el.className = originalClassName;
    };
    return lc;
}


export default init;
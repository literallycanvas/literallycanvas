const React = require('./React-shim');
const ReactDOM = require('./ReactDOM-shim');
const LiterallyCanvasModel = require('../core/LiterallyCanvas');
const LiterallyCanvasReactComponent = require('./LiterallyCanvas');

function init(el, opts) {
  const originalClassName = el.className
  const lc = new LiterallyCanvasModel(opts)
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

module.exports = init;

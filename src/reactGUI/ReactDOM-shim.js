/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ReactDOM;
try {
    ReactDOM = require("react-dom");
} catch (error) {
    ({ ReactDOM } = window);
}

// can fall back to normal React until 0.15
if (ReactDOM == null) {
    try {
        ReactDOM = require("react");
    } catch (error1) {
        ReactDOM = window.React;
    }
}

if (ReactDOM == null) {
    throw "Can't find ReactDOM";
}
  
export default ReactDOM;

const ReactDOM = require('./ReactDOM-shim');
const createToolButton = require('./createToolButton');
const Options = require('./Options');
const Picker = require('./Picker');

// Renders the React component into a dom node
function init(pickerElement, optionsElement, lc, tools, imageURLPrefix) {
  const toolButtonComponents = tools.map(ToolClass => {
    return createToolButton(new ToolClass(lc));
  });

  const noWrapper = true;
  const pickerProps = { lc, toolButtonComponents, imageURLPrefix, noWrapper };
  const optionsProps = { lc, imageURLPrefix, noWrapper };
  ReactDOM.render(<Picker {...pickerProps} />, pickerElement);
  ReactDOM.render(<Options {...optionsProps} />, optionsElement);
}

module.exports = init;

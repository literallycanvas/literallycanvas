const React = require('../reactGUI/React-shim');
const { findDOMNode } = require('../reactGUI/ReactDOM-shim');
const { classSet } = require('../core/util');
const Picker = require('./Picker');
const Options = require('./Options');
const createToolButton = require('./createToolButton');
const LiterallyCanvasModel = require('../core/LiterallyCanvas');

require('../optionsStyles/font');
require('../optionsStyles/stroke-width');
require('../optionsStyles/line-options-and-stroke-width');
require('../optionsStyles/polygon-and-stroke-width');
require('../optionsStyles/null');

const tools = [
  require('../tools/Pencil'),
  require('../tools/Eraser'),
  require('../tools/Line'),
  require('../tools/Rectangle'),
  require('../tools/Ellipse'),
  require('../tools/Text'),
  require('../tools/Polygon'),
  require('../tools/Pan'),
  require('../tools/Eyedropper')
];


const CanvasContainer = React.createClass({
  displayName: 'CanvasContainer',
  shouldComponentUpdate() {
    // Avoid React trying to control this DOM
    return false;
  },
  render() {
    return (
      <div key="literallycanvas" className="lc-drawing with-gui" />
    );
  }
})

const LiterallyCanvas = React.createClass({
  displayName: 'LiterallyCanvas',
  getDefaultProps() {
    return {
      imageURLPrefix: 'lib/img',
      primaryColor: 'hsla(0, 0%, 0%, 1)',
      secondaryColor: 'hsla(0, 0%, 100%, 1)',
      backgroundColor: 'transparent',
      strokeWidths: [1, 2, 5, 10, 20, 30],
      defaultStrokeWidth: 5,
      toolbarPosition: 'top',
      keyboardShortcuts: false,
      imageSize: {width: 'infinite', height: 'infinite'},
      backgroundShapes: [],
      watermarkImage: null,
      watermarkScale: 1,
      zoomMin: 0.2,
      zoomMax: 4.0,
      zoomStep: 0.2,
      snapshot: null,
      tools
    }
  },
  componentDidMount() {
    if (!this.lc && this.canvas) {
      const canvasContainerDom = findDOMNode(this.canvas);
      const opts = this.props;
      // Create the LC instance now that we have the DOM node reference
      // (Takes two render() cycles to complete)
      this.lc = new LiterallyCanvasModel(canvasContainerDom, opts);
      this.toolButtonComponents = tools.map(ToolClass => {
        const toolInstance = new ToolClass(this.lc);
        return createToolButton({
          displayName: toolInstance.name,
          imageName: toolInstance.iconName,
          getTool: () => toolInstance
        });
      });

      if (typeof opts.onInit === 'function') {
        opts.onInit(this.lc);
      }
      this.forceUpdate();
    }
  },
  componentWillUnmount() {
    if (this.lc) {
      this.lc._teardown();
    }
  },
  render() {
    const { lc, toolButtonComponents, props } = this;
    const { imageURLPrefix, toolbarPosition } = props;
    
    const pickerProps = { lc, toolButtonComponents, imageURLPrefix };
    const topOrBottomClassName = classSet({
      'toolbar-at-top': toolbarPosition === 'top',
      'toolbar-at-bottom': toolbarPosition === 'bottom',
      'toolbar-hidden': toolbarPosition === 'hidden'
    });
    return (
      <div className={`literally ${topOrBottomClassName}`}>
        <CanvasContainer ref={item => this.canvas = item} />
        { lc &&
          <Picker {...pickerProps} />
        }
        { lc &&
          <Options lc={lc} imageURLPrefix={imageURLPrefix} />
        }
      </div>
    );
  }
});
  


module.exports = LiterallyCanvas

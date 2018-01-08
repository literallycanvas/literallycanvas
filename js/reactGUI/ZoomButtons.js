var DOM, React, ZoomButtons, ZoomInButton, ZoomOutButton, classSet, createReactClass, createSetStateOnEventMixin, createZoomButtonComponent;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

createZoomButtonComponent = function(inOrOut) {
  return createReactClass({
    displayName: inOrOut === 'in' ? 'ZoomInButton' : 'ZoomOutButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case inOrOut !== 'in':
              return this.props.lc.scale < this.props.lc.config.zoomMax;
            case inOrOut !== 'out':
              return this.props.lc.scale > this.props.lc.config.zoomMin;
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('zoom')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, ref, src, style, title;
      div = DOM.div, img = DOM.img;
      ref = this.props, lc = ref.lc, imageURLPrefix = ref.imageURLPrefix;
      title = inOrOut === 'in' ? 'Zoom in' : 'Zoom out';
      className = ("lc-zoom-" + inOrOut + " ") + classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case inOrOut !== 'in':
            return function() {
              return lc.zoom(lc.config.zoomStep);
            };
          case inOrOut !== 'out':
            return function() {
              return lc.zoom(-lc.config.zoomStep);
            };
        }
      }).call(this);
      src = imageURLPrefix + "/zoom-" + inOrOut + ".png";
      style = {
        backgroundImage: "url(" + src + ")"
      };
      return div({
        className: className,
        onClick: onClick,
        title: title,
        style: style
      });
    }
  });
};

ZoomOutButton = React.createFactory(createZoomButtonComponent('out'));

ZoomInButton = React.createFactory(createZoomButtonComponent('in'));

ZoomButtons = createReactClass({
  displayName: 'ZoomButtons',
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-zoom'
    }, ZoomOutButton(this.props), ZoomInButton(this.props));
  }
});

module.exports = ZoomButtons;

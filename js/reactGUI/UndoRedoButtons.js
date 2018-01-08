var DOM, React, RedoButton, UndoButton, UndoRedoButtons, classSet, createReactClass, createSetStateOnEventMixin, createUndoRedoButtonComponent;

React = require('./React-shim');

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

createSetStateOnEventMixin = require('./createSetStateOnEventMixin');

classSet = require('../core/util').classSet;

createUndoRedoButtonComponent = function(undoOrRedo) {
  return createReactClass({
    displayName: undoOrRedo === 'undo' ? 'UndoButton' : 'RedoButton',
    getState: function() {
      return {
        isEnabled: (function() {
          switch (false) {
            case undoOrRedo !== 'undo':
              return this.props.lc.canUndo();
            case undoOrRedo !== 'redo':
              return this.props.lc.canRedo();
          }
        }).call(this)
      };
    },
    getInitialState: function() {
      return this.getState();
    },
    mixins: [createSetStateOnEventMixin('drawingChange')],
    render: function() {
      var className, div, imageURLPrefix, img, lc, onClick, ref, src, style, title;
      div = DOM.div, img = DOM.img;
      ref = this.props, lc = ref.lc, imageURLPrefix = ref.imageURLPrefix;
      title = undoOrRedo === 'undo' ? 'Undo' : 'Redo';
      className = ("lc-" + undoOrRedo + " ") + classSet({
        'toolbar-button': true,
        'thin-button': true,
        'disabled': !this.state.isEnabled
      });
      onClick = (function() {
        switch (false) {
          case !!this.state.isEnabled:
            return function() {};
          case undoOrRedo !== 'undo':
            return function() {
              return lc.undo();
            };
          case undoOrRedo !== 'redo':
            return function() {
              return lc.redo();
            };
        }
      }).call(this);
      src = imageURLPrefix + "/" + undoOrRedo + ".png";
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

UndoButton = React.createFactory(createUndoRedoButtonComponent('undo'));

RedoButton = React.createFactory(createUndoRedoButtonComponent('redo'));

UndoRedoButtons = createReactClass({
  displayName: 'UndoRedoButtons',
  render: function() {
    var div;
    div = DOM.div;
    return div({
      className: 'lc-undo-redo'
    }, UndoButton(this.props), RedoButton(this.props));
  }
});

module.exports = UndoRedoButtons;

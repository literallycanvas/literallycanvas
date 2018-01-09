// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DOM = require('../reactGUI/ReactDOMFactories-shim');
const createReactClass = require('../reactGUI/createReactClass-shim');
const createSetStateOnEventMixin = require('./createSetStateOnEventMixin');
const {_} = require('../core/localization');
const {classSet} = require('../core/util');

const ClearButton = createReactClass({
  displayName: 'ClearButton',
  getState() { return {isEnabled: this.props.lc.canUndo()}; },
  getInitialState() { return this.getState(); },
  mixins: [createSetStateOnEventMixin('drawingChange')],

  render() {
    const {div} = DOM;
    const {lc} = this.props;

    const className = classSet({
      'lc-clear': true,
      'toolbar-button': true,
      'fat-button': true,
      'disabled': !this.state.isEnabled
    });
    const onClick = lc.canUndo() ? (() => lc.clear()) : function() {};

    return (div({className, onClick}, _('Clear')));
  }
});


module.exports = ClearButton;

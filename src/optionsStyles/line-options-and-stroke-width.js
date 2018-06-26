/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from '../reactGUI/React-shim';
import DOM from '../reactGUI/ReactDOMFactories-shim';
import createReactClass from '../reactGUI/createReactClass-shim';
import { defineOptionsStyle } from './optionsStyles';
const StrokeWidthPicker = React.createFactory(require('../reactGUI/StrokeWidthPicker'));
const createSetStateOnEventMixin = require('../reactGUI/createSetStateOnEventMixin');
const {classSet} = require('../core/util');

defineOptionsStyle('line-options-and-stroke-width', createReactClass({
  displayName: 'LineOptionsAndStrokeWidth',
  getState() { return {
    strokeWidth: this.props.tool.strokeWidth,
    isDashed: this.props.tool.isDashed,
    hasEndArrow: this.props.tool.hasEndArrow,
  }; },
  getInitialState() { return this.getState(); },
  mixins: [createSetStateOnEventMixin('toolChange')],

  render() {
    const {div, ul, li, img} = DOM;
    const toggleIsDashed = () => {
      this.props.tool.isDashed = !this.props.tool.isDashed;
      return this.setState(this.getState());
    };
    const togglehasEndArrow = () => {
      this.props.tool.hasEndArrow = !this.props.tool.hasEndArrow;
      return this.setState(this.getState());
    };

    const dashButtonClass = classSet({
      'square-toolbar-button': true,
      'selected': this.state.isDashed
    });
    const arrowButtonClass = classSet({
      'square-toolbar-button': true,
      'selected': this.state.hasEndArrow
    });
    const style = {float: 'left', margin: 1};

    return (div({},
      (div({className: dashButtonClass, onClick: toggleIsDashed, style},
        (img({src: `${this.props.imageURLPrefix}/dashed-line.png`}))
      )),
      (div({className: arrowButtonClass, onClick: togglehasEndArrow, style},
        (img({src: `${this.props.imageURLPrefix}/line-with-arrow.png`}))
      )),
      (StrokeWidthPicker({tool: this.props.tool, lc: this.props.lc}))
    ));
  }
})
);

export default {};

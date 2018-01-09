// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const React = require('./React-shim');
const DOM = require('../reactGUI/ReactDOMFactories-shim');
const createReactClass = require('../reactGUI/createReactClass-shim');
const {classSet} = require('../core/util');
const {_} = require('../core/localization');


const createToolButton = function(tool) {
  const displayName = tool.name;
  const imageName = tool.iconName;
  return React.createFactory(createReactClass({
    displayName,
    getDefaultProps() { return {isSelected: false, lc: null}; },
    componentWillMount() {
      if (this.props.isSelected) {
        // prevent race condition with options, tools getting set
        // (I've already forgotten the specifics of this; should reinvestigate
        // and explain here. --steve)
        return this.props.lc.setTool(tool);
      }
    },
    render() {
      const {div, img} = DOM;
      const {imageURLPrefix, isSelected, onSelect} = this.props;

      const className = classSet({
        'lc-pick-tool': true,
        'toolbar-button': true,
        'thin-button': true,
        'selected': isSelected
      });
      const src = `${imageURLPrefix}/${imageName}.png`;
      return (div({
        className,
        style: {'backgroundImage': `url(${src})`},
        onClick() { return onSelect(tool); }, title: _(displayName)}));
    }
  })
  );
};


module.exports = createToolButton;

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from './React-shim';
import DOM from '../reactGUI/ReactDOMFactories-shim';
import createReactClass from '../reactGUI/createReactClass-shim';

const ClearButton = React.createFactory(require('./ClearButton'));
const UndoRedoButtons = React.createFactory(require('./UndoRedoButtons'));
const ZoomButtons = React.createFactory(require('./ZoomButtons'));

const {_} = require('../core/localization');
const ColorWell = React.createFactory(require('./ColorWell'));

const ColorPickers = React.createFactory(createReactClass({
  displayName: 'ColorPickers',
  render() {
    const {lc} = this.props;
    const {div} = DOM;
    return (div({className: 'lc-color-pickers'},
      (ColorWell({lc, colorName: 'primary', label: _('stroke')})),
      (ColorWell({lc, colorName: 'secondary', label: _('fill')})),
      (ColorWell({lc, colorName: 'background', label: _('bg')}))
    ));
  }
})
);


const Picker = createReactClass({
  displayName: 'Picker',
  getInitialState() { return {selectedToolIndex: 0}; },
  renderBody() {
    const {div} = DOM;
    const {toolButtonComponents, lc, imageURLPrefix} = this.props;
    return (div({className: 'lc-picker-contents'},
      toolButtonComponents.map((component, ix) => {
        return (component( 
          {
            lc, imageURLPrefix,
            key: ix,
            isSelected: ix === this.state.selectedToolIndex,
            onSelect: tool => {
              lc.setTool(tool);
              return this.setState({selectedToolIndex: ix});
            }
          })
        );
      }),
      (toolButtonComponents.length % 2) !== 0 ?
        (div({className: 'toolbar-button thin-button disabled'})) : undefined,
      (div({style: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }
    },
        ColorPickers({lc: this.props.lc}),
        UndoRedoButtons({lc, imageURLPrefix}),
        ZoomButtons({lc, imageURLPrefix}),
        ClearButton({lc})
      ))
    ));
  },
  render() {
    const {div} = DOM;
    return (div({className: 'lc-picker'},
      this.renderBody()
    ));
  }
});


export default Picker;

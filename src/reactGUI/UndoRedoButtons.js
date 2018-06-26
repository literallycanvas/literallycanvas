/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { _ } from '../core/localization';
import { classSet } from '../core/util';
import createReactClass from '../reactGUI/createReactClass-shim';
import DOM from '../reactGUI/ReactDOMFactories-shim';
import createSetStateOnEventMixin from './createSetStateOnEventMixin';
import React from './React-shim';

const createUndoRedoButtonComponent = function(undoOrRedo) { return createReactClass({
  displayName: undoOrRedo === 'undo' ? 'UndoButton' : 'RedoButton',

  // We do this a lot, even though it reads as a React no-no.
  // The reason is that '@props.lc' is a monolithic state bucket for
  // Literally Canvas, and does not offer opportunities for encapsulation.
  //
  // However, this component really does read and write only to the 'undo'
  // part of the state bucket, and we have to get react to update somehow, and
  // we don't want the parent to have to worry about this, so it's in @state.
  getState() { return {
    isEnabled: (() => { switch (false) {
      case undoOrRedo !== 'undo': return this.props.lc.canUndo();
      case undoOrRedo !== 'redo': return this.props.lc.canRedo();
    } })()
  }; },
  getInitialState() { return this.getState(); },
  mixins: [createSetStateOnEventMixin('drawingChange')],

  render() {
    const {div, img} = DOM;
    const {lc, imageURLPrefix} = this.props;
    const title = undoOrRedo === 'undo' ? 'Undo' : 'Redo';

    const className = `lc-${undoOrRedo} ` + classSet({
      'toolbar-button': true,
      'thin-button': true,
      'disabled': !this.state.isEnabled
    });
    const onClick = (() => { switch (false) {
      case !!this.state.isEnabled: return function() {};
      case undoOrRedo !== 'undo': return () => lc.undo();
      case undoOrRedo !== 'redo': return () => lc.redo();
    } })();
    const src = `${imageURLPrefix}/${undoOrRedo}.png`;
    const style = {backgroundImage: `url(${src})`};

    return (div({className, onClick, title:_(title), style}));
  }
}); };


const UndoButton = React.createFactory(createUndoRedoButtonComponent('undo'));
const RedoButton = React.createFactory(createUndoRedoButtonComponent('redo'));
const UndoRedoButtons = createReactClass({
  displayName: 'UndoRedoButtons',
  render() {
    const {div} = DOM;
    return (div({className: 'lc-undo-redo'}, UndoButton(this.props), RedoButton(this.props)));
  }
});

export default UndoRedoButtons;
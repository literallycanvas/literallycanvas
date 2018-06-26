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

const createZoomButtonComponent = function(inOrOut) { return createReactClass({
  displayName: inOrOut === 'in' ? 'ZoomInButton' : 'ZoomOutButton',

  getState() { return {
    isEnabled: (() => { switch (false) {
      case inOrOut !== 'in': return this.props.lc.scale < this.props.lc.config.zoomMax;
      case inOrOut !== 'out': return this.props.lc.scale > this.props.lc.config.zoomMin;
    } })()
  }; },
  getInitialState() { return this.getState(); },
  mixins: [createSetStateOnEventMixin('zoom')],

  render() {
    const {div, img} = DOM;
    const {lc, imageURLPrefix} = this.props;
    const title = inOrOut === 'in' ? 'Zoom in' : 'Zoom out';

    const className = `lc-zoom-${inOrOut} ` + classSet({
      'toolbar-button': true,
      'thin-button': true,
      'disabled': !this.state.isEnabled
    });
    const onClick = (() => { switch (false) {
      case !!this.state.isEnabled: return function() {};
      case inOrOut !== 'in': return () => lc.zoom(lc.config.zoomStep);
      case inOrOut !== 'out': return () => lc.zoom(-lc.config.zoomStep);
    } })();
    const src = `${imageURLPrefix}/zoom-${inOrOut}.png`;
    const style = {backgroundImage: `url(${src})`};

    return (div({className, onClick, title:_(title), style}));
  }
}); };


const ZoomOutButton = React.createFactory(createZoomButtonComponent('out'));
const ZoomInButton = React.createFactory(createZoomButtonComponent('in'));
const ZoomButtons = createReactClass({
  displayName: 'ZoomButtons',
  render() {
    const {div} = DOM;
    return (div({className: 'lc-zoom'}, ZoomOutButton(this.props), ZoomInButton(this.props)));
  }
});


export default ZoomButtons;

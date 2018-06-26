import DOM from '../reactGUI/ReactDOMFactories-shim';
import createReactClass from '../reactGUI/createReactClass-shim';
import { defineOptionsStyle } from './optionsStyles';


defineOptionsStyle('null', createReactClass({
  displayName: 'NoOptions',
  render() { return DOM.div(); }
})
);


export default {};
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import DOM from "../reactGUI/ReactDOMFactories-shim";
import createReactClass from "../reactGUI/createReactClass-shim";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { optionsStyles } from "../optionsStyles/optionsStyles";


const Options = createReactClass({
    displayName: "Options",
    getState() { return {
        style: (this.props.lc.tool != null ? this.props.lc.tool.optionsStyle : undefined),
        tool: this.props.lc.tool
    }; },
    getInitialState() { return this.getState() },
    mixins: [createSetStateOnEventMixin("toolChange")],

    renderBody() {
    // style can be null; cast it as a string
        const style = `${this.state.style}`;
        return optionsStyles[style] && optionsStyles[style]({
            lc: this.props.lc, tool: this.state.tool, imageURLPrefix: this.props.imageURLPrefix});
    },

    render() {
        const {div} = DOM;
        return (div({className: "lc-options horz-toolbar"},
            this.renderBody()
        ));
    }
});

export default Options;

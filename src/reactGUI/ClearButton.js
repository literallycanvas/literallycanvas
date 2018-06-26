/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import DOM from "../reactGUI/ReactDOMFactories-shim";
import createReactClass from "../reactGUI/createReactClass-shim";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { _ } from "../core/localization";
import { classSet } from "../core/util";

const ClearButton = createReactClass({
    displayName: "ClearButton",
    getState() { return {isEnabled: this.props.lc.canUndo()} },
    getInitialState() { return this.getState() },
    mixins: [createSetStateOnEventMixin("drawingChange")],

    render() {
        const {div} = DOM;
        const {lc} = this.props;

        const className = classSet({
            "lc-clear": true,
            "toolbar-button": true,
            "fat-button": true,
            "disabled": !this.state.isEnabled
        });
        const onClick = lc.canUndo() ? (() => lc.clear()) : function() {};

        return (div({className, onClick}, _("Clear")));
    }
});


export default ClearButton;

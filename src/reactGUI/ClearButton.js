import DOM from "react-dom-factories";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { _ } from "../core/localization";
import { classSet } from "../core/util";


class ClearButton extends React.Component {

    getState() {
        return {isEnabled: this.props.lc.canUndo()};
    }

    getInitialState() {
        return this.getState();
    }

    mixins = [createSetStateOnEventMixin("drawingChange")];

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
}


export default ClearButton;
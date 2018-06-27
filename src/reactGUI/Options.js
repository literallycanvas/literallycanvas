import DOM from "react-dom-factories";
import React from "react";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { optionsStyles } from "../optionsStyles/optionsStyles";


class Options extends React.Component {
    getState() {
        return {
            style: (this.props.lc.tool != null ? this.props.lc.tool.optionsStyle : undefined),
            tool: this.props.lc.tool
        };
    }

    getInitialState() {
        return this.getState();
    }

    mixins = [createSetStateOnEventMixin("toolChange")];

    renderBody() {
        // style can be null; cast it as a string
        const style = `${this.state.style}`;
        return optionsStyles[style] && optionsStyles[style]({
            lc: this.props.lc, tool: this.state.tool, imageURLPrefix: this.props.imageURLPrefix});
    }

    render() {
        const {div} = DOM;
        return (div({className: "lc-options horz-toolbar"},
            this.renderBody()
        ));
    }
}


export default Options;
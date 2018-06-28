import React from "react";
import { optionsStyles } from "../optionsStyles/optionsStyles";


class Options extends React.Component {

    constructor() {
        super();

        this.state = { tool: null, style: undefined };
    }

    static getDerivedStateFromProps(props) {
        let tool = props.lc.tool;
        return {
            tool: tool,
            style: (tool != null ? tool.optionsStyle : undefined),
        };
    }

    getState() {
        return Options.getDerivedStateFromProps(this.props);
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("toolChange", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    renderBody() {
        // style can be null; cast it as a string
        const style = `${this.state.style}`;
        const StyleComponent = optionsStyles[style];

        return (StyleComponent) && (
            <StyleComponent
                lc={this.props.lc}
                tool={this.state.tool}
                imageURLPrefix={this.props.imageURLPrefix}
            />
        );
    }

    render() {
        return (
            <div className="lc-options horz-toolbar">
                { this.renderBody() }
            </div>
        );
    }
}


export default Options;
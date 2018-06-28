import React from "react";
import { _ } from "../core/localization";
import { classSet } from "../core/util";


class ClearButton extends React.Component {

    constructor() {
        super();

        this.state = { isEnabled: false };
    }

    static getDerivedStateFromProps(props) {
        return {
            isEnabled: props.lc.canUndo()
        };
    }

    getState() {
        return ClearButton.getDerivedStateFromProps(this.props);
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("drawingChange", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    render() {
        const {lc} = this.props;

        const className = classSet({
            "lc-clear": true,
            "toolbar-button": true,
            "fat-button": true,
            "disabled": !this.state.isEnabled
        });
        const onClick = lc.canUndo() ? (() => lc.clear()) : function() {};

        return (
            <div className={className} onClick={onClick}>
                {_("Clear")}
            </div>
        );
    }
}


export default ClearButton;
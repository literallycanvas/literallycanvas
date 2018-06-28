import React from "react";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


class ZoomButton extends React.Component {

    constructor() {
        super();

        this.state = { isEnabled: false };
    }

    static getDerivedStateFromProps(props) {
        let isEnabled =
            (props.action === "in")
                ? props.lc.scale < props.lc.config.zoomMax
                : props.lc.scale > props.lc.config.zoomMin;

        return { isEnabled };
    }

    getState() {
        return ZoomButton.getDerivedStateFromProps(this.props);
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("zoom", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    render() {
        const {lc, imageURLPrefix} = this.props;
        const title = this.props.action === "in" ? "Zoom in" : "Zoom out";

        const className = `lc-zoom-${this.props.action} ` + classSet({
            "toolbar-button": true,
            "thin-button": true,
            "disabled": !this.state.isEnabled
        });

        const onClick =
            this.state.isEnabled
                ? (() => {})
                : this.props.action === "in"
                    ? () => lc.zoom(lc.config.zoomStep)
                    : () => lc.zoom(-lc.config.zoomStep);

        const src = `${imageURLPrefix}/zoom-${this.props.action}.png`;
        const style = {backgroundImage: `url(${src})`};

        return (
            <div className={className} onClick={onClick} title={_(title)} style={style} />
        );
    }
}


class ZoomButtons extends React.Component {
    render() {
        return (
            <div className="lc-zoom">
                <ZoomButton action="out" {...this.props} />
                <ZoomButton action="in" {...this.props} />
            </div>
        );
    }
}


export default ZoomButtons;

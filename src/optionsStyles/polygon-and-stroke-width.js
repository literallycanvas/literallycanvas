import React from "react";
import { defineOptionsStyle } from "./optionsStyles";
import StrokeWidthPicker from "../reactGUI/StrokeWidthPicker";


class PolygonAndStrokeWidth extends React.Component {

    constructor() {
        super();

        this.state = { strokeWidth: 0, inProgress: false };
    }

    static getDerivedStateFromProps(props) {
        return {
            strokeWidth: props.tool.strokeWidth,
            inProgress: false,
        };
    }

    componentDidMount() {

        const unsubscribeFuncs = [];
        this.unsubscribe = () => {
            return unsubscribeFuncs.map((func) =>
                func());
        };

        const showPolygonTools = () => {
            if (!this.state.inProgress) { return this.setState({ inProgress: true }) }
        };

        const hidePolygonTools = () => {
            return this.setState({ inProgress: false });
        const resetState = () => {
            this.setState( PolygonAndStrokeWidth.getDerivedStateFromProps(this.props) );
        };

        unsubscribeFuncs.push(this.props.lc.on("lc-polygon-started", showPolygonTools));
        unsubscribeFuncs.push(this.props.lc.on("lc-polygon-stopped", hidePolygonTools));
        unsubscribeFuncs.push(this.props.lc.on("toolChange", resetState));
    }

    componentWillUnmount() {
        return this.unsubscribe();
    }

    render() {
        const { lc } = this.props;

        const polygonFinishOpen = () => {
            return lc.trigger("lc-polygon-finishopen");
        };

        const polygonFinishClosed = () => {
            return lc.trigger("lc-polygon-finishclosed");
        };

        const polygonCancel = () => {
            return lc.trigger("lc-polygon-cancel");
        };

        let polygonToolStyle = {};
        if (!this.state.inProgress) { polygonToolStyle = {display: "none"} }

        return (
            <div>
                <div className="polygon-toolbar horz-toolbar" style={polygonToolStyle}>
                    <div className="square-toolbar-button" onClick={polygonFinishOpen}>
                        <img src={`${this.props.imageURLPrefix}/polygon-open.png`} />
                    </div>
                    <div className="square-toolbar-button" onClick={polygonFinishClosed}>
                        <img src={`${this.props.imageURLPrefix}/polygon-closed.png`} />
                    </div>
                    <div className="square-toolbar-button" onClick={polygonCancel}>
                        <img src={`${this.props.imageURLPrefix}/polygon-cancel.png`} />
                    </div>
                </div>

                <div>
                    <StrokeWidthPicker tool={this.props.tool} lc={this.props.lc} />
                </div>
            </div>
        );
    }
}


defineOptionsStyle("polygon-and-stroke-width", PolygonAndStrokeWidth);
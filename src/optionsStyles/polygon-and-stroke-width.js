import React from "../reactGUI/React-shim";
import DOM from "../reactGUI/ReactDOMFactories-shim";
import createReactClass from "../reactGUI/createReactClass-shim";
import { defineOptionsStyle } from "./optionsStyles";
const StrokeWidthPicker = React.createFactory(require("../reactGUI/StrokeWidthPicker"));
import createSetStateOnEventMixin from "../reactGUI/createSetStateOnEventMixin";


defineOptionsStyle("polygon-and-stroke-width", createReactClass({
    displayName: "PolygonAndStrokeWidth",
    getState() { return {
        strokeWidth: this.props.tool.strokeWidth,
        inProgress: false
    }; },
    getInitialState() { return this.getState() },
    mixins: [createSetStateOnEventMixin("toolChange")],

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
        };

        unsubscribeFuncs.push(this.props.lc.on("lc-polygon-started", showPolygonTools));
        return unsubscribeFuncs.push(this.props.lc.on("lc-polygon-stopped", hidePolygonTools));
    },

    componentWillUnmount() {
        return this.unsubscribe();
    },

    render() {
        const { lc } = this.props;
        const {div, img} = DOM;

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

        return div({},
            div({className: "polygon-toolbar horz-toolbar", style: polygonToolStyle},
                (div({className: "square-toolbar-button", onClick: polygonFinishOpen},
                    img({src: `${this.props.imageURLPrefix}/polygon-open.png`}))),
                (div({className: "square-toolbar-button", onClick: polygonFinishClosed},
                    img({src: `${this.props.imageURLPrefix}/polygon-closed.png`}))),
                (div({className: "square-toolbar-button", onClick: polygonCancel},
                    img({src: `${this.props.imageURLPrefix}/polygon-cancel.png`})))
            ),
            div({},
                (StrokeWidthPicker({tool: this.props.tool, lc: this.props.lc})))
        );
    }
})
);


export default {};
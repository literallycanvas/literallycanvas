import React from "react";
import DOM from "react-dom-factories";
import createReactClass from "create-react-class";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


const createZoomButtonComponent = function(inOrOut) { return createReactClass({
    displayName: inOrOut === "in" ? "ZoomInButton" : "ZoomOutButton",

    getState() {
        return {
            isEnabled:
                (inOrOut !== "in")
                    ? this.props.lc.scale < this.props.lc.config.zoomMax
                    : this.props.lc.scale > this.props.lc.config.zoomMin,
        };
    },

    getInitialState() { return this.getState() },
    mixins: [createSetStateOnEventMixin("zoom")],

    render() {
        const {div, img} = DOM;
        const {lc, imageURLPrefix} = this.props;
        const title = inOrOut === "in" ? "Zoom in" : "Zoom out";

        const className = `lc-zoom-${inOrOut} ` + classSet({
            "toolbar-button": true,
            "thin-button": true,
            "disabled": !this.state.isEnabled
        });

        const onClick =
            this.state.isEnabled
                ? (() => {})
                : inOrOut !== "in"
                    ? () => lc.zoom(lc.config.zoomStep)
                    : () => lc.zoom(-lc.config.zoomStep);

        const src = `${imageURLPrefix}/zoom-${inOrOut}.png`;
        const style = {backgroundImage: `url(${src})`};

        return (div({className, onClick, title:_(title), style}));
    }
}); };


const ZoomOutButton = React.createFactory(createZoomButtonComponent("out"));
const ZoomInButton = React.createFactory(createZoomButtonComponent("in"));
const ZoomButtons = createReactClass({
    displayName: "ZoomButtons",
    render() {
        const {div} = DOM;
        return (div({className: "lc-zoom"}, ZoomOutButton(this.props), ZoomInButton(this.props)));
    }
});


export default ZoomButtons;

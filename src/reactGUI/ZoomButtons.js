import React from "react";
import DOM from "react-dom-factories";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


class ZoomButton extends React.Component {
    constructor(inOrOut) {
        super();

        // FIXME: Replace by a prop once JSX has been introduced
        this.inOrOut = inOrOut;
    }

    getState() {
        return {
            isEnabled:
                (this.inOrOut !== "in")
                    ? this.props.lc.scale < this.props.lc.config.zoomMax
                    : this.props.lc.scale > this.props.lc.config.zoomMin,
        };
    }

    getInitialState() {
        return this.getState();
    }

    mixins = [createSetStateOnEventMixin("zoom")];

    render() {
        const {div, img} = DOM;
        const {lc, imageURLPrefix} = this.props;
        const title = this.inOrOut === "in" ? "Zoom in" : "Zoom out";

        const className = `lc-zoom-${this.inOrOut} ` + classSet({
            "toolbar-button": true,
            "thin-button": true,
            "disabled": !this.state.isEnabled
        });

        const onClick =
            this.state.isEnabled
                ? (() => {})
                : this.inOrOut !== "in"
                    ? () => lc.zoom(lc.config.zoomStep)
                    : () => lc.zoom(-lc.config.zoomStep);

        const src = `${imageURLPrefix}/zoom-${this.inOrOut}.png`;
        const style = {backgroundImage: `url(${src})`};

        return (div({className, onClick, title:_(title), style}));
    }
}


// FIXME: Remove this class once JSX has been introduced
class ZoomOutButton_ extends ZoomButton {
    constructor() {
        super("out");
    }
}

// FIXME: Remove this class once JSX has been introduced
class ZoomInButton_ extends ZoomButton {
    constructor() {
        super("in");
    }
}


const ZoomOutButton = React.createFactory(ZoomOutButton_);
const ZoomInButton = React.createFactory(ZoomInButton_);

class ZoomButtons extends React.Component {
    render() {
        const {div} = DOM;
        return (div({className: "lc-zoom"}, ZoomOutButton(this.props), ZoomInButton(this.props)));
    }
}


export default ZoomButtons;

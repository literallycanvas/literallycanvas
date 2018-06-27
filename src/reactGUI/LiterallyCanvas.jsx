import React from "../reactGUI/React-shim";
import createReactClass from "../reactGUI/createReactClass-shim";
import { findDOMNode } from "../reactGUI/ReactDOM-shim";
import { classSet } from "../core/util";
import Picker from "./Picker";
import Options from "./Options";
import createToolButton from "./createToolButton";
import LiterallyCanvasModel from "../core/LiterallyCanvas";
import defaultOptions from "../core/defaultOptions";

import "../optionsStyles/font";
import "../optionsStyles/stroke-width";
import "../optionsStyles/line-options-and-stroke-width";
import "../optionsStyles/polygon-and-stroke-width";
import "../optionsStyles/null";


const CanvasContainer = createReactClass({
    displayName: "CanvasContainer",
    shouldComponentUpdate() {
    // Avoid React trying to control this DOM
        return false;
    },
    render() {
        return (
            <div key="literallycanvas" className="lc-drawing with-gui" />
        );
    }
});

const LiterallyCanvas = createReactClass({
    displayName: "LiterallyCanvas",

    getDefaultProps() { return defaultOptions },

    bindToModel() {
        const canvasContainerEl = findDOMNode(this.canvas);
        const opts = this.props;
        this.lc.bindToElement(canvasContainerEl);

        if (typeof this.lc.opts.onInit === "function") {
            this.lc.opts.onInit(this.lc);
        }
    },

    componentWillMount() {
        if (this.lc) return;

        if (this.props.lc) {
            this.lc = this.props.lc;
        } else {
            this.lc = new LiterallyCanvasModel(this.props);
        }

        this.toolButtonComponents = this.lc.opts.tools.map(ToolClass => {
            return createToolButton(new ToolClass(this.lc));
        });
    },

    componentDidMount() {
        if (!this.lc.isBound) {
            this.bindToModel();
        }
    },

    componentWillUnmount() {
        if (this.lc) {
            this.lc._teardown();
        }
    },

    render() {
        const { lc, toolButtonComponents, props } = this;
        const { imageURLPrefix, toolbarPosition, imageSize } = this.lc.opts;

        const pickerProps = { lc, toolButtonComponents, imageURLPrefix };
        const topOrBottomClassName = classSet({
            "toolbar-at-top": toolbarPosition === "top",
            "toolbar-at-bottom": toolbarPosition === "bottom",
            "toolbar-hidden": toolbarPosition === "hidden"
        });

        const style = {};
        if (imageSize.height)
            style.height = imageSize.height;

        return (
            <div className={`literally ${topOrBottomClassName}`} style={style}>
                <CanvasContainer ref={item => this.canvas = item} />
                <Picker {...pickerProps} />
                <Options lc={lc} imageURLPrefix={imageURLPrefix} />
            </div>
        );
    }
});


export default LiterallyCanvas;
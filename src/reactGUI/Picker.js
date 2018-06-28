import React from "react";
import { _ } from "../core/localization";
import ColorWell from "./ColorWell";
import ClearButton from "./ClearButton";
import UndoRedoButtons from "./UndoRedoButtons";
import ZoomButtons from "./ZoomButtons";


class ColorPickers extends React.Component {
    render() {
        const {lc} = this.props;

        return (
            <div className="lc-color-pickers">
                <ColorWell lc={lc} colorName="primary" label={_("stroke")} />
                <ColorWell lc={lc} colorName="secondary" label={_("fill")} />
                <ColorWell lc={lc} colorName="background" label={_("bg")} />
            </div>
        );
    }
}


class Picker extends React.Component {
    constructor() {
        super();
        this.state = {selectedToolIndex: 0};
    }

    renderBody() {
        const {toolButtonComponents, lc, imageURLPrefix} = this.props;

        return (
            <div className="lc-picker-contents">
                {toolButtonComponents.map((Component, ix) => {
                    return (
                        <Component
                            lc={lc}
                            imageURLPrefix={imageURLPrefix}
                            key={ix}
                            isSelected={ix === this.state.selectedToolIndex}
                            onSelect={ (tool) => {
                                lc.setTool(tool);
                                this.setState({selectedToolIndex: ix});
                            }}
                        />
                    );
                })}

                { ((toolButtonComponents.length % 2) !== 0) &&
                    <div className="toolbar-button thin-button disabled" /> }

                <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                }} />

                <ColorPickers lc={lc} />
                <UndoRedoButtons lc={lc} imageURLPrefix={imageURLPrefix} />
                <ZoomButtons lc={lc} imageURLPrefix={imageURLPrefix} />
                <ClearButton lc={lc} />
            </div>
        );
    }

    render() {
        return (
            <div className="lc-picker">
                {this.renderBody()}
            </div>
        );
    }
}


export default Picker;